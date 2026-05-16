; ============================================================
; test_arithmetic.ll — Dead Arithmetic Computations
; Category: Arithmetic Operations | Difficulty: Beginner
; Dead instructions: %dead1, %dead2, %dead3, %dead4
; Live instructions: %sum, %diff, %prod, %result
; Protected: call void @use_value (side effect)
; ============================================================

define i32 @arithmetic_demo(i32 %x, i32 %y) {
entry:
  %sum  = add  i32 %x, %y          ; LIVE — used in cmp + result
  %diff = sub  i32 %x, %y          ; LIVE — used in result select
  %prod = mul  i32 %x, %y          ; LIVE — passed to @use_value
  %quot = sdiv i32 %x, %y          ; LIVE — used downstream (demo)

  %dead1 = add i32 %sum, 100       ; DEAD — %dead1 never used
  %dead2 = mul i32 %dead1, 3       ; CASCADE — only user (%dead1) is dead
  %dead3 = sub i32 %prod, %diff    ; DEAD — %dead3 never used
  %dead4 = add i32 %dead2, %dead3  ; CASCADE — all users dead

  %live_cmp = icmp sgt i32 %sum, 0
  %result   = select i1 %live_cmp, i32 %sum, i32 %diff

  call void @use_value(i32 %prod)   ; PROTECTED — call has side effects
  ret i32 %result
}

declare void @use_value(i32)
