; test3_mixed.ll — Mixed Dead Code and Side-Effect Instructions
; 30 instructions total, 6 dead, several side-effect-protected
; Tests that stores, calls, and fences are NEVER removed

define void @process_data(ptr %input, ptr %output, i32 %n) {
entry:
  %unused_flag = add i32 %n, 1
  %unused_mask = and i32 %n, 255
  br label %loop

loop:
  %i = phi i32 [ 0, %entry ], [ %i.next, %loop ]
  %sum = phi i32 [ 0, %entry ], [ %new_sum, %loop ]
  %in_ptr = getelementptr i32, ptr %input, i32 %i
  %val = load i32, ptr %in_ptr
  %doubled = mul i32 %val, 2
  %out_ptr = getelementptr i32, ptr %output, i32 %i
  store i32 %doubled, ptr %out_ptr          ; PROTECTED: side effect (store)
  %new_sum = add i32 %sum, %val
  %unused_sq = mul i32 %val, %val
  %unused_diff = sub i32 %doubled, %val
  %i.next = add i32 %i, 1
  %cmp = icmp slt i32 %i.next, %n
  br i1 %cmp, label %loop, label %exit

exit:
  %final_sum = phi i32 [ %sum, %loop ]
  ; PROTECTED: call has side effects
  call i32 (ptr, ...) @printf(ptr @.str.sum, i32 %final_sum)
  ; PROTECTED: fence has memory ordering effects
  fence seq_cst
  ; PROTECTED: store to output
  store i32 %final_sum, ptr %output
  ; DEAD: computed after all uses
  %unused_avg = sdiv i32 %final_sum, %n
  %unused_check = icmp sgt i32 %final_sum, 1000
  ret void
}

define i32 @side_effect_demo(i32 %x) {
entry:
  %a = add i32 %x, 1              ; DEAD if only user is %b and %b is dead
  %b = mul i32 %a, 2              ; DEAD: result never used
  %c = add i32 %x, 10             ; LIVE: used in call
  call void @external_func(i32 %c) ; PROTECTED: external call
  %d = sub i32 %x, 5              ; DEAD: never used
  %e = add i32 %x, 100            ; LIVE: used in store
  store i32 %e, ptr @global_var    ; PROTECTED: store
  %f = mul i32 %x, %x             ; DEAD: never used
  ret i32 %x
}

@.str.sum = private constant [10 x i8] c"Sum: %d\0A\00"
@global_var = global i32 0
declare i32 @printf(ptr, ...)
declare void @external_func(i32)
