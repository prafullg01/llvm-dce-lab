/**
 * ir-parser.js — Enhanced LLVM IR Parser with Validation
 */
const IRParser = (() => {
  const TERMINATORS = ['ret','br','switch','indirectbr','invoke','resume',
    'unreachable','cleanupret','catchret','catchswitch','callbr'];
  const SIDE_EFFECT_OPS = ['store','call','invoke','fence','atomicrmw',
    'cmpxchg','callbr','resume','catchswitch','catchret','cleanupret',
    'landingpad','catchpad','cleanuppad'];

  function validate(irText) {
    const errors = [];
    const lines = irText.split('\n');
    let inFunction = false, fnName = '', braceCount = 0, hasFunctions = false;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t || t.startsWith(';')) continue;
      if (t.match(/^define\s/)) {
        if (inFunction) errors.push({ line: i+1, msg: `Nested define inside @${fnName}` });
        inFunction = true; hasFunctions = true;
        const m = t.match(/@(\w+)/); fnName = m ? m[1] : 'unknown';
        if (t.includes('{')) braceCount++;
      }
      if (t === '{') braceCount++;
      if (t === '}') { braceCount--; if (braceCount <= 0) { inFunction = false; braceCount = 0; } }
    }
    if (inFunction) errors.push({ line: lines.length, msg: `Unclosed function @${fnName}` });
    if (!hasFunctions) errors.push({ line: 1, msg: 'No function definitions found' });
    return { valid: errors.length === 0, errors };
  }

  function parse(irText) {
    const lines = irText.split('\n');
    const module = { functions: [], globals: [], declares: [] };
    let currentFn = null, currentBB = null;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed || trimmed.startsWith(';')) continue;
      if (trimmed.startsWith('@') && trimmed.includes('=') && !trimmed.startsWith('define')) {
        module.globals.push({ line: i+1, raw: trimmed }); continue;
      }
      if (trimmed.startsWith('declare')) { module.declares.push({ line: i+1, raw: trimmed }); continue; }
      const fnMatch = trimmed.match(/^define\s+(.+?)\s+@([\w.]+)\s*\(([^)]*)\)/);
      if (fnMatch) {
        currentFn = { name: fnMatch[2], retType: fnMatch[1], params: fnMatch[3], blocks: [], line: i+1 };
        module.functions.push(currentFn); currentBB = null; continue;
      }
      if (trimmed === '}') { currentFn = null; currentBB = null; continue; }
      if (!currentFn) continue;
      const labelMatch = trimmed.match(/^([\w][\w.]*)\s*:/);
      if (labelMatch) {
        currentBB = { label: labelMatch[1], instructions: [], line: i+1 };
        currentFn.blocks.push(currentBB); continue;
      }
      if (!currentBB) { currentBB = { label: 'entry', instructions: [], line: i+1 }; currentFn.blocks.push(currentBB); }
      const instr = parseInstruction(trimmed, i+1);
      if (instr) currentBB.instructions.push(instr);
    }
    resolveUses(module);
    return module;
  }

  function parseInstruction(line, lineNum) {
    const commentIdx = line.indexOf(';');
    const code = commentIdx >= 0 ? line.substring(0, commentIdx).trim() : line.trim();
    if (!code) return null;
    const instr = { raw: code, line: lineNum, result: null, opcode: '',
      isTerminator: false, hasSideEffects: false, users: [], usesOf: [] };
    const assignMatch = code.match(/^(%[\w.]+)\s*=\s*(.+)$/);
    if (assignMatch) { instr.result = assignMatch[1]; parseOpcode(assignMatch[2].trim(), instr); }
    else { parseOpcode(code, instr); }
    instr.isTerminator = TERMINATORS.includes(instr.opcode);
    instr.hasSideEffects = SIDE_EFFECT_OPS.includes(instr.opcode) ||
      code.includes('volatile') || code.includes('atomic');
    const refs = code.match(/%[\w.]+/g) || [];
    refs.forEach(r => { if (r !== instr.result) instr.usesOf.push(r); });
    return instr;
  }

  function parseOpcode(text, instr) {
    const parts = text.split(/\s+/);
    let op = parts[0];
    if (['tail','musttail','notail'].includes(op)) op = parts[1] || op;
    instr.opcode = op;
  }

  function resolveUses(module) {
    for (const fn of module.functions) {
      const defs = new Map();
      for (const bb of fn.blocks) for (const i of bb.instructions) if (i.result) defs.set(i.result, i);
      for (const bb of fn.blocks) for (const i of bb.instructions) for (const ref of i.usesOf) {
        const d = defs.get(ref); if (d) d.users.push(i);
      }
    }
  }

  return { parse, validate, TERMINATORS, SIDE_EFFECT_OPS };
})();
