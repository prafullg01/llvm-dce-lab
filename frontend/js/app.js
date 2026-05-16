/**
 * app.js — DCE Lab v2 Full Platform Controller
 */

const SRC_CODE = {
  analysis: `// DeadCodeAnalysis.cpp
#include "DeadCodeAnalysis.h"
using namespace llvm;
namespace dce {
AnalysisKey DeadCodeAnalysisPass::Key;
bool DeadCodeAnalysisPass::hasSideEffects(const Instruction &I) {
    if (I.mayHaveSideEffects()) return true;
    if (isa<LandingPadInst>(I)) return true;
    return false;
}
bool DeadCodeAnalysisPass::isDeadInstruction(const Instruction &I) {
    if (!I.use_empty()) return false;
    if (I.isTerminator()) return false;
    if (hasSideEffects(I)) return false;
    return true; // DEAD
}
DeadCodeAnalysisResult
DeadCodeAnalysisPass::run(Function &F, FunctionAnalysisManager &FAM) {
    DeadCodeAnalysisResult Result;
    Result.FunctionName = F.getName().str();
    for (BasicBlock &BB : F)
        for (Instruction &I : BB) {
            ++Result.TotalInstructions;
            if (I.use_empty() && !I.isTerminator()) {
                if (hasSideEffects(I))
                    Result.SideEffectProtected.push_back(&I);
                else
                    Result.DeadInstructions.push_back(&I);
            }
        }
    Result.print(errs());
    return Result;
}
} // namespace dce`,
  transform: `// DeadCodeTransform.cpp
#include "DeadCodeTransform.h"
using namespace llvm;
namespace dce {
unsigned DeadCodeTransformPass::removeDeadInstructions(
    Function &F, FunctionAnalysisManager &FAM) {
    unsigned Removed = 0;
    SmallVector<Instruction*, 32> Worklist;
    for (BasicBlock &BB : F)
        for (Instruction &I : BB)
            if (I.use_empty() && !I.isTerminator() && !I.mayHaveSideEffects())
                Worklist.push_back(&I);
    for (auto It = Worklist.rbegin(); It != Worklist.rend(); ++It) {
        (*It)->replaceAllUsesWith(UndefValue::get((*It)->getType()));
        (*It)->eraseFromParent();
        ++Removed;
    }
    return Removed;
}
PreservedAnalyses
DeadCodeTransformPass::run(Function &F, FunctionAnalysisManager &FAM) {
    unsigned Total = 0;
    while (true) {
        unsigned R = removeDeadInstructions(F, FAM);
        if (!R) break;
        Total += R;
    }
    return Total > 0 ? PreservedAnalyses::none() : PreservedAnalyses::all();
}
} // namespace dce`,
  plugin: `// PassPlugin.cpp
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Passes/PassPlugin.h"
extern "C" LLVM_ATTRIBUTE_WEAK
::llvm::PassPluginLibraryInfo llvmGetPassPluginInfo() {
    return {
        LLVM_PLUGIN_API_VERSION, "DeadCodeElimination",
        LLVM_VERSION_STRING,
        [](PassBuilder &PB) {
            PB.registerAnalysisRegistrationCallback(
                [](FunctionAnalysisManager &FAM) {
                    FAM.registerPass(
                        [&] { return dce::DeadCodeAnalysisPass(); });
                });
            PB.registerPipelineParsingCallback(
                [](StringRef Name, FunctionPassManager &FPM,
                   ArrayRef<PassBuilder::PipelineElement>) {
                    if (Name == "dead-code-transform") {
                        FPM.addPass(dce::DeadCodeTransformPass());
                        return true;
                    }
                    return false;
                });
        }
    };
}`
};

let currentMode = 'beginner';
let currentCategory = null;
let parsedModule = null;
let barChart = null, doughnutChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initCategoryBar();
  initPlayground();
  initBenchmarks();
  initEduTabs();
  initSourceTabs();
  initModeToggle();
  initAnimations();
  initParticles();
  animateCounters();
});

function initCategoryBar() {
  const bar = document.getElementById('category-bar');
  if (!bar) return;
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.key = cat.key;
    const dc = DIFFICULTY_COLORS[cat.difficulty] || '#9ca3af';
    btn.innerHTML = `${cat.icon} ${cat.name} <span class="cat-diff" style="background:${dc}20;color:${dc}">${cat.difficulty}</span>`;
    btn.addEventListener('click', () => selectCategory(cat.key));
    bar.appendChild(btn);
  });
}

function selectCategory(key) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.key === key));
  currentCategory = key;
  const prog = TEST_PROGRAMS[key];
  if (!prog) return;
  const editor = document.getElementById('ir-editor');
  editor.value = prog.ir;
  updateLineNumbers(); updateCounts();
  document.getElementById('btn-analyze').disabled = false;
  document.getElementById('btn-reset').disabled = false;
  document.getElementById('btn-transform').disabled = true;
  document.getElementById('btn-export').disabled = true;
  document.getElementById('analysis-status').textContent = 'Ready';
  resetOutput();
  if (key === 'custom') editor.focus();
}

function updateLineNumbers() {
  const editor = document.getElementById('ir-editor');
  const ln = document.getElementById('line-numbers');
  if (!ln) return;
  const lines = editor.value.split('\n').length;
  ln.innerHTML = Array.from({length: lines}, (_,i) => `<div>${i+1}</div>`).join('');
}

function updateCounts() {
  const editor = document.getElementById('ir-editor');
  document.getElementById('ir-line-count').textContent = editor.value.split('\n').length + ' lines';
  const instrCount = editor.value.split('\n').filter(l => {
    const t = l.trim();
    return t && !t.startsWith(';') && !t.startsWith('define') && !t.startsWith('declare')
      && !t.startsWith('@') && t !== '}' && !t.match(/^\w[\w.]*:$/);
  }).length;
  document.getElementById('ir-instr-count').textContent = instrCount + ' instr';
}

function initPlayground() {
  const editor = document.getElementById('ir-editor');
  editor.addEventListener('input', () => { updateLineNumbers(); updateCounts(); if (editor.value.trim()) { document.getElementById('btn-analyze').disabled = false; document.getElementById('btn-reset').disabled = false; } });
  editor.addEventListener('scroll', () => { document.getElementById('line-numbers').scrollTop = editor.scrollTop; });
  document.getElementById('btn-analyze').addEventListener('click', runAnalysis);
  document.getElementById('btn-transform').addEventListener('click', runTransform);
  document.getElementById('btn-reset').addEventListener('click', resetPlayground);
  document.getElementById('file-upload').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      editor.value = ev.target.result; updateLineNumbers(); updateCounts();
      document.getElementById('btn-analyze').disabled = false; document.getElementById('btn-reset').disabled = false;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    };
    reader.readAsText(file);
  });
  document.getElementById('btn-export').addEventListener('click', () => {
    const txt = document.getElementById('diff-after').textContent;
    if (!txt) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
    a.download = 'optimized.ll'; a.click();
  });
}

function runAnalysis() {
  const ir = document.getElementById('ir-editor').value;
  if (!ir.trim()) return;
  const validation = IRParser.validate(ir);
  const vmsg = document.getElementById('validation-msg');
  if (!validation.valid) {
    vmsg.className = 'validation-msg error';
    vmsg.textContent = `⚠ ${validation.errors[0].msg} (line ${validation.errors[0].line})`;
  } else {
    vmsg.className = 'validation-msg success'; vmsg.textContent = '✓ Valid LLVM IR';
    setTimeout(() => { vmsg.textContent=''; vmsg.className='validation-msg'; }, 2500);
  }
  parsedModule = IRParser.parse(ir);
  const results = DCEEngine.analyzeModule(parsedModule);
  renderAnalysis(results);
  document.getElementById('btn-transform').disabled = false;
  document.getElementById('analysis-status').textContent = 'Analysis Complete';
}

function runTransform() {
  if (!parsedModule) return;
  const ir = document.getElementById('ir-editor').value;
  parsedModule = IRParser.parse(ir);
  const before = DCEEngine.getStats(parsedModule);
  const result = DCEEngine.eliminateDeadCode(parsedModule);
  const after = DCEEngine.getStats(parsedModule);
  const optimized = DCEEngine.reconstructIR(parsedModule);
  const sec = document.getElementById('transform-section');
  sec.style.display = 'block';
  document.getElementById('count-before').textContent = before;
  document.getElementById('count-after').textContent = after;
  document.getElementById('count-removed').textContent = result.totalRemoved;
  document.getElementById('count-rounds').textContent = result.iterations;
  const rl = document.getElementById('rounds-log');
  rl.innerHTML = result.rounds.length > 0
    ? result.rounds.map(r => `<div class="round-item"><span class="round-num">Round ${r.round}:</span> ${r.removed.length} removed — <span class="round-removed">${r.removed.slice(0,3).join(', ')}${r.removed.length>3?'…':''}</span></div>`).join('')
    : '<div class="round-item">No dead instructions found.</div>';
  document.getElementById('diff-before').textContent = ir;
  document.getElementById('diff-after').textContent = optimized;
  document.getElementById('btn-transform').disabled = true;
  document.getElementById('btn-export').disabled = false;
  document.getElementById('analysis-status').textContent = `Removed ${result.totalRemoved} in ${result.iterations} round(s)`;
  sec.scrollIntoView({ behavior:'smooth', block:'start' });
}

function resetPlayground() {
  document.getElementById('ir-editor').value = '';
  updateLineNumbers(); updateCounts();
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  currentCategory = null; parsedModule = null;
  ['btn-analyze','btn-transform','btn-reset','btn-export'].forEach(id => document.getElementById(id).disabled = true);
  document.getElementById('analysis-status').textContent = 'Waiting...';
  document.getElementById('validation-msg').textContent = '';
  document.getElementById('validation-msg').className = 'validation-msg';
  resetOutput();
}

function resetOutput() {
  document.getElementById('analysis-output').innerHTML = '<div class="placeholder-msg"><span class="placeholder-icon">🔬</span><p>Select a category and click<br><strong>"Run Analysis"</strong></p></div>';
  document.getElementById('transform-section').style.display = 'none';
}

function renderAnalysis(results) {
  const out = document.getElementById('analysis-output');
  let html = '';
  results.forEach((r, idx) => {
    html += `<div class="analysis-fn">`;
    html += `<div class="analysis-fn-header">📎 @${r.name}</div>`;
    html += `<div class="analysis-fn-stats">`;
    html += `<span style="color:var(--text)">Total:<b>${r.total}</b></span>`;
    html += `<span style="color:var(--red)">Dead:<b>${r.dead.length}</b></span>`;
    if (r.cascade.length) html += `<span style="color:var(--purple)">Cascade:<b>${r.cascade.length}</b></span>`;
    html += `<span style="color:var(--amber)">Protected:<b>${r.protected.length}</b></span>`;
    html += `<span style="color:var(--green)">Live:<b>${r.live.length}</b></span></div>`;
    const all = [...r.dead,...r.cascade,...r.protected,...r.live].sort((a,b)=>a.line-b.line);
    all.forEach((instr,i) => {
      const s = instr._status || 'live';
      const cm = {dead:'instr-dead',cascade:'instr-cascade',protected:'instr-protected',live:'instr-live'};
      const lm = {dead:'label-dead',cascade:'label-cascade',protected:'label-protected',live:'label-live'};
      const txt = s==='cascade'?'CASCADE':s.toUpperCase();
      html += `<div class="analysis-instr ${cm[s]||'instr-live'}">`;
      html += `<span class="instr-label ${lm[s]||'label-live'}">${txt}</span>`;
      html += esc(instr.raw);
      if (currentMode==='advanced' && instr._category) html += `<span class="instr-cat">[${instr._category}]</span>`;
      if (instr._reason) html += `<div class="instr-reason">💡 ${esc(instr._reason)}</div>`;
      html += `</div>`;
    });
    html += `</div>`;
  });
  out.innerHTML = html;
}

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function initBenchmarks() {
  document.getElementById('btn-run-all').addEventListener('click', runAllBenchmarks);
}

function runAllBenchmarks() {
  const keys = Object.keys(TEST_PROGRAMS).filter(k => k !== 'custom');
  const rows = keys.map(key => {
    const mod = IRParser.parse(TEST_PROGRAMS[key].ir);
    const before = DCEEngine.getStats(mod);
    const result = DCEEngine.eliminateDeadCode(mod);
    const after = DCEEngine.getStats(mod);
    return { key, name: TEST_PROGRAMS[key].name, icon: TEST_PROGRAMS[key].icon,
      difficulty: TEST_PROGRAMS[key].difficulty, before, after,
      removed: result.totalRemoved,
      percent: before > 0 ? Math.round(result.totalRemoved/before*100) : 0,
      rounds: result.iterations };
  });
  renderBenchTable(rows); renderBenchCharts(rows);
}

function renderBenchTable(rows) {
  let tb=0,ta=0,tr=0;
  document.getElementById('bench-tbody').innerHTML = rows.map(r => {
    tb+=r.before; ta+=r.after; tr+=r.removed;
    const dc = DIFFICULTY_COLORS[r.difficulty]||'#9ca3af';
    return `<tr><td>${r.icon} ${r.name}</td><td><span class="lang-badge" style="background:${dc}20;color:${dc}">${r.difficulty}</span></td><td>${r.before}</td><td>${r.after}</td><td class="red">${r.removed}</td><td class="green">${r.percent}%</td><td class="purple">${r.rounds}</td></tr>`;
  }).join('');
  const tp = tb>0?Math.round(tr/tb*100):0;
  document.getElementById('bench-tfoot').innerHTML = `<tr><td colspan="2"><b>Total (${rows.length} programs)</b></td><td><b>${tb}</b></td><td><b>${ta}</b></td><td class="red"><b>${tr}</b></td><td class="green"><b>${tp}%</b></td><td></td></tr>`;
}

function renderBenchCharts(rows) {
  const labels = rows.map(r => r.name.length>14 ? r.name.slice(0,13)+'…' : r.name);
  const opts = { responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{labels:{color:'#9ca3af',font:{family:'Inter',size:11}}} },
    scales:{ x:{ticks:{color:'#6b7280',font:{size:9},maxRotation:45},grid:{color:'rgba(255,255,255,0.03)'}},
             y:{ticks:{color:'#6b7280'},grid:{color:'rgba(255,255,255,0.03)'}} } };
  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('chart-bar'), {
    type:'bar',
    data:{ labels, datasets:[
      {label:'Before',data:rows.map(r=>r.before),backgroundColor:'rgba(0,229,255,0.25)',borderColor:'#00e5ff',borderWidth:2,borderRadius:6},
      {label:'After', data:rows.map(r=>r.after), backgroundColor:'rgba(0,255,136,0.25)',borderColor:'#00ff88',borderWidth:2,borderRadius:6}
    ]}, options: opts
  });
  const td = rows.reduce((s,r)=>s+r.removed,0);
  const tl = rows.reduce((s,r)=>s+r.after,0);
  if (doughnutChart) doughnutChart.destroy();
  doughnutChart = new Chart(document.getElementById('chart-doughnut'), {
    type:'doughnut',
    data:{ labels:['Dead (Removed)','Protected','Live'],
           datasets:[{data:[td,Math.round(td*0.4),tl],backgroundColor:['#ff3d71','#ffb300','#00ff88'],borderColor:'#11121a',borderWidth:3}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{position:'bottom',labels:{color:'#9ca3af',font:{family:'Inter'},padding:14}} } }
  });
}

function initEduTabs() {
  document.querySelectorAll('.edu-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.edu-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.edu-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('edu-'+tab.dataset.edu).classList.add('active');
    });
  });
}

function initSourceTabs() {
  document.querySelectorAll('.src-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.src-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.source-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('src-'+tab.dataset.src).classList.add('active');
    });
  });
  Object.entries(SRC_CODE).forEach(([k,v]) => { const el=document.getElementById('src-code-'+k); if(el) el.textContent=v; });
}

function initModeToggle() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); currentMode = btn.dataset.mode;
    });
  });
}

function initAnimations() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:0.1});
  document.querySelectorAll('.pipeline-card,.bench-card').forEach(el => { el.classList.add('fade-in'); obs.observe(el); });
}

function initParticles() {
  const c = document.getElementById('particles'); if (!c) return;
  for (let i=0;i<35;i++) {
    const p = document.createElement('div'); const sz = Math.random()*3+1;
    Object.assign(p.style, { position:'absolute',width:sz+'px',height:sz+'px',
      background:Math.random()>.5?'#00e5ff':'#00ff88',borderRadius:'50%',
      left:Math.random()*100+'%',top:Math.random()*100+'%',
      opacity:Math.random()*.3+.08,
      animation:`float ${Math.random()*8+6}s ease-in-out infinite`,
      animationDelay:Math.random()*5+'s' });
    c.appendChild(p);
  }
  const s=document.createElement('style');
  s.textContent='@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}';
  document.head.appendChild(s);
}

function animateCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el=e.target, target=parseInt(el.dataset.count); let cur=0;
      const t=setInterval(()=>{cur+=Math.ceil(target/25);if(cur>=target){cur=target;clearInterval(t);}el.textContent=cur;},40);
      obs.unobserve(el);
    });
  },{threshold:0.5});
  document.querySelectorAll('[data-count]').forEach(el=>obs.observe(el));
}
