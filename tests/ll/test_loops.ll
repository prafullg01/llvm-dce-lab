; ============================================================
; test_loops.ll — Dead Loop Accumulators
; Category: Loops & Iteration | Difficulty: Advanced
;
; %dead_max and %dead_count track loop statistics that are
; never used after the loop exits — classic dead accumulator.
; The fixpoint loop catches cascading PHI elimination.
; ============================================================

define i32 @loop_demo(ptr %arr, i32 %n) {
entry:
  br label %loop

loop:
  %i          = phi i32 [ 0, %entry ], [ %i.next,    %loop ]
  %sum        = phi i32 [ 0, %entry ], [ %new_sum,   %loop ]  ; LIVE
  %dead_max   = phi i32 [ 0, %entry ], [ %new_max,   %loop ]  ; DEAD — unused after exit
  %dead_count = phi i32 [ 0, %entry ], [ %count_next,%loop ]  ; DEAD — unused after exit

  %ptr     = getelementptr i32, ptr %arr, i32 %i
  %val     = load i32, ptr %ptr           ; LIVE

  %new_sum = add i32 %sum, %val           ; LIVE — feeds back into phi

  %cmp_max = icmp sgt i32 %val, %dead_max
  %new_max = select i1 %cmp_max, i32 %val, i32 %dead_max  ; CASCADE

  %count_next = add i32 %dead_count, 1   ; CASCADE

  %i.next = add i32 %i, 1
  %cond   = icmp slt i32 %i.next, %n
  br i1 %cond, label %loop, label %exit

exit:
  ret i32 %sum
}
