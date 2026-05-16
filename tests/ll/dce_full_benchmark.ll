; ============================================================
; dce_full_benchmark.ll
; LLVM Dead Code Elimination — Complete Test Suite
; All 15 categories in one file for upload to DCE Lab
;
; Upload this file using the "Upload .ll" button, then:
;   1. Click "Run Analysis" to see all dead/protected/live labels
;   2. Click "Run Transform" to see the optimized output
;   3. Check the diff view and elimination rounds
;
; Legend:
;   DEAD      — use_empty() && !hasSideEffects()
;   CASCADE   — becomes dead after fixpoint removal
;   PROTECTED — hasSideEffects() — MUST be preserved
;   LIVE      — has users or is a terminator
; ============================================================


; ============================================================
; [1] ARITHMETIC — Dead add/mul chains
; ============================================================
define i32 @arithmetic_demo(i32 %x, i32 %y) {
entry:
  %sum  = add  i32 %x, %y
  %diff = sub  i32 %x, %y
  %prod = mul  i32 %x, %y

  %dead1 = add i32 %sum, 100          ; DEAD
  %dead2 = mul i32 %dead1, 3          ; CASCADE
  %dead3 = sub i32 %prod, %diff       ; DEAD
  %dead4 = add i32 %dead2, %dead3     ; CASCADE

  %cmp    = icmp sgt i32 %sum, 0
  %result = select i1 %cmp, i32 %sum, i32 %diff
  call void @use_value(i32 %prod)     ; PROTECTED
  ret i32 %result
}


; ============================================================
; [2] CONTROL FLOW — Dead code in branches
; ============================================================
define i32 @control_flow(i32 %n) {
entry:
  %cmp = icmp sgt i32 %n, 10
  br i1 %cmp, label %then, label %else

then:
  %a         = mul i32 %n, 2
  %dead_then = add i32 %a, 999        ; DEAD
  br label %merge

else:
  %b         = add i32 %n, 5
  %dead_else = mul i32 %b, 777        ; DEAD
  br label %merge

merge:
  %result     = phi i32 [ %a, %then ], [ %b, %else ]
  %dead_after = sub i32 %result, 1    ; DEAD
  call void @print_int(i32 %result)   ; PROTECTED
  ret i32 %result
}


; ============================================================
; [3] MEMORY — Dead loads, protected stores
; ============================================================
define void @memory_ops(ptr %arr, i32 %n) {
entry:
  %p0       = getelementptr i32, ptr %arr, i32 0
  %v0       = load i32, ptr %p0
  %p1       = getelementptr i32, ptr %arr, i32 1
  %v1       = load i32, ptr %p1

  %dead_sum      = add i32 %v0, %v1           ; DEAD
  %dead_load_ptr = getelementptr i32, ptr %arr, i32 5 ; CASCADE
  %dead_load     = load i32, ptr %dead_load_ptr        ; DEAD

  %doubled = mul i32 %v0, 2
  store i32 %doubled, ptr %p0                 ; PROTECTED
  store i32 %v1,      ptr %p1                 ; PROTECTED

  %dead_calc = add i32 %dead_load, %n         ; CASCADE
  ret void
}


; ============================================================
; [4] FUNCTION CALLS — Protected calls, dead return values
; ============================================================
define i32 @func_calls(i32 %x) {
entry:
  %a        = call i32 @compute(i32 %x)       ; PROTECTED
  %b        = call i32 @compute(i32 42)        ; PROTECTED
  %dead_add = add i32 %a, %b                  ; DEAD
  %c        = call i32 @pure_func(i32 %x)     ; PROTECTED
  call void @log_message(ptr @.str.hello)      ; PROTECTED
  %dead_mul = mul i32 %c, 10                  ; DEAD
  %result   = add i32 %a, 1
  ret i32 %result
}


; ============================================================
; [5] POINTERS — Dead GEP address calculations
; ============================================================
define i32 @pointer_ops(ptr %base, i32 %idx) {
entry:
  %p1      = getelementptr i32, ptr %base, i32 %idx
  %val     = load i32, ptr %p1

  %dead_p2     = getelementptr i32, ptr %base, i32 10   ; DEAD
  %dead_p3     = getelementptr i32, ptr %base, i32 20   ; DEAD
  %dead_offset = add i32 %idx, 5                        ; DEAD
  %dead_p4     = getelementptr i32, ptr %base, i32 %dead_offset ; CASCADE

  %doubled  = mul i32 %val, 2
  store i32 %doubled, ptr %p1                           ; PROTECTED

  %dead_cast = ptrtoint ptr %dead_p2 to i64             ; CASCADE
  ret i32 %val
}


; ============================================================
; [6] LOOPS — Dead loop accumulators
; ============================================================
define i32 @loop_demo(ptr %arr, i32 %n) {
entry:
  br label %loop

loop:
  %i          = phi i32 [ 0, %entry ], [ %i.next,    %loop ]
  %sum        = phi i32 [ 0, %entry ], [ %new_sum,   %loop ]
  %dead_max   = phi i32 [ 0, %entry ], [ %new_max,   %loop ]  ; DEAD
  %dead_count = phi i32 [ 0, %entry ], [ %count_next,%loop ]  ; DEAD

  %ptr     = getelementptr i32, ptr %arr, i32 %i
  %val     = load i32, ptr %ptr
  %new_sum = add i32 %sum, %val

  %cmp_max    = icmp sgt i32 %val, %dead_max
  %new_max    = select i1 %cmp_max, i32 %val, i32 %dead_max  ; CASCADE
  %count_next = add i32 %dead_count, 1                        ; CASCADE

  %i.next = add i32 %i, 1
  %cond   = icmp slt i32 %i.next, %n
  br i1 %cond, label %loop, label %exit

exit:
  ret i32 %sum
}


; ============================================================
; [7] PHI / SSA — Dead PHI nodes
; ============================================================
define i32 @phi_demo(i32 %x, i1 %cond) {
entry:
  br i1 %cond, label %left, label %right

left:
  %a      = add i32 %x, 10
  %dead_a = mul i32 %a, 3               ; DEAD
  br label %join

right:
  %b      = sub i32 %x, 10
  %dead_b = mul i32 %b, 7               ; DEAD
  br label %join

join:
  %result   = phi i32 [ %a,      %left ], [ %b,      %right ]
  %dead_phi = phi i32 [ %dead_a, %left ], [ %dead_b, %right ] ; DEAD
  %dead_use = add i32 %dead_phi, 42                            ; CASCADE
  ret i32 %result
}


; ============================================================
; [8] BITWISE — Dead and/or/xor/shift chains
; ============================================================
define i32 @bitwise_demo(i32 %x, i32 %y) {
entry:
  %and_val = and  i32 %x, 255
  %or_val  = or   i32 %x, %y           ; DEAD
  %xor_val = xor  i32 %x, %y           ; DEAD
  %shl_val = shl  i32 %x, 2
  %shr_val = lshr i32 %y, 3            ; DEAD

  %dead_mask  = and i32 %or_val,    65535   ; CASCADE
  %dead_combo = xor i32 %dead_mask, %shr_val ; CASCADE
  %dead_shift = shl i32 %dead_combo, 4      ; CASCADE

  %result = or i32 %and_val, %shl_val
  ret i32 %result
}


; ============================================================
; [9] TYPE CAST — Dead zext/sext/trunc/sitofp
; ============================================================
define i64 @cast_demo(i32 %x, i8 %byte) {
entry:
  %ext        = zext i32 %x    to i64
  %dead_sext  = sext i8  %byte to i32    ; DEAD
  %dead_trunc = trunc i64 %ext to i16    ; DEAD
  %dead_zext2 = zext i8  %byte to i64   ; DEAD
  %dead_combo = add  i64 %dead_zext2, %ext ; CASCADE
  %shifted    = shl  i64 %ext, 8
  %dead_fp    = sitofp i32 %x   to double  ; DEAD
  %dead_back  = fptosi double %dead_fp to i32 ; CASCADE
  ret i64 %shifted
}


; ============================================================
; [10] RECURSIVE — Dead tracking in recursive calls
; ============================================================
define i32 @factorial(i32 %n) {
entry:
  %base = icmp sle i32 %n, 1
  br i1 %base, label %ret_base, label %recurse

ret_base:
  ret i32 1

recurse:
  %n_minus_1  = sub i32 %n, 1
  %sub_result = call i32 @factorial(i32 %n_minus_1)  ; PROTECTED
  %result     = mul i32 %n, %sub_result
  %dead_sum   = add i32 %n, %sub_result              ; DEAD
  %dead_log   = add i32 %n, 1                        ; DEAD
  %dead_depth = sub i32 %n, 2                        ; DEAD
  ret i32 %result
}


; ============================================================
; [11] SIDE EFFECTS — store/call/volatile/fence (CRITICAL)
; ============================================================
define void @side_effects(ptr %data, i32 %val) {
entry:
  %dead_calc = add i32 %val, 42          ; DEAD
  store i32 %val, ptr %data              ; PROTECTED — memory write
  call void @log(i32 %val)              ; PROTECTED — output
  %dead_mul  = mul i32 %val, 10         ; DEAD
  store volatile i32 1, ptr %data       ; PROTECTED — volatile
  fence seq_cst                          ; PROTECTED — barrier
  %dead_sub  = sub i32 %val, 1          ; DEAD
  %live_ptr  = getelementptr i32, ptr %data, i32 1
  store i32 0, ptr %live_ptr            ; PROTECTED — memory write
  call void @flush()                    ; PROTECTED — side effect
  %dead_final = add i32 %dead_calc, %dead_mul ; CASCADE
  ret void
}


; ============================================================
; [12] EXCEPTIONS — invoke/landingpad (always protected)
; ============================================================
define i32 @exception_demo(i32 %x) personality ptr @__gxx_personality_v0 {
entry:
  %dead_pre = add i32 %x, 100           ; DEAD
  %result = invoke i32 @may_throw(i32 %x)
              to label %normal unwind label %lpad ; PROTECTED

normal:
  %dead_post = mul i32 %result, 3       ; DEAD
  ret i32 %result

lpad:
  %pad = landingpad { ptr, i32 } catch ptr @type_info ; PROTECTED
  %dead_in_lpad = add i32 %x, 999      ; DEAD
  ret i32 -1
}


; ============================================================
; [13] ATOMICS — atomicrmw/fence/atomic load+store
; ============================================================
define i32 @atomic_demo(ptr %counter, ptr %flag) {
entry:
  %dead_load    = load i32, ptr %counter              ; DEAD
  %dead_calc    = add  i32 %dead_load, 1              ; CASCADE
  %old          = atomicrmw add ptr %counter, i32 1 seq_cst ; PROTECTED
  fence acquire                                        ; PROTECTED
  %read         = load atomic i32, ptr %flag seq_cst, align 4 ; PROTECTED
  %dead_cmp     = icmp eq i32 %read, 0               ; DEAD
  store atomic i32 1, ptr %flag release, align 4     ; PROTECTED
  fence seq_cst                                        ; PROTECTED
  %dead_old_use = mul i32 %old, 2                    ; DEAD
  ret i32 %old
}


; ============================================================
; [14] COMPLEX — Realistic loop with mixed dead/live/protected
; ============================================================
define i32 @complex_program(ptr %input, ptr %output, i32 %n) {
entry:
  %dead_flag = add i32 %n, 1            ; DEAD
  %dead_mask = and i32 %n, 255          ; DEAD
  br label %loop

loop:
  %i         = phi i32 [ 0, %entry ],   [ %i.next,   %loop ]
  %sum       = phi i32 [ 0, %entry ],   [ %new_sum,  %loop ]
  %dead_prod = phi i32 [ 1, %entry ],   [ %new_prod, %loop ]  ; DEAD

  %in_ptr    = getelementptr i32, ptr %input,  i32 %i
  %val       = load i32, ptr %in_ptr
  %processed = mul i32 %val, 2
  %out_ptr   = getelementptr i32, ptr %output, i32 %i
  store i32 %processed, ptr %out_ptr                  ; PROTECTED
  %new_sum   = add i32 %sum, %val
  %new_prod  = mul i32 %dead_prod, %val               ; CASCADE
  %dead_sq   = mul i32 %val, %val                     ; DEAD
  %dead_diff = sub i32 %processed, %val               ; DEAD
  %i.next    = add i32 %i, 1
  %cond      = icmp slt i32 %i.next, %n
  br i1 %cond, label %loop, label %exit

exit:
  %final_sum  = phi i32 [ %sum,       %loop ]
  %final_prod = phi i32 [ %dead_prod, %loop ]         ; DEAD
  %dead_avg   = sdiv i32 %final_sum, %n               ; DEAD
  %dead_log   = call i32 @compute_log(i32 %final_prod) ; PROTECTED
  call void @print_result(i32 %final_sum)             ; PROTECTED
  ret i32 %final_sum
}


; ============================================================
; [15] CUSTOM TEMPLATE — Write your own below this line
; ============================================================
define i32 @custom_example(i32 %a, i32 %b) {
entry:
  %live1 = add i32 %a, %b              ; LIVE
  %live2 = mul i32 %live1, 2           ; LIVE — returned
  %dead1 = sub i32 %a, %b             ; DEAD
  %dead2 = mul i32 %dead1, 10         ; CASCADE
  ret i32 %live2
}


; ============================================================
; Global declarations
; ============================================================
@.str.hello = private constant [6 x i8] c"hello\00"
@type_info  = external global ptr

declare void @use_value(i32)
declare void @print_int(i32)
declare i32  @compute(i32)
declare i32  @pure_func(i32)
declare void @log_message(ptr)
declare void @log(i32)
declare void @flush()
declare i32  @may_throw(i32)
declare i32  @__gxx_personality_v0(...)
declare i32  @compute_log(i32)
declare void @print_result(i32)
