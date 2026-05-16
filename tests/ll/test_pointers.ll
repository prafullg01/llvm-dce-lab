; ============================================================
; test_pointers.ll — Dead GEP / Pointer Arithmetic
; Category: Pointer & Array Operations | Difficulty: Advanced
;
; getelementptr has NO side effects — it only computes an
; address. If the resulting pointer is never loaded/stored,
; the GEP is dead and safe to remove.
; ============================================================

define i32 @pointer_ops(ptr %base, i32 %idx) {
entry:
  %p1   = getelementptr i32, ptr %base, i32 %idx  ; LIVE — used in load+store
  %val  = load i32, ptr %p1                         ; LIVE — used in %doubled

  %dead_p2 = getelementptr i32, ptr %base, i32 10  ; DEAD — address never used
  %dead_p3 = getelementptr i32, ptr %base, i32 20  ; DEAD — address never used

  %dead_offset = add i32 %idx, 5
  %dead_p4     = getelementptr i32, ptr %base, i32 %dead_offset ; CASCADE

  %doubled = mul i32 %val, 2
  store i32 %doubled, ptr %p1         ; PROTECTED — store

  %dead_cast = ptrtoint ptr %dead_p2 to i64  ; CASCADE — dead_p2 is dead

  ret i32 %val
}
