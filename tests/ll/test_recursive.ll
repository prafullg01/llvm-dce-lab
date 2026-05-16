; ============================================================
; test_recursive.ll — Dead Variables in Recursive Functions
; Category: Recursive Functions | Difficulty: Advanced
;
; Dead tracking accumulators (%dead_sum, %dead_log, %dead_depth)
; are computed each recursive call but the results are never
; used — eliminated safely.
; ============================================================

define i32 @factorial(i32 %n) {
entry:
  %base = icmp sle i32 %n, 1
  br i1 %base, label %ret_base, label %recurse

ret_base:
  ret i32 1

recurse:
  %n_minus_1  = sub i32 %n, 1
  %sub_result = call i32 @factorial(i32 %n_minus_1)  ; PROTECTED — recursive call

  %result     = mul i32 %n, %sub_result   ; LIVE — returned

  %dead_sum   = add i32 %n, %sub_result   ; DEAD — never used
  %dead_log   = add i32 %n, 1             ; DEAD — never used
  %dead_depth = sub i32 %n, 2             ; DEAD — never used

  ret i32 %result
}
