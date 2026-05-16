; ============================================================
; test_function_calls.ll — Call Side-Effects Preservation
; Category: Function Calls | Difficulty: Intermediate
;
; KEY INSIGHT: Even if a call's RETURN VALUE is never used,
; the call itself must be preserved — it may perform I/O,
; modify global state, or throw exceptions.
; ============================================================

define i32 @func_calls(i32 %x) {
entry:
  %a = call i32 @compute(i32 %x)    ; PROTECTED — call, side effects
  %b = call i32 @compute(i32 42)    ; PROTECTED — call, side effects

  %dead_add = add i32 %a, %b        ; DEAD — sum discarded

  %c = call i32 @pure_func(i32 %x)  ; PROTECTED — cannot prove pure

  call void @log_message(ptr @.str) ; PROTECTED — void call, output

  %dead_mul = mul i32 %c, 10        ; DEAD — discarded

  %result = add i32 %a, 1
  ret i32 %result
}

@.str = private constant [6 x i8] c"hello\00"

declare i32 @compute(i32)
declare i32 @pure_func(i32)
declare void @log_message(ptr)
