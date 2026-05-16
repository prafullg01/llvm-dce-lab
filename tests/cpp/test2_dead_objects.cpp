/*
 * test2_dead_objects.cpp — C++ Test Program for Dead Code Elimination
 *
 * Demonstrates dead code patterns in C++ including:
 * - Unused object computations
 * - Dead template instantiations results
 * - Unused lambda captures
 *
 * Compile: clang++ -S -emit-llvm -O0 test2_dead_objects.cpp -o test2.ll
 */

#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>

class Vector3D {
public:
    double x, y, z;
    Vector3D(double x, double y, double z) : x(x), y(y), z(z) {}

    double magnitude() const {
        return std::sqrt(x*x + y*y + z*z);
    }

    Vector3D cross(const Vector3D& other) const {
        return Vector3D(
            y * other.z - z * other.y,
            z * other.x - x * other.z,
            x * other.y - y * other.x
        );
    }

    double dot(const Vector3D& other) const {
        return x * other.x + y * other.y + z * other.z;
    }
};

template<typename T>
T clamp_value(T value, T lo, T hi) {
    // LIVE: used in return
    T clamped = std::max(lo, std::min(value, hi));

    // DEAD: unused computation
    T range = hi - lo;

    // DEAD: unused normalized value
    T normalized = (value - lo) / (hi - lo);

    return clamped;
}

double process_vectors() {
    Vector3D a(1.0, 2.0, 3.0);
    Vector3D b(4.0, 5.0, 6.0);

    // LIVE: used in return
    double dot_product = a.dot(b);

    // DEAD: cross product computed but never used
    Vector3D cross = a.cross(b);

    // DEAD: magnitudes computed but never used
    double mag_a = a.magnitude();
    double mag_b = b.magnitude();

    // DEAD: angle computed but never used
    double cos_angle = dot_product / (mag_a * mag_b);

    // LIVE: side effect (cout)
    std::cout << "Dot product: " << dot_product << std::endl;

    return dot_product;
}

int main() {
    double result = process_vectors();

    // DEAD: clamped value never used
    double clamped = clamp_value(result, 0.0, 100.0);

    // DEAD: vector created but never used
    std::vector<int> unused_vec = {1, 2, 3, 4, 5};

    // DEAD: lambda defined but never called
    auto unused_lambda = [&result]() { return result * 2.0; };

    std::cout << "Result: " << result << std::endl;
    return 0;
}
