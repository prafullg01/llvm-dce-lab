; ============================================================
; test_side_effects.ll — Instructions That Must Never Be Removed
; Category: Side Effects / Unsafe Eliminations | Difficulty: Critical
;
; PROTECTED instructions (even if "unused"):
;   store       — modifies memory (heap, stack, globals)
;   call        — may perform I/O, throw, change global state
;   volatile    — hardware-mapped memory access
;   fence       — enforces memory ordering for concurrency
;
; All arithmetic between them is DEAD and safe to remove.
; ============================================================

define void @side_effects(ptr %data, i32 %val) {
entry:
  %dead_calc = add i32 %val, 42      ; DEAD

  store i32 %val, ptr %data          ; PROTECTED — memory write
  call void @log(i32 %val)           ; PROTECTED — output side effect

  %dead_mul  = mul i32 %val, 10      ; DEAD

  store volatile i32 1, ptr %data    ; PROTECTED — volatile: hardware I/O
  fence seq_cst                      ; PROTECTED — memory ordering barrier

  %dead_sub  = sub i32 %val, 1       ; DEAD

  %live_ptr  = getelementptr i32, ptr %data, i32 1
  store i32 0, ptr %live_ptr         ; PROTECTED — memory write

  call void @flush()                 ; PROTECTED — flush side effect

  %dead_final = add i32 %dead_calc, %dead_mul  ; CASCADE
  ret void
}

declare void @log(i32)
declare void @flush()
