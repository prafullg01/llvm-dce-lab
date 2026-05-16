; ============================================================
; test_atomics.ll — Atomic Operations (Always Protected)
; Category: Atomic / Concurrency | Difficulty: Expert
; ============================================================

define i32 @atomic_demo(ptr %counter, ptr %flag) {
entry:
  %dead_load = load i32, ptr %counter       ; DEAD — non-atomic, unused
  %dead_calc = add i32 %dead_load, 1        ; CASCADE

  %old  = atomicrmw add ptr %counter, i32 1 seq_cst   ; PROTECTED
  fence acquire                                         ; PROTECTED

  %read = load atomic i32, ptr %flag seq_cst, align 4  ; PROTECTED
  %dead_cmp = icmp eq i32 %read, 0          ; DEAD

  store atomic i32 1, ptr %flag release, align 4 ; PROTECTED
  fence seq_cst                              ; PROTECTED

  %dead_old_use = mul i32 %old, 2           ; DEAD
  ret i32 %old
}
