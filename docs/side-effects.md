# Why Some Instructions Must NEVER Be Removed

## The Core Rule

> An instruction can only be safely removed if it has **no users** AND **no side effects**.

Even if an instruction's result is never used by another instruction, it may have **observable behavior** that must be preserved for program correctness.

---

## Instructions That Must Be Preserved

### 1. Store Instructions (`store`)

```llvm
store i32 42, ptr %ptr
```

**Why**: Stores modify memory that may be visible to other parts of the program, other threads, or even hardware devices. Removing a store could:
- Break data structures (linked lists, arrays, hash maps)
- Cause other threads to read stale data
- Prevent I/O devices from receiving commands (memory-mapped I/O)

**Example**: A store to a shared counter must survive even if nothing in the *current function* reads it.

---

### 2. Call Instructions (`call`, `invoke`)

```llvm
call void @printf(ptr @.str, i32 %val)
call void @free(ptr %buf)
```

**Why**: Function calls can have *arbitrary* side effects:
- **I/O**: `printf`, `write`, `fopen` — produce visible output
- **Memory management**: `malloc`, `free` — affect the heap
- **System calls**: `exit`, `fork` — affect the OS
- **Exceptions**: may throw, altering control flow
- **Global state**: may modify global variables

Even a call to a "pure" function may have side effects that the compiler cannot prove are absent (unless marked `readnone`).

---

### 3. Fence Instructions (`fence`)

```llvm
fence seq_cst
fence acquire
```

**Why**: Fences enforce **memory ordering** in concurrent programs. They ensure that:
- Writes before the fence are visible to other threads
- Reads after the fence see the latest values from other threads

Removing a fence can cause **data races**, **torn reads**, and **inconsistent shared state**.

---

### 4. Atomic Operations (`atomicrmw`, `cmpxchg`)

```llvm
%old = atomicrmw add ptr %counter, i32 1 seq_cst
%pair = cmpxchg ptr %lock, i32 0, i32 1 acquire monotonic
```

**Why**: Atomic operations are used for **lock-free synchronization**:
- Mutexes, spinlocks, reference counts
- Compare-and-swap for lock-free data structures
- Even if the return value is unused, the memory effect must happen

---

### 5. Volatile Operations (`load volatile`, `store volatile`)

```llvm
%val = load volatile i32, ptr %hw_register
store volatile i32 1, ptr %hw_control
```

**Why**: Volatile marks **hardware-mapped I/O** or **signal handlers**:
- Reading a hardware status register triggers a side effect
- Writing to a control register commands hardware
- The compiler must never optimize these away

---

### 6. Terminator Instructions (`br`, `ret`, `switch`, `unreachable`)

```llvm
br i1 %cond, label %then, label %else
ret i32 %result
switch i32 %val, label %default [i32 0, label %case0]
```

**Why**: Terminators define **control flow structure**:
- Every basic block must end with exactly one terminator
- Removing a terminator would make the IR structurally invalid
- The verifier would reject the module

---

### 7. Exception Handling Instructions

```llvm
%pad = landingpad { ptr, i32 } catch ptr @type_info
%tok = catchpad within %cs [ptr @type_info]
cleanupret from %pad unwind label %next
```

**Why**: Exception handling maintains the **unwind table**:
- Landing pads are targets for exception dispatch
- Catch/cleanup pads define exception filter behavior
- Removing them breaks C++ exception handling completely

---

## How LLVM Checks: `mayHaveSideEffects()`

LLVM provides `Instruction::mayHaveSideEffects()` which returns `true` for:

| Instruction Type | Side Effect |
|---|---|
| `store` | Memory write |
| `call` / `invoke` | Arbitrary (unless `readnone`) |
| `fence` | Memory ordering |
| `atomicrmw` | Atomic memory operation |
| `cmpxchg` | Atomic compare-and-swap |
| `load volatile` | Hardware I/O read |
| `va_arg` | Varargs state modification |

Our analysis pass uses this check as the primary guard:

```cpp
bool DeadCodeAnalysisPass::isDeadInstruction(const Instruction &I) {
    if (!I.use_empty()) return false;      // has users — live
    if (I.isTerminator()) return false;     // control flow — live
    if (I.mayHaveSideEffects()) return false; // side effects — protected
    return true;                            // dead — safe to remove
}
```

---

## Summary

| Category | Can Remove? | Reason |
|---|---|---|
| Unused arithmetic (`add`, `mul`, `sub`) | ✅ Yes | Pure computation, no side effects |
| Unused comparisons (`icmp`, `fcmp`) | ✅ Yes | Pure computation |
| Unused casts (`zext`, `trunc`, `bitcast`) | ✅ Yes | Pure computation |
| Unused GEP (`getelementptr`) | ✅ Yes | Address computation only |
| Unused loads (non-volatile) | ✅ Yes | No visible effect |
| Stores | ❌ Never | Modifies memory |
| Calls (unless `readnone`) | ❌ Never | Arbitrary side effects |
| Fences | ❌ Never | Memory ordering |
| Atomics | ❌ Never | Synchronization |
| Volatile ops | ❌ Never | Hardware I/O |
| Terminators | ❌ Never | Control flow structure |
| Exception handling | ❌ Never | Unwind tables |
