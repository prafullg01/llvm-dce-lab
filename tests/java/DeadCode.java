/**
 * DeadCode.java — Java Test Program for Dead Code Elimination
 *
 * Demonstrates dead code patterns in Java including:
 * - Unused local computations
 * - Dead branches
 * - Unused method return values
 *
 * Note: Java's JIT compiler (C2/Graal) performs similar DCE on bytecode.
 * This file shows the source-level patterns. The LLVM IR equivalent
 * is provided in test2_control_flow.ll.
 */

public class DeadCode {

    // Method with mixed live and dead computations
    public static int fibonacci(int n) {
        if (n <= 1) return n;

        int prev = 0, curr = 1;

        // DEAD: tracking max value but never using it
        int maxSeen = 0;

        // DEAD: counting iterations but never using the count
        int iterCount = 0;

        for (int i = 2; i <= n; i++) {
            int next = prev + curr;
            prev = curr;
            curr = next;

            // DEAD: maxSeen is never read after the loop
            if (curr > maxSeen) {
                maxSeen = curr;
            }

            // DEAD: iterCount is never read after the loop
            iterCount++;
        }

        // DEAD: computing ratio but never using it
        double goldenRatio = (double) curr / prev;

        // DEAD: computing a string but never using it
        String report = "Fibonacci(" + n + ") computed in " + iterCount + " iterations";

        return curr;  // LIVE: return value
    }

    // Method with dead branches
    public static String classify(int score) {
        // LIVE: used in return
        String grade;

        // DEAD: this flag is never checked
        boolean isPassing = score >= 60;

        // DEAD: computed but never used
        int percentile = score * 100 / 120;

        if (score >= 90) {
            grade = "A";
            // DEAD: bonus never used
            int bonus = 10;
        } else if (score >= 80) {
            grade = "B";
        } else if (score >= 70) {
            grade = "C";
        } else {
            grade = "F";
            // DEAD: computed inside branch but never used
            int deficit = 70 - score;
        }

        // LIVE: side effect (printing)
        System.out.println("Grade: " + grade);

        return grade;
    }

    // Method with unused array operations
    public static int[] processArray(int[] arr) {
        int n = arr.length;

        // LIVE: result array used in return
        int[] result = new int[n];

        // DEAD: sum computed but never used
        int sum = 0;

        // DEAD: min/max tracking but never used
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;

        for (int i = 0; i < n; i++) {
            result[i] = arr[i] * 2;  // LIVE

            sum += arr[i];            // DEAD (sum never read)
            if (arr[i] < min) min = arr[i];  // DEAD
            if (arr[i] > max) max = arr[i];  // DEAD
        }

        // DEAD: average never used
        double average = (double) sum / n;

        // DEAD: range never used
        int range = max - min;

        return result;  // LIVE
    }

    public static void main(String[] args) {
        int fib = fibonacci(10);
        System.out.println("Fib(10) = " + fib);

        // DEAD: result of classify is captured but never used
        String grade = classify(85);

        int[] data = {1, 2, 3, 4, 5};
        int[] processed = processArray(data);

        // DEAD: length computed but never used
        int len = processed.length;

        System.out.println("Done processing " + data.length + " elements");
    }
}
