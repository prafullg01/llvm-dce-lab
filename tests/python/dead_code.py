"""
dead_code.py — Python Test Program for Dead Code Elimination

Demonstrates dead code patterns in Python including:
- Unused variable assignments
- Unreachable code after return
- Unused function definitions
- Dead comprehensions

Note: CPython does minimal DCE. Tools like PyPy's JIT, mypy, and
vulture detect dead code. This file shows source-level patterns
that map to the LLVM IR concepts.
"""

import math
from typing import List, Optional


def calculate_statistics(data: List[float]) -> float:
    """Compute mean — but also has dead computations."""
    n = len(data)

    # LIVE: used in return
    total = sum(data)
    mean = total / n

    # DEAD: variance computed but never used
    variance = sum((x - mean) ** 2 for x in data) / n

    # DEAD: std_dev computed but never used
    std_dev = math.sqrt(variance) if variance > 0 else 0.0

    # DEAD: median computed but never used
    sorted_data = sorted(data)
    median = sorted_data[n // 2] if n % 2 == 1 else \
             (sorted_data[n // 2 - 1] + sorted_data[n // 2]) / 2

    # DEAD: mode computation never used
    from collections import Counter
    freq = Counter(data)
    mode = freq.most_common(1)[0][0]

    # DEAD: z-scores never used
    z_scores = [(x - mean) / std_dev if std_dev > 0 else 0 for x in data]

    # LIVE: side effect (print)
    print(f"Mean: {mean:.2f}")

    return mean


def matrix_multiply(a: List[List[float]],
                    b: List[List[float]]) -> List[List[float]]:
    """Matrix multiplication with dead computations."""
    rows_a, cols_a = len(a), len(a[0])
    rows_b, cols_b = len(b), len(b[0])

    # LIVE: result used in return
    result = [[0.0] * cols_b for _ in range(rows_a)]

    # DEAD: transpose never used
    b_transpose = [[b[j][i] for j in range(rows_b)] for i in range(cols_b)]

    # DEAD: tracking element count but never used
    operations_count = 0

    for i in range(rows_a):
        for j in range(cols_b):
            for k in range(cols_a):
                result[i][j] += a[i][k] * b[k][j]
                operations_count += 1  # DEAD: never read

    # DEAD: norm of result never used
    frobenius_norm = math.sqrt(
        sum(result[i][j] ** 2
            for i in range(rows_a)
            for j in range(cols_b))
    )

    return result


# DEAD: entire function never called
def unused_helper(x: float) -> float:
    """This function is defined but never called — dead code."""
    return math.sin(x) * math.cos(x) + math.tan(x)


def prime_sieve(limit: int) -> List[int]:
    """Sieve of Eratosthenes with dead tracking variables."""
    sieve = [True] * (limit + 1)
    sieve[0] = sieve[1] = False

    # DEAD: twin prime count never used
    twin_prime_count = 0

    # DEAD: prime gap tracking never used
    last_prime = 2
    max_gap = 0

    primes = []
    for i in range(2, limit + 1):
        if sieve[i]:
            primes.append(i)

            # DEAD: gap tracking
            gap = i - last_prime
            if gap > max_gap:
                max_gap = gap
            last_prime = i

            # DEAD: twin prime detection
            if i >= 4 and sieve[i - 2]:
                twin_prime_count += 1

            for j in range(i * i, limit + 1, i):
                sieve[j] = False

    # DEAD: sum of primes never used
    prime_sum = sum(primes)

    # DEAD: prime density never used
    density = len(primes) / limit if limit > 0 else 0

    return primes


if __name__ == "__main__":
    data = [2.5, 3.7, 1.2, 4.8, 3.3, 2.1, 5.5]
    avg = calculate_statistics(data)

    # DEAD: result captured but never used
    primes = prime_sieve(100)

    a = [[1, 2], [3, 4]]
    b = [[5, 6], [7, 8]]
    product = matrix_multiply(a, b)

    # DEAD: determinant never used
    det = product[0][0] * product[1][1] - product[0][1] * product[1][0]

    print(f"Matrix product[0][0] = {product[0][0]}")
