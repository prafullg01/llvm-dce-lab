; ============================================================
; test_phi_ssa.ll — Dead PHI Nodes in SSA Form
; Category: PHI Nodes / SSA Form | Difficulty: Advanced
;
; PHI nodes can be dead just like any other instruction:
; if %dead_phi's result is never consumed, it and its operands
; (%dead_a, %dead_b) can all be removed by the fixpoint loop.
; ============================================================

define i32 @phi_demo(i32 %x, i1 %cond) {
entry:
  br i1 %cond, label %left, label %right

left:
  %a      = add i32 %x, 10       ; LIVE — used in %result phi
  %dead_a = mul i32 %a, 3        ; DEAD — only used in dead phi
  br label %join

right:
  %b      = sub i32 %x, 10       ; LIVE — used in %result phi
  %dead_b = mul i32 %b, 7        ; DEAD — only used in dead phi
  br label %join

join:
  %result   = phi i32 [ %a, %left ], [ %b, %right ]       ; LIVE — returned
  %dead_phi = phi i32 [ %dead_a, %left ], [ %dead_b, %right ] ; DEAD
  %dead_use = add i32 %dead_phi, 42   ; CASCADE

  ret i32 %result
}
