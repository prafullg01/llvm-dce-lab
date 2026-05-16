# LLVM IR Test Files — `tests/ll/`

Standalone `.ll` files for every DCE category. Use with `opt`:

```bash
opt -load-pass-plugin=./DeadCodeElimination.so \
    -passes="dead-code-transform" <file>.ll -S -o out.ll
```

Or drag-and-drop into the [DCE Lab web UI](http://localhost:3000) via **Upload .ll**.

## Files

| File | Category | Difficulty | Key Concepts |
|------|----------|------------|--------------|
| [test_arithmetic.ll](test_arithmetic.ll) | Arithmetic | Beginner | Dead add/mul chains, cascade |
| [test_control_flow.ll](test_control_flow.ll) | Control Flow | Intermediate | Dead in branches, dead after merge |
| [test_memory_ops.ll](test_memory_ops.ll) | Memory | Intermediate | Dead loads, protected stores |
| [test_function_calls.ll](test_function_calls.ll) | Functions | Intermediate | Protected calls, dead return values |
| [test_pointers.ll](test_pointers.ll) | Pointers | Advanced | Dead GEP, dead ptrtoint |
| [test_loops.ll](test_loops.ll) | Loops | Advanced | Dead PHI accumulators, cascade |
| [test_phi_ssa.ll](test_phi_ssa.ll) | PHI/SSA | Advanced | Dead phi nodes, SSA cascade |
| [test_bitwise.ll](test_bitwise.ll) | Bitwise | Beginner | Dead and/or/xor/shl chains |
| [test_type_cast.ll](test_type_cast.ll) | Type Cast | Beginner | Dead zext/sext/trunc/sitofp |
| [test_recursive.ll](test_recursive.ll) | Recursive | Advanced | Dead tracking in recursion |
| [test_side_effects.ll](test_side_effects.ll) | Side Effects | Critical | store/call/volatile/fence protection |
| [test_exceptions.ll](test_exceptions.ll) | Exceptions | Expert | invoke/landingpad always protected |
| [test_atomics.ll](test_atomics.ll) | Atomics | Expert | atomicrmw/fence protection |
| [test_complex.ll](test_complex.ll) | Mixed | Advanced | Real loop + all instruction types |
| [test_custom_template.ll](test_custom_template.ll) | Custom | Any | Write your own IR |

## Label Legend

| Label | Color | Meaning |
|-------|-------|---------|
| **DEAD** | 🔴 Red | `use_empty() && !hasSideEffects()` — safe to remove |
| **CASCADE** | 🟣 Purple | Becomes dead after DEAD instructions are removed (fixpoint) |
| **PROTECTED** | 🟡 Amber | `hasSideEffects()` — MUST be preserved |
| **LIVE** | 🟢 Green | Has users — cannot be removed |

## Compile Test (clang → LLVM IR)

```bash
# Generate IR from C source:
clang -S -emit-llvm -O0 -Xclang -disable-O0-optnone \
      tests/c/test1_dead_arithmetic.c -o tests/ll/from_c.ll

# Run DCE pass:
opt -load-pass-plugin=./passes/build/DeadCodeElimination.so \
    -passes="dead-code-transform" tests/ll/from_c.ll -S

# View before/after instruction count:
opt -load-pass-plugin=./passes/build/DeadCodeElimination.so \
    -passes="dead-code-transform" tests/ll/from_c.ll -S \
    | grep -v "^;" | grep -v "^$" | wc -l
```
