//===----------------------------------------------------------------------===//
//
//  DeadCodeAnalysis.h — LLVM Analysis Pass for Dead Code Detection
//
//  This pass walks each BasicBlock in a Function and identifies instructions
//  whose results are never used (empty use-list) AND that have no side effects.
//  It produces a structured report for each function.
//
//===----------------------------------------------------------------------===//

#ifndef DEAD_CODE_ANALYSIS_H
#define DEAD_CODE_ANALYSIS_H

#include "llvm/IR/PassManager.h"
#include "llvm/IR/Function.h"
#include "llvm/IR/Instruction.h"
#include <vector>
#include <string>

namespace dce {

/// Holds the result of the dead code analysis for a single function.
struct DeadCodeAnalysisResult {
    /// Name of the analyzed function.
    std::string FunctionName;

    /// Total number of instructions in the function.
    unsigned TotalInstructions = 0;

    /// Pointers to instructions identified as dead (unused + no side effects).
    std::vector<llvm::Instruction*> DeadInstructions;

    /// Pointers to instructions that are unused but have side effects
    /// (stores, calls, fences, etc.) — these must NOT be removed.
    std::vector<llvm::Instruction*> SideEffectProtected;

    /// Returns the count of dead (safely removable) instructions.
    unsigned getDeadCount() const { return DeadInstructions.size(); }

    /// Returns the count of side-effect-protected instructions.
    unsigned getProtectedCount() const { return SideEffectProtected.size(); }

    /// Pretty-prints the analysis report to errs().
    void print(llvm::raw_ostream &OS) const;

    /// Invalidation hook — we never invalidate.
    bool invalidate(llvm::Function &F, const llvm::PreservedAnalyses &PA,
                    llvm::FunctionAnalysisManager::Invalidator &) {
        return false;  // Never invalidate
    }
};

/// Analysis pass that identifies dead instructions in a function.
///
/// An instruction is considered "dead" if ALL of the following hold:
///   1. Its use-list is empty (no other instruction consumes its result)
///   2. It is NOT a terminator instruction (br, ret, switch, etc.)
///   3. It does NOT have side effects (store, call, fence, atomicrmw, etc.)
///
/// Instructions that are unused but have side effects are recorded separately
/// in SideEffectProtected — they are reported but never removed.
class DeadCodeAnalysisPass
    : public llvm::AnalysisInfoMixin<DeadCodeAnalysisPass> {
public:
    using Result = DeadCodeAnalysisResult;

    /// Run the analysis on a function.
    Result run(llvm::Function &F, llvm::FunctionAnalysisManager &FAM);

private:
    friend llvm::AnalysisInfoMixin<DeadCodeAnalysisPass>;
    static llvm::AnalysisKey Key;

    /// Check if an instruction is considered dead (removable).
    static bool isDeadInstruction(const llvm::Instruction &I);

    /// Check if an instruction has side effects that prevent removal.
    static bool hasSideEffects(const llvm::Instruction &I);
};

}  // namespace dce

#endif  // DEAD_CODE_ANALYSIS_H
