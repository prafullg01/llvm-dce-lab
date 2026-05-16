/**
 * dce-engine.js — Enhanced DCE Engine v2
 */
const DCEEngine = (() => {
  function getDeadReason(i) {
    if (!i.result) return 'No result and no side effects';
    return `${i.result} has 0 users — value never consumed`;
  }
  function getProtectedReason(i) {
    if (i.opcode === 'store') return 'Store modifies memory visible to other code/threads';
    if (i.opcode === 'call' || i.opcode === 'invoke') return 'Call may have side effects (I/O, exceptions, global state)';
    if (i.opcode === 'fence') return 'Fence enforces memory ordering for concurrency';
    if (i.opcode === 'atomicrmw') return 'Atomic RMW provides synchronization guarantees';
    if (i.opcode === 'landingpad') return 'Landing pad is an exception handling entry point';
    if (i.raw && i.raw.includes('volatile')) return 'Volatile access may target hardware-mapped I/O';
    return 'Instruction has observable side effects';
  }
  function getLiveReason(i) {
    if (i.isTerminator) return `Terminator (${i.opcode}) defines control flow`;
    if (i.users.length > 0) return `Used by ${i.users.length} instruction(s)`;
    return 'Instruction is live';
  }
  function getCascadeReason(i) {
    return `Becomes dead after fixpoint: all ${i.users.length} user(s) are dead`;
  }
  function classifyOpcode(op) {
    const m = { add:'Arithmetic',sub:'Arithmetic',mul:'Arithmetic',sdiv:'Arithmetic',udiv:'Arithmetic',
      fadd:'Arithmetic',fsub:'Arithmetic',fmul:'Arithmetic',fdiv:'Arithmetic',
      and:'Bitwise',or:'Bitwise',xor:'Bitwise',shl:'Bitwise',lshr:'Bitwise',ashr:'Bitwise',
      icmp:'Comparison',fcmp:'Comparison',
      load:'Memory',store:'Memory',alloca:'Memory',getelementptr:'Memory',
      call:'Function Call',invoke:'Function Call',
      br:'Terminator',ret:'Terminator',switch:'Terminator',unreachable:'Terminator',
      phi:'PHI/SSA',select:'Select',
      zext:'TypeCast',sext:'TypeCast',trunc:'TypeCast',bitcast:'TypeCast',
      sitofp:'TypeCast',fptosi:'TypeCast',ptrtoint:'TypeCast',inttoptr:'TypeCast',
      fence:'Atomic',atomicrmw:'Atomic',cmpxchg:'Atomic',landingpad:'Exception' };
    return m[op] || 'Other';
  }

  function analyzeFunction(fn) {
    const result = { name: fn.name, total: 0, dead: [], protected: [], live: [], cascade: [] };
    for (const bb of fn.blocks) {
      for (const instr of bb.instructions) {
        result.total++;
        instr._category = classifyOpcode(instr.opcode);
        instr._block = bb.label;
        if (instr.isTerminator) {
          instr._status = 'live'; instr._reason = getLiveReason(instr); result.live.push(instr);
        } else if (instr.result && instr.users.length === 0 && !instr.hasSideEffects) {
          instr._status = 'dead'; instr._reason = getDeadReason(instr); result.dead.push(instr);
        } else if (!instr.result && !instr.isTerminator && instr.hasSideEffects) {
          instr._status = 'protected'; instr._reason = getProtectedReason(instr); result.protected.push(instr);
        } else if (instr.result && instr.users.length === 0 && instr.hasSideEffects) {
          instr._status = 'protected'; instr._reason = getProtectedReason(instr); result.protected.push(instr);
        } else if (!instr.result && !instr.isTerminator && !instr.hasSideEffects) {
          instr._status = 'dead'; instr._reason = getDeadReason(instr); result.dead.push(instr);
        } else {
          instr._status = 'live'; instr._reason = getLiveReason(instr); result.live.push(instr);
        }
      }
    }
    // Cascade prediction
    const deadSet = new Set(result.dead);
    let changed = true;
    while (changed) {
      changed = false;
      for (const bb of fn.blocks) {
        for (const instr of bb.instructions) {
          if (deadSet.has(instr) || instr.isTerminator || instr.hasSideEffects || !instr.result) continue;
          if (instr.users.length > 0 && instr.users.every(u => deadSet.has(u))) {
            instr._status = 'cascade'; instr._reason = getCascadeReason(instr);
            deadSet.add(instr); result.cascade.push(instr);
            const idx = result.live.indexOf(instr); if (idx !== -1) result.live.splice(idx, 1);
            changed = true;
          }
        }
      }
    }
    return result;
  }

  function analyzeModule(module) { return module.functions.map(fn => analyzeFunction(fn)); }

  function eliminateDeadCode(module) {
    let totalRemoved = 0, iterations = 0;
    const rounds = [];
    while (iterations < 50) {
      let removed = 0; iterations++;
      const roundRemoved = [];
      for (const fn of module.functions) {
        for (const bb of fn.blocks) {
          const toRemove = bb.instructions.filter(i => i.result && i.users.length === 0 && !i.isTerminator && !i.hasSideEffects);
          for (let i = toRemove.length - 1; i >= 0; i--) {
            const dead = toRemove[i];
            for (const ref of dead.usesOf) {
              for (const fn2 of module.functions) for (const bb2 of fn2.blocks)
                for (const i2 of bb2.instructions) if (i2.result === ref)
                  i2.users = i2.users.filter(u => u !== dead);
            }
            const idx = bb.instructions.indexOf(dead);
            if (idx !== -1) { bb.instructions.splice(idx, 1); roundRemoved.push(dead.raw); removed++; }
          }
        }
      }
      if (roundRemoved.length > 0) rounds.push({ round: iterations, removed: roundRemoved });
      totalRemoved += removed;
      if (removed === 0) break;
    }
    return { totalRemoved, iterations, rounds };
  }

  function reconstructIR(module) {
    const lines = [];
    for (const g of module.globals) lines.push(g.raw);
    for (const fn of module.functions) {
      lines.push(`define ${fn.retType} @${fn.name}(${fn.params}) {`);
      for (const bb of fn.blocks) { lines.push(`${bb.label}:`); for (const i of bb.instructions) lines.push(`  ${i.raw}`); }
      lines.push('}'); lines.push('');
    }
    for (const d of module.declares) lines.push(d.raw);
    return lines.join('\n');
  }

  function getStats(module) {
    let t = 0;
    for (const fn of module.functions) for (const bb of fn.blocks) t += bb.instructions.length;
    return t;
  }

  return { analyzeFunction, analyzeModule, eliminateDeadCode, reconstructIR, getStats };
})();
