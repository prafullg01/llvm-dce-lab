//===----------------------------------------------------------------------===//
//
//  DeadCodeTransform.h — LLVM Transformation Pass for Dead Code Elimination
//
//  Consumes the results from DeadCodeAnalysisPass and safely removes all
//  dead instructions. Uses a fixpoint loop to catch cascading dead code
//  (removing one dead instruction may make its operands dead too).
//
//===----------------------------------------------------------------------===//

#ifndef DEAD_CODE_TRANSFORM_H
#define DEAD_CODE_TRANSFORM_H

#include "llvm/IR/PassManager.h"
#include "llvm/IR/Function.h"

namespace dce {

/// Transformation pass that removes dead instructions from a function.
///
/// This pass:
///   1. Retrieves the DeadCodeAnalysisResult from the analysis manager
///   2. Iterates the dead instruction list in REVERSE order to avoid
///      iterator invalidation
///   3. For each dead instruction:
///      a. Replaces all uses with UndefValue (safety net for edge cases)
///      b. Erases the instruction from its parent BasicBlock
///   4. Repeats the analysis+removal loop until no more dead instructions
///      are found (fixpoint convergence)
///
/// The pass returns PreservedAnalyses::none() if any instructions were
/// removed, or PreservedAnalyses::all() if the function was already clean.
class DeadCodeTransformPass
    : public llvm::PassInfoMixin<DeadCodeTransformPass> {
public:
    /// Run the transformation on a function.
    llvm::PreservedAnalyses run(llvm::Function &F,
                                 llvm::FunctionAnalysisManager &FAM);

private:
    /// Perform one round of dead instruction removal.
    /// Returns the number of instructions removed.
    unsigned removeDeadInstructions(llvm::Function &F,
                                    llvm::FunctionAnalysisManager &FAM);
};

}  // namespace dce

#endif  // DEAD_CODE_TRANSFORM_H
