/*
 * test1_dead_arithmetic.c — C Test Program for Dead Code Elimination
 *
 * This program contains several unused computations (dead code)
 * mixed with live code. Compile to LLVM IR with:
 *   clang -S -emit-llvm -O0 test1_dead_arithmetic.c -o test1.ll
 */

#include <stdio.h>

int compute_grade(int score) {
    // LIVE: used in return
    int grade = score / 10;

    // DEAD: result never used
    int unused_sum = score + 42;

    // DEAD: result never used
    int unused_product = score * 3;

    // DEAD: chain of dead computations
    int temp1 = unused_sum + unused_product;  // dead (operands also dead)
    int temp2 = temp1 * 2;                    // dead

    // LIVE: used in printf (side effect)
    int bonus = grade > 5 ? 10 : 0;
    printf("Bonus: %d\n", bonus);

    // DEAD: computed but never used
    int penalty = grade < 3 ? -5 : 0;

    return grade;  // LIVE: return value
}

int matrix_trace(int mat[3][3]) {
    // LIVE: used in return
    int trace = mat[0][0] + mat[1][1] + mat[2][2];

    // DEAD: off-diagonal sum never used
    int off_diag = mat[0][1] + mat[0][2] + mat[1][0]
                 + mat[1][2] + mat[2][0] + mat[2][1];

    // DEAD: determinant approximation never used
    int det_approx = mat[0][0] * (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1]);

    // LIVE: side effect (printf)
    printf("Trace: %d\n", trace);

    return trace;
}

int main() {
    int score = 75;
    int result = compute_grade(score);

    // DEAD: never used
    int doubled = result * 2;

    printf("Grade: %d\n", result);
    return 0;
}
