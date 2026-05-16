; ============================================================
; test_complex.ll — Mixed Complex Program
; Category: Mixed Complex | Difficulty: Advanced
;
; Realistic loop processing input/output array.
; Dead: %dead_flag, %dead_mask, %dead_prod, %dead_sq, %dead_diff,
;       %dead_avg, %dead_log (cascade), %final_prod (phi)
; Protected: store, call @print_result
; ============================================================

define i32 @complex_program(ptr %input, ptr %output, i32 %n) {
entry:
  %dead_flag = add i32 %n, 1        ; DEAD
  %dead_mask = and i32 %n, 255      ; DEAD
  br label %loop

loop:
  %i        = phi i32 [ 0, %entry ],      [ %i.next,   %loop ]
  %sum      = phi i32 [ 0, %entry ],      [ %new_sum,  %loop ]  ; LIVE
  %dead_prod = phi i32 [ 1, %entry ],     [ %new_prod, %loop ]  ; DEAD

  %in_ptr    = getelementptr i32, ptr %input,  i32 %i
  %val       = load i32, ptr %in_ptr            ; LIVE
  %processed = mul i32 %val, 2                  ; LIVE
  %out_ptr   = getelementptr i32, ptr %output, i32 %i
  store i32 %processed, ptr %out_ptr            ; PROTECTED

  %new_sum   = add i32 %sum, %val               ; LIVE
  %new_prod  = mul i32 %dead_prod, %val         ; CASCADE

  %dead_sq   = mul i32 %val, %val               ; DEAD
  %dead_diff = sub i32 %processed, %val         ; DEAD

  %i.next = add i32 %i, 1
  %cond   = icmp slt i32 %i.next, %n
  br i1 %cond, label %loop, label %exit

exit:
  %final_sum  = phi i32 [ %sum,       %loop ]   ; LIVE
  %final_prod = phi i32 [ %dead_prod, %loop ]   ; DEAD

  %dead_avg  = sdiv i32 %final_sum, %n          ; DEAD
  %dead_log  = call i32 @compute_log(i32 %final_prod) ; PROTECTED (call)
  call void @print_result(i32 %final_sum)        ; PROTECTED

  ret i32 %final_sum
}

declare i32 @compute_log(i32)
declare void @print_result(i32)
