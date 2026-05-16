/**
 * test-programs.js — 15 Categories of LLVM IR Test Programs
 */
const TEST_PROGRAMS = {
  arithmetic: {
    name: "Arithmetic Operations", icon: "➕", difficulty: "Beginner",
    description: "Dead add/sub/mul/div chains with no consumers",
    ir: `define i32 @arithmetic_demo(i32 %x, i32 %y) {
entry:
  %sum  = add  i32 %x, %y
  %diff = sub  i32 %x, %y
  %prod = mul  i32 %x, %y
  %quot = sdiv i32 %x, %y
  %dead1 = add i32 %sum, 100
  %dead2 = mul i32 %dead1, 3
  %dead3 = sub i32 %prod, %diff
  %dead4 = add i32 %dead2, %dead3
  %live_cmp = icmp sgt i32 %sum, 0
  %result = select i1 %live_cmp, i32 %sum, i32 %diff
  call void @use_value(i32 %prod)
  ret i32 %result
}
declare void @use_value(i32)`
  },
  control_flow: {
    name: "Control Flow", icon: "🔀", difficulty: "Intermediate",
    description: "Dead computations in branches and unreachable paths",
    ir: `define i32 @control_flow(i32 %n) {
entry:
  %cmp = icmp sgt i32 %n, 10
  br i1 %cmp, label %then, label %else
then:
  %a = mul i32 %n, 2
  %dead_then = add i32 %a, 999
  br label %merge
else:
  %b = add i32 %n, 5
  %dead_else = mul i32 %b, 777
  br label %merge
merge:
  %result = phi i32 [ %a, %then ], [ %b, %else ]
  %dead_after = sub i32 %result, 1
  call void @print_int(i32 %result)
  ret i32 %result
}
declare void @print_int(i32)`
  },
  memory_ops: {
    name: "Memory Operations", icon: "💾", difficulty: "Intermediate",
    description: "Dead loads vs protected stores — stores must NEVER be removed",
    ir: `define void @memory_ops(ptr %arr, i32 %n) {
entry:
  %p0 = getelementptr i32, ptr %arr, i32 0
  %v0 = load i32, ptr %p0
  %p1 = getelementptr i32, ptr %arr, i32 1
  %v1 = load i32, ptr %p1
  %dead_sum = add i32 %v0, %v1
  %dead_load_ptr = getelementptr i32, ptr %arr, i32 5
  %dead_load = load i32, ptr %dead_load_ptr
  %doubled = mul i32 %v0, 2
  store i32 %doubled, ptr %p0
  store i32 %v1, ptr %p1
  %dead_calc = add i32 %dead_load, %n
  ret void
}`
  },
  function_calls: {
    name: "Function Calls", icon: "📞", difficulty: "Intermediate",
    description: "Calls are side-effects — even unused return values keep the call alive",
    ir: `define i32 @func_calls(i32 %x) {
entry:
  %a = call i32 @compute(i32 %x)
  %b = call i32 @compute(i32 42)
  %dead_add = add i32 %a, %b
  %c = call i32 @pure_func(i32 %x)
  call void @log_message(ptr @.str)
  %dead_mul = mul i32 %c, 10
  %result = add i32 %a, 1
  ret i32 %result
}
@.str = private constant [6 x i8] c"hello\\00"
declare i32 @compute(i32)
declare i32 @pure_func(i32)
declare void @log_message(ptr)`
  },
  pointers: {
    name: "Pointer & Array Ops", icon: "📍", difficulty: "Advanced",
    description: "Dead GEP address calculations and unused pointer arithmetic",
    ir: `define i32 @pointer_ops(ptr %base, i32 %idx) {
entry:
  %p1 = getelementptr i32, ptr %base, i32 %idx
  %val = load i32, ptr %p1
  %dead_p2 = getelementptr i32, ptr %base, i32 10
  %dead_p3 = getelementptr i32, ptr %base, i32 20
  %dead_offset = add i32 %idx, 5
  %dead_p4 = getelementptr i32, ptr %base, i32 %dead_offset
  %doubled = mul i32 %val, 2
  store i32 %doubled, ptr %p1
  %dead_cast = ptrtoint ptr %dead_p2 to i64
  ret i32 %val
}`
  },
  loops: {
    name: "Loops & Iteration", icon: "🔄", difficulty: "Advanced",
    description: "Dead loop accumulators and unused iteration tracking",
    ir: `define i32 @loop_demo(ptr %arr, i32 %n) {
entry:
  br label %loop
loop:
  %i = phi i32 [ 0, %entry ], [ %i.next, %loop ]
  %sum = phi i32 [ 0, %entry ], [ %new_sum, %loop ]
  %dead_max = phi i32 [ 0, %entry ], [ %new_max, %loop ]
  %dead_count = phi i32 [ 0, %entry ], [ %count_next, %loop ]
  %ptr = getelementptr i32, ptr %arr, i32 %i
  %val = load i32, ptr %ptr
  %new_sum = add i32 %sum, %val
  %cmp_max = icmp sgt i32 %val, %dead_max
  %new_max = select i1 %cmp_max, i32 %val, i32 %dead_max
  %count_next = add i32 %dead_count, 1
  %i.next = add i32 %i, 1
  %cond = icmp slt i32 %i.next, %n
  br i1 %cond, label %loop, label %exit
exit:
  ret i32 %sum
}`
  },
  phi_ssa: {
    name: "PHI Nodes / SSA", icon: "Φ", difficulty: "Advanced",
    description: "Dead PHI nodes and SSA form dead value propagation",
    ir: `define i32 @phi_demo(i32 %x, i1 %cond) {
entry:
  br i1 %cond, label %left, label %right
left:
  %a = add i32 %x, 10
  %dead_a = mul i32 %a, 3
  br label %join
right:
  %b = sub i32 %x, 10
  %dead_b = mul i32 %b, 7
  br label %join
join:
  %result = phi i32 [ %a, %left ], [ %b, %right ]
  %dead_phi = phi i32 [ %dead_a, %left ], [ %dead_b, %right ]
  %dead_use = add i32 %dead_phi, 42
  ret i32 %result
}`
  },
  bitwise: {
    name: "Bitwise / Logical", icon: "🔢", difficulty: "Beginner",
    description: "Dead bitwise operations — and/or/xor/shift with no consumers",
    ir: `define i32 @bitwise_demo(i32 %x, i32 %y) {
entry:
  %and_val = and i32 %x, 255
  %or_val = or i32 %x, %y
  %xor_val = xor i32 %x, %y
  %shl_val = shl i32 %x, 2
  %shr_val = lshr i32 %y, 3
  %dead_mask = and i32 %or_val, 65535
  %dead_combo = xor i32 %dead_mask, %shr_val
  %dead_shift = shl i32 %dead_combo, 4
  %result = or i32 %and_val, %shl_val
  ret i32 %result
}`
  },
  type_cast: {
    name: "Type Conversion", icon: "↔", difficulty: "Beginner",
    description: "Dead type casts — zext/sext/trunc/bitcast with unused results",
    ir: `define i64 @cast_demo(i32 %x, i8 %byte) {
entry:
  %ext = zext i32 %x to i64
  %dead_sext = sext i8 %byte to i32
  %dead_trunc = trunc i64 %ext to i16
  %dead_zext2 = zext i8 %byte to i64
  %dead_combo = add i64 %dead_zext2, %ext
  %shifted = shl i64 %ext, 8
  %dead_fp = sitofp i32 %x to double
  %dead_back = fptosi double %dead_fp to i32
  ret i64 %shifted
}`
  },
  recursive: {
    name: "Recursive Functions", icon: "🌀", difficulty: "Advanced",
    description: "Dead tracking variables in recursive algorithms",
    ir: `define i32 @factorial(i32 %n) {
entry:
  %base = icmp sle i32 %n, 1
  br i1 %base, label %ret_base, label %recurse
ret_base:
  ret i32 1
recurse:
  %n_minus_1 = sub i32 %n, 1
  %sub_result = call i32 @factorial(i32 %n_minus_1)
  %result = mul i32 %n, %sub_result
  %dead_sum = add i32 %n, %sub_result
  %dead_log = add i32 %n, 1
  %dead_depth = sub i32 %n, 2
  ret i32 %result
}`
  },
  side_effects: {
    name: "Side Effects / Unsafe", icon: "⚠️", difficulty: "Critical",
    description: "Instructions that MUST be preserved — stores, calls, volatile, fences",
    ir: `define void @side_effects(ptr %data, i32 %val) {
entry:
  %dead_calc = add i32 %val, 42
  store i32 %val, ptr %data
  call void @log(i32 %val)
  %dead_mul = mul i32 %val, 10
  store volatile i32 1, ptr %data
  fence seq_cst
  %dead_sub = sub i32 %val, 1
  %live_ptr = getelementptr i32, ptr %data, i32 1
  store i32 0, ptr %live_ptr
  call void @flush()
  %dead_final = add i32 %dead_calc, %dead_mul
  ret void
}
declare void @log(i32)
declare void @flush()`
  },
  exceptions: {
    name: "Exception Handling", icon: "🛑", difficulty: "Expert",
    description: "Landing pads and invoke — exception handling instructions are never removable",
    ir: `define i32 @exception_demo(i32 %x) personality ptr @__gxx_personality_v0 {
entry:
  %dead_pre = add i32 %x, 100
  %result = invoke i32 @may_throw(i32 %x) to label %normal unwind label %lpad
normal:
  %dead_post = mul i32 %result, 3
  ret i32 %result
lpad:
  %pad = landingpad { ptr, i32 } catch ptr @type_info
  %dead_in_lpad = add i32 %x, 999
  ret i32 -1
}
@type_info = external global ptr
declare i32 @may_throw(i32)
declare i32 @__gxx_personality_v0(...)`
  },
  atomics: {
    name: "Atomic / Concurrency", icon: "🔒", difficulty: "Expert",
    description: "Atomic operations and fences — always protected due to memory ordering",
    ir: `define i32 @atomic_demo(ptr %counter, ptr %flag) {
entry:
  %dead_load = load i32, ptr %counter
  %dead_calc = add i32 %dead_load, 1
  %old = atomicrmw add ptr %counter, i32 1 seq_cst
  fence acquire
  %read = load atomic i32, ptr %flag seq_cst, align 4
  %dead_cmp = icmp eq i32 %read, 0
  store atomic i32 1, ptr %flag release, align 4
  fence seq_cst
  %dead_old_use = mul i32 %old, 2
  ret i32 %old
}`
  },
  complex: {
    name: "Mixed Complex", icon: "🧩", difficulty: "Advanced",
    description: "Realistic program mixing all instruction types with cascading dead code",
    ir: `define i32 @complex_program(ptr %input, ptr %output, i32 %n) {
entry:
  %dead_flag = add i32 %n, 1
  %dead_mask = and i32 %n, 255
  br label %loop
loop:
  %i = phi i32 [ 0, %entry ], [ %i.next, %loop ]
  %sum = phi i32 [ 0, %entry ], [ %new_sum, %loop ]
  %dead_prod = phi i32 [ 1, %entry ], [ %new_prod, %loop ]
  %in_ptr = getelementptr i32, ptr %input, i32 %i
  %val = load i32, ptr %in_ptr
  %processed = mul i32 %val, 2
  %out_ptr = getelementptr i32, ptr %output, i32 %i
  store i32 %processed, ptr %out_ptr
  %new_sum = add i32 %sum, %val
  %new_prod = mul i32 %dead_prod, %val
  %dead_sq = mul i32 %val, %val
  %dead_diff = sub i32 %processed, %val
  %i.next = add i32 %i, 1
  %cond = icmp slt i32 %i.next, %n
  br i1 %cond, label %loop, label %exit
exit:
  %final_sum = phi i32 [ %sum, %loop ]
  %final_prod = phi i32 [ %dead_prod, %loop ]
  %dead_avg = sdiv i32 %final_sum, %n
  %dead_log = call i32 @compute_log(i32 %final_prod)
  call void @print_result(i32 %final_sum)
  ret i32 %final_sum
}
declare i32 @compute_log(i32)
declare void @print_result(i32)`
  },
  custom: {
    name: "Custom LLVM IR", icon: "✏️", difficulty: "Any",
    description: "Write or paste your own LLVM IR code for analysis",
    ir: `; Write your custom LLVM IR here
define i32 @my_function(i32 %arg) {
entry:
  %live = add i32 %arg, 1
  %dead = mul i32 %arg, 99
  ret i32 %live
}`
  }
};

const CATEGORIES = Object.entries(TEST_PROGRAMS).map(([key, val]) => ({
  key, name: val.name, icon: val.icon, difficulty: val.difficulty, description: val.description
}));

const DIFFICULTY_COLORS = {
  Beginner: '#00ff88', Intermediate: '#00e5ff',
  Advanced: '#ffb300', Critical: '#ff3d71',
  Expert: '#a855f7', Any: '#9ca3af'
};
