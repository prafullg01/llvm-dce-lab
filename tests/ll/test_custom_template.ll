; ============================================================
; test_custom_template.ll — Blank Template for Custom Input
; Category: Custom LLVM IR | Difficulty: Any
;
; Use this as a starting point to write your own IR.
; Run it through the Analysis and Transform passes.
;
; LLVM IR Quick Reference:
;   %name = <opcode> <type> <operands>   ; assignment
;   <opcode> <type> <operands>            ; void instruction
;   %name = phi <type> [val, %pred], ... ; phi node
;   br i1 %cond, label %t, label %f      ; conditional branch
;   br label %target                      ; unconditional branch
;   ret <type> <value>                    ; return
; ============================================================

define i32 @my_function(i32 %a, i32 %b) {
entry:
  ; --- LIVE instructions (used in computation) ---
  %live1 = add i32 %a, %b         ; LIVE: used in %live2
  %live2 = mul i32 %live1, 2      ; LIVE: returned

  ; --- DEAD instructions (result never used) ---
  %dead1 = sub i32 %a, %b         ; DEAD: never consumed
  %dead2 = mul i32 %dead1, 10     ; CASCADE: only user is dead

  ; --- Try adding a side-effect instruction ---
  ; call void @some_func(i32 %a)   ; PROTECTED (uncomment to test)

  ret i32 %live2
}

; Add more functions below:
; define i32 @my_other_function(i32 %x) {
; entry:
;   ret i32 %x
; }

; Declare external functions if needed:
; declare void @some_func(i32)
