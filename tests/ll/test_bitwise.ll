; ============================================================
; test_bitwise.ll — Dead Bitwise / Logical Instructions
; Category: Bitwise / Logical | Difficulty: Beginner
;
; and/or/xor/shl/lshr produce values — if those values are
; never consumed, the instructions are dead.
; ============================================================

define i32 @bitwise_demo(i32 %x, i32 %y) {
entry:
  %and_val = and  i32 %x, 255      ; LIVE — used in %result
  %or_val  = or   i32 %x, %y       ; DEAD — never used
  %xor_val = xor  i32 %x, %y       ; DEAD — never used
  %shl_val = shl  i32 %x, 2        ; LIVE — used in %result
  %shr_val = lshr i32 %y, 3        ; DEAD — only feeds dead chain

  %dead_mask  = and i32 %or_val,   65535    ; CASCADE
  %dead_combo = xor i32 %dead_mask, %shr_val ; CASCADE
  %dead_shift = shl i32 %dead_combo, 4      ; CASCADE

  %result = or i32 %and_val, %shl_val       ; LIVE — returned
  ret i32 %result
}
