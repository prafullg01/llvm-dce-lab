; ============================================================
; test_type_cast.ll — Dead Type Conversions
; Category: Type Conversion / Casting | Difficulty: Beginner
;
; zext/sext/trunc/sitofp/fptosi produce values. If the output
; is never used, the cast instruction is dead.
; ============================================================

define i64 @cast_demo(i32 %x, i8 %byte) {
entry:
  %ext  = zext i32 %x to i64          ; LIVE — used in %shifted + dead chain

  %dead_sext  = sext i8 %byte to i32  ; DEAD — never used
  %dead_trunc = trunc i64 %ext to i16 ; DEAD — never used
  %dead_zext2 = zext i8 %byte to i64  ; DEAD — only feeds dead add
  %dead_combo = add i64 %dead_zext2, %ext ; CASCADE

  %shifted = shl i64 %ext, 8          ; LIVE — returned

  %dead_fp   = sitofp i32 %x to double ; DEAD — never used
  %dead_back = fptosi double %dead_fp to i32 ; CASCADE

  ret i64 %shifted
}
