# DCE Lab — LLVM Dead Code Elimination

Interactive visualization of LLVM's Dead Code Elimination analysis and transformation passes.

## Project Structure

```
cd_el/
├── passes/              # LLVM C++ Pass Source Code
│   ├── CMakeLists.txt
│   ├── include/         # Headers (DeadCodeAnalysis.h, DeadCodeTransform.h)
│   └── src/             # Implementation + PassPlugin registration
├── tests/               # Multi-language test programs
│   ├── c/               # C test (dead arithmetic)
│   ├── cpp/             # C++ test (dead objects/templates)
│   ├── java/            # Java test (JVM dead code)
│   ├── python/          # Python test (interpreted dead code)
│   ├── test1_arithmetic.ll    # LLVM IR — pure arithmetic
│   ├── test2_control_flow.ll  # LLVM IR — branches & phi nodes
│   └── test3_mixed.ll        # LLVM IR — mixed side-effects
├── frontend/            # Premium Web UI (no build tools needed)
│   ├── index.html
│   ├── css/style.css
│   └── js/ (ir-parser, dce-engine, app)
└── docs/
    └── side-effects.md  # Why stores/calls must never be removed
```

## Quick Start

### View the Frontend
Simply open `frontend/index.html` in any browser. No server required.

### Build the LLVM Pass (requires LLVM 17+)
```bash
cd passes
mkdir build && cd build
cmake .. -DLLVM_DIR=/path/to/llvm/lib/cmake/llvm
make
```

### Run the Pass
```bash
opt -load-pass-plugin=./DeadCodeElimination.so \
    -passes="dead-code-transform" \
    ../tests/test1_arithmetic.ll -S -o optimized.ll
```

## Benchmark Results

| Test Program | Before | After | Removed | % Reduced |
|---|---|---|---|---|
| test1_arithmetic (C) | 20 | 12 | 8 | 40% |
| test2_control_flow (C++) | 25 | 15 | 10 | 40% |
| test3_mixed (All) | 30 | 24 | 6 | 20% |
| **Total** | **75** | **51** | **24** | **32%** |
