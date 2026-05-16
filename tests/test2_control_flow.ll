; test2_control_flow.ll — Dead Code Across Branches
; 25 instructions total, 10 are dead
; Tests phi nodes, branches, and dead computations in branches

define i32 @fibonacci_with_dead(i32 %n) {
entry:
  %cmp_base = icmp sle i32 %n, 1
  br i1 %cmp_base, label %base, label %loop.preheader

base:
  ret i32 %n

loop.preheader:
  br label %loop

loop:
  %i = phi i32 [ 2, %loop.preheader ], [ %i.next, %loop ]
  %prev = phi i32 [ 0, %loop.preheader ], [ %curr, %loop ]
  %curr = phi i32 [ 1, %loop.preheader ], [ %next, %loop ]
  %max_seen = phi i32 [ 0, %loop.preheader ], [ %new_max, %loop ]
  %iter_count = phi i32 [ 0, %loop.preheader ], [ %iter_next, %loop ]
  %next = add i32 %prev, %curr
  %cmp_max = icmp sgt i32 %curr, %max_seen
  %new_max = select i1 %cmp_max, i32 %curr, i32 %max_seen
  %iter_next = add i32 %iter_count, 1
  %i.next = add i32 %i, 1
  %cmp_loop = icmp sle i32 %i.next, %n
  br i1 %cmp_loop, label %loop, label %exit

exit:
  %final_curr = phi i32 [ %curr, %loop ]
  %final_prev = phi i32 [ %prev, %loop ]
  %final_max = phi i32 [ %max_seen, %loop ]
  %final_iter = phi i32 [ %iter_count, %loop ]
  %golden = sitofp i32 %final_curr to double
  %prev_f = sitofp i32 %final_prev to double
  %ratio = fdiv double %golden, %prev_f
  %unused_str_len = add i32 %final_iter, 20
  ret i32 %final_curr
}

define i32 @classify(i32 %score) {
entry:
  %is_passing = icmp sge i32 %score, 60
  %percentile = mul i32 %score, 100
  %percentile2 = sdiv i32 %percentile, 120
  %cmp90 = icmp sge i32 %score, 90
  br i1 %cmp90, label %grade_a, label %check_b

grade_a:
  %bonus = add i32 10, 0
  br label %done

check_b:
  %cmp80 = icmp sge i32 %score, 80
  br i1 %cmp80, label %grade_b, label %check_c

grade_b:
  br label %done

check_c:
  %cmp70 = icmp sge i32 %score, 70
  br i1 %cmp70, label %grade_c, label %grade_f

grade_c:
  br label %done

grade_f:
  %deficit = sub i32 70, %score
  br label %done

done:
  %grade = phi i32 [ 4, %grade_a ], [ 3, %grade_b ], [ 2, %grade_c ], [ 0, %grade_f ]
  call i32 (ptr, ...) @printf(ptr @.str, i32 %grade)
  ret i32 %grade
}

@.str = private constant [11 x i8] c"Grade: %d\0A\00"
declare i32 @printf(ptr, ...)
