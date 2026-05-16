# ⚡ LLVM DCE Lab — Dead Code Elimination Platform

<div align="center">

![LLVM](https://img.shields.io/badge/LLVM-18.x-blue?style=for-the-badge&logo=llvm)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow?style=for-the-badge&logo=javascript)
![C++](https://img.shields.io/badge/C++-17-blue?style=for-the-badge&logo=c%2B%2B)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**An interactive, professional-grade LLVM IR playground for learning, visualizing, and benchmarking Dead Code Elimination.**

[🚀 Launch Playground](#running-locally) · [📖 Learn LLVM](#what-is-llvm-ir) · [📊 Benchmarks](#benchmark-dashboard) · [🧠 How DCE Works](#how-dce-works)

</div>

---

## 📌 What This Project Does

**DCE Lab** is a full-featured, browser-based educational and benchmarking platform for **LLVM Dead Code Elimination (DCE)**. It transforms the abstract concept of compiler optimization into a concrete, visual, and interactive experience.

The platform lets you:

- **Load** LLVM IR programs from 15 pre-built categories
- **Write** your own custom LLVM IR in a line-numbered editor
- **Upload** real `.ll` files from your machine
- **Run the Analysis Pass** — see every instruction classified as `DEAD`, `CASCADE`, `PROTECTED`, or `LIVE` with hover tooltips explaining *why*
- **Run the Transform Pass** — watch the fixpoint elimination loop remove dead code round-by-round, then see a before/after diff
- **Benchmark** all 15 categories at once and visualize instruction counts in charts and a summary table
- **Learn LLVM** through 6 interactive educational tabs covering LLVM IR, SSA form, DCE theory, side effects, and the pass pipeline
- **View the real C++ source code** for both LLVM passes (Analysis + Transform) that mirror the JavaScript simulation

---

## 🧠 How DCE Works

Dead Code Elimination is a compiler optimization that removes instructions whose results are **never used** and which have **no observable side effects**.

### The Decision Logic

```cpp
bool isDeadInstruction(Instruction &I) {
    if (!I.use_empty())          return false;  // Has users     → LIVE
    if (I.isTerminator())        return false;  // Control flow  → LIVE
    if (I.mayHaveSideEffects())  return false;  // Side effects  → PROTECTED
    return true;                                 // → DEAD ✓
}
```

### The 4-Step Pipeline

```
Source Code (C/C++/Rust)
        ↓
   clang frontend
        ↓
   LLVM IR (.ll)         ← You are here
        ↓
 [Analysis Pass]         → Per-function dead instruction report
        ↓
 [Transform Pass]        → Fixpoint loop removes dead code
        ↓
  Optimized IR           ← Fewer instructions, same semantics
        ↓
   Machine Code (x86/ARM)
```

### Why Fixpoint Iteration?

Removing one dead instruction may make its operands dead too (cascade). The transform pass repeats until no more dead instructions exist — this is called **fixpoint convergence**.

```
Round 1: remove %dead1 (unused)         → %dead2 now has 0 users
Round 2: remove %dead2 (now unused)     → %dead3 now has 0 users
Round 3: remove %dead3 (now unused)     → converged, stop
```

---

## 🛡️ Why Some Instructions Are NEVER Removed

Even if an instruction's *result* is unused, it may still have **observable side effects** that must be preserved:

| Instruction | Why It's Protected |
|---|---|
| `store` | Writes to memory — visible to other functions, threads, OS |
| `call` / `invoke` | May perform I/O, throw exceptions, modify global state |
| `fence` | Enforces memory ordering — removing it creates data races |
| `atomicrmw` | Atomic operation — affects all threads' memory view |
| `volatile` load/store | Hardware-mapped I/O — every access triggers a physical effect |
| `landingpad` | Exception handling entry — part of the binary's unwind table |

```llvm
; This call's return value is unused — but the call is PROTECTED
%unused = call i32 @printf(ptr @.str)
; printf still writes to stdout even if we don't use its return value!
```

---

## 🗂️ Project Structure

```
llvm-dce-lab/
│
├── frontend/                   # Web platform (SPA)
│   ├── index.html              # Full platform UI — hero, playground, benchmarks, education
│   ├── css/
│   │   └── style.css           # Complete dark-theme design system
│   └── js/
│       ├── app.js              # Main UI controller (category bar, editor, charts, tabs)
│       ├── dce-engine.js       # JavaScript DCE engine (analysis + transform + cascade)
│       ├── ir-parser.js        # LLVM IR parser (functions, basic blocks, def-use chains)
│       └── test-programs.js    # 15 LLVM IR test programs with metadata
│
├── passes/                     # Real LLVM C++ pass implementation
│   ├── CMakeLists.txt          # CMake build configuration
│   ├── include/
│   │   ├── DeadCodeAnalysis.h  # Analysis pass interface + result structure
│   │   └── DeadCodeTransform.h # Transform pass interface
│   └── src/
│       ├── DeadCodeAnalysis.cpp  # Analysis pass — per-function dead instruction report
│       ├── DeadCodeTransform.cpp # Transform pass — fixpoint dead code removal
│       └── PassPlugin.cpp        # LLVM New Pass Manager plugin registration
│
├── tests/                      # Test programs across languages
│   ├── ll/                     # 15 standalone .ll files (one per category)
│   │   ├── dce_full_benchmark.ll   # All 15 categories in one file (upload-ready)
│   │   ├── test_arithmetic.ll
│   │   ├── test_control_flow.ll
│   │   ├── test_memory_ops.ll
│   │   ├── test_function_calls.ll
│   │   ├── test_pointers.ll
│   │   ├── test_loops.ll
│   │   ├── test_phi_ssa.ll
│   │   ├── test_bitwise.ll
│   │   ├── test_type_cast.ll
│   │   ├── test_recursive.ll
│   │   ├── test_side_effects.ll
│   │   ├── test_exceptions.ll
│   │   ├── test_atomics.ll
│   │   ├── test_complex.ll
│   │   └── test_custom_template.ll
│   ├── c/
│   │   └── test1_dead_arithmetic.c
│   ├── cpp/
│   │   └── test2_dead_objects.cpp
│   ├── java/
│   │   └── DeadCode.java
│   └── python/
│       └── dead_code.py
│
├── docs/
│   └── side-effects.md         # Detailed explanation of side-effect preservation
│
├── server.js                   # Node.js static file server
├── package.json
├── .gitignore
└── README.md
```

---

## 🔬 15 IR Test Categories

| # | Category | Difficulty | Key Concepts |
|---|---|---|---|
| 1 | ➕ Arithmetic Operations | 🟢 Beginner | Dead add/mul/sub chains, cascade |
| 2 | 🔀 Control Flow | 🔵 Intermediate | Dead in branches, dead after PHI merge |
| 3 | 💾 Memory Operations | 🔵 Intermediate | Dead loads vs protected stores |
| 4 | 📞 Function Calls | 🔵 Intermediate | Protected calls, dead return values |
| 5 | 📍 Pointer & Array Ops | 🟡 Advanced | Dead GEP, dead pointer arithmetic |
| 6 | 🔄 Loops & Iteration | 🟡 Advanced | Dead PHI accumulators, fixpoint cascade |
| 7 | Φ PHI Nodes / SSA | 🟡 Advanced | Dead PHI nodes, SSA form cascade |
| 8 | 🔢 Bitwise / Logical | 🟢 Beginner | Dead and/or/xor/shift chains |
| 9 | ↔ Type Conversion | 🟢 Beginner | Dead zext/sext/trunc/sitofp |
| 10 | 🌀 Recursive Functions | 🟡 Advanced | Dead tracking variables in recursion |
| 11 | ⚠️ Side Effects / Unsafe | 🔴 Critical | store/call/volatile/fence protection |
| 12 | 🛑 Exception Handling | 🟣 Expert | invoke/landingpad always protected |
| 13 | 🔒 Atomic / Concurrency | 🟣 Expert | atomicrmw/fence memory ordering |
| 14 | 🧩 Mixed Complex | 🟡 Advanced | Realistic loops with all instruction types |
| 15 | ✏️ Custom LLVM IR | Any | Write or paste your own IR |

---

## 🛠️ Technology Stack

### Frontend (Web Platform)
| Technology | Version | Purpose |
|---|---|---|
| **HTML5** | — | Semantic page structure |
| **CSS3 (Vanilla)** | — | Full custom dark-theme design system, glassmorphism, animations |
| **JavaScript** | ES2022 | UI controller, IR parser, DCE engine (no frameworks) |
| **Chart.js** | v4 | Bar chart (before/after) and doughnut chart (distribution) |
| **Google Fonts** | — | Inter (UI) + JetBrains Mono (code) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20.x | Static file server |
| **http** module | built-in | Serves frontend assets and `.ll` files |

### LLVM Pass Implementation (C++)
| Technology | Version | Purpose |
|---|---|---|
| **LLVM** | 18.x | Compiler infrastructure framework |
| **C++** | 17 | Pass implementation language |
| **CMake** | 3.20+ | Build system for pass compilation |
| **LLVM New Pass Manager** | — | Plugin registration (`PassPluginLibraryInfo`) |

### Test Programs
| Language | File | Dead Code Pattern |
|---|---|---|
| **LLVM IR** | `tests/ll/*.ll` | 15 standalone files, 1 combined benchmark |
| **C** | `test1_dead_arithmetic.c` | Dead arithmetic variables |
| **C++** | `test2_dead_objects.cpp` | Dead object computation (vectors) |
| **Java** | `DeadCode.java` | Dead loop accumulators |
| **Python** | `dead_code.py` | Dead statistical computations |

---

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- Any modern browser (Chrome, Firefox, Edge)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/prafullg01/llvm-dce-lab.git
cd llvm-dce-lab

# 2. Start the server
node server.js

# 3. Open in browser
# Navigate to: http://localhost:3000
```

That's it — no `npm install`, no build step, no dependencies to install.

---

## 🔧 Running the Real LLVM Pass (Optional)

If you have LLVM installed, you can run the actual C++ pass on any `.ll` file:

```bash
# Build the pass plugin
cd passes
mkdir build && cd build
cmake .. -DLLVM_DIR=/path/to/llvm/lib/cmake/llvm
make

# Run analysis pass
opt -load-pass-plugin=./DeadCodeElimination.so \
    -passes="dead-code-transform" \
    ../../tests/ll/test_arithmetic.ll -S -o optimized.ll

# Count instructions before and after
echo "Before:"; grep -v "^;" ../../tests/ll/test_arithmetic.ll | grep "=" | wc -l
echo "After: "; grep -v "^;" optimized.ll | grep "=" | wc -l

# Generate LLVM IR from C source
clang -S -emit-llvm -O0 -Xclang -disable-O0-optnone \
      tests/c/test1_dead_arithmetic.c -o tests/ll/from_clang.ll
```

---

## 📊 Benchmark Dashboard

Click **"Run All Benchmarks"** to process all 14 non-custom categories:

- **Bar Chart** — instruction count before vs. after DCE for each category
- **Doughnut Chart** — proportion of Dead / Protected / Live instructions across all programs
- **Summary Table** — per-category: Before, After, Removed, % Reduced, Elimination Rounds

Typical results across all programs: **25–45% instruction reduction**.

---

## 📚 What is LLVM IR?

LLVM IR (Intermediate Representation) is a typed, SSA-based language that sits between your source code and machine code. Every value is assigned exactly once (SSA = Static Single Assignment), making def-use analysis trivial.

```llvm
define i32 @example(i32 %x, i32 %y) {
entry:
  %sum  = add i32 %x, %y        ; LIVE   — %sum is used below
  %dead = mul i32 %x, 100       ; DEAD   — %dead is never used
  call void @print(i32 %sum)    ; PROTECTED — call has side effects
  ret i32 %sum
}
```

Key concepts:
- **`%name`** — local SSA value (assigned once, used anywhere)
- **`@name`** — global value or function
- **Basic blocks** — straight-line code ending in a terminator (`ret`, `br`, `switch`)
- **PHI nodes** — merge values from different predecessor blocks
- **Terminators** — control flow instructions, never removable

---

## 🎓 Educational Sections

The platform includes 6 interactive education tabs:

| Tab | Content |
|---|---|
| **What is LLVM?** | Overview, frontend→IR→passes→backend flow |
| **LLVM IR** | Syntax, types, values, basic blocks, function definitions |
| **SSA Form** | Static single assignment, PHI nodes, def-use chains |
| **DCE Pass** | The elimination algorithm, safe vs unsafe instructions |
| **Side Effects** | Why stores/calls/fences/atomics are always preserved |
| **Pass Pipeline** | How Analysis + Transform passes compose in `opt` |

---

## 👤 Author

**Prafull** · [@prafullg01](https://github.com/prafullg01)

---

## 📄 License

MIT License — free to use for educational and portfolio purposes.

---

<div align="center">
<strong>⚡ DCE Lab — Making compiler optimization visible, interactive, and educational</strong>
</div>
