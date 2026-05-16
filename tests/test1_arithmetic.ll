; test1_arithmetic.ll — Pure Arithmetic Dead Code
; 20 instructions total, 8 are dead (unused arithmetic)
; Source: Equivalent of test1_dead_arithmetic.c

define i32 @compute_grade(i32 %score) {
entry:
  %grade = sdiv i32 %score, 10
  %unused_sum = add i32 %score, 42
  %unused_product = mul i32 %score, 3
  %temp1 = add i32 %unused_sum, %unused_product
  %temp2 = mul i32 %temp1, 2
  %cmp = icmp sgt i32 %grade, 5
  %bonus = select i1 %cmp, i32 10, i32 0
  call i32 (ptr, ...) @printf(ptr @.str.bonus, i32 %bonus)
  %penalty_cmp = icmp slt i32 %grade, 3
  %penalty = select i1 %penalty_cmp, i32 -5, i32 0
  ret i32 %grade
}

define i32 @matrix_trace(ptr %mat) {
entry:
  %p00 = getelementptr [3 x [3 x i32]], ptr %mat, i64 0, i64 0, i64 0
  %v00 = load i32, ptr %p00
  %p11 = getelementptr [3 x [3 x i32]], ptr %mat, i64 0, i64 1, i64 1
  %v11 = load i32, ptr %p11
  %p22 = getelementptr [3 x [3 x i32]], ptr %mat, i64 0, i64 2, i64 2
  %v22 = load i32, ptr %p22
  %sum01 = add i32 %v00, %v11
  %trace = add i32 %sum01, %v22
  %p01 = getelementptr [3 x [3 x i32]], ptr %mat, i64 0, i64 0, i64 1
  %v01 = load i32, ptr %p01
  %off_diag_partial = add i32 %v01, %v00
  %unused_det = mul i32 %v00, %v11
  call i32 (ptr, ...) @printf(ptr @.str.trace, i32 %trace)
  ret i32 %trace
}

define i32 @main() {
entry:
  %result = call i32 @compute_grade(i32 75)
  %doubled = mul i32 %result, 2
  call i32 (ptr, ...) @printf(ptr @.str.grade, i32 %result)
  ret i32 0
}

@.str.bonus = private constant [11 x i8] c"Bonus: %d\0A\00"
@.str.trace = private constant [11 x i8] c"Trace: %d\0A\00"
@.str.grade = private constant [11 x i8] c"Grade: %d\0A\00"
declare i32 @printf(ptr, ...)
