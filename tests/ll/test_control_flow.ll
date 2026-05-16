; ============================================================
; test_control_flow.ll — Dead Code Across Branches
; Category: Control Flow | Difficulty: Intermediate
; Dead: %dead_then, %dead_else, %dead_after
; Protected: call void @print_int (side effect)
; ============================================================

define i32 @control_flow(i32 %n) {
entry:
  %cmp = icmp sgt i32 %n, 10
  br i1 %cmp, label %then, label %else

then:
  %a        = mul i32 %n, 2
  %dead_then = add i32 %a, 999    ; DEAD — never used outside this block
  br label %merge

else:
  %b        = add i32 %n, 5
  %dead_else = mul i32 %b, 777   ; DEAD — never used outside this block
  br label %merge

merge:
  %result     = phi i32 [ %a, %then ], [ %b, %else ]
  %dead_after = sub i32 %result, 1  ; DEAD — result discarded
  call void @print_int(i32 %result) ; PROTECTED — output side effect
  ret i32 %result
}

declare void @print_int(i32)
