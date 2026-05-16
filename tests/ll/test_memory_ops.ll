; ============================================================
; test_memory_ops.ll — Dead Loads vs Protected Stores
; Category: Memory Operations | Difficulty: Intermediate
;
; KEY INSIGHT: Stores MUST be preserved even if their address
; is never read again — they modify observable memory state.
; Dead loads (no consumer) are safe to remove.
; ============================================================

define void @memory_ops(ptr %arr, i32 %n) {
entry:
  %p0 = getelementptr i32, ptr %arr, i32 0
  %v0 = load i32, ptr %p0         ; LIVE — used in %doubled

  %p1 = getelementptr i32, ptr %arr, i32 1
  %v1 = load i32, ptr %p1         ; LIVE — used in store below

  %dead_sum = add i32 %v0, %v1    ; DEAD — sum computed but discarded

  %dead_load_ptr = getelementptr i32, ptr %arr, i32 5  ; CASCADE
  %dead_load     = load i32, ptr %dead_load_ptr         ; DEAD — result unused

  %doubled = mul i32 %v0, 2
  store i32 %doubled, ptr %p0     ; PROTECTED — store: modifies memory
  store i32 %v1, ptr %p1          ; PROTECTED — store: modifies memory

  %dead_calc = add i32 %dead_load, %n  ; CASCADE — all users dead
  ret void
}
