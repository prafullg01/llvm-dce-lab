//===----------------------------------------------------------------------===//
//  DeadCodeTransform.cpp — Dead Code Elimination Transform Pass
//===----------------------------------------------------------------------===//

#include "DeadCodeTransform.h"
#include "DeadCodeAnalysis.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/Constants.h"
#include "llvm/Support/raw_ostream.h"

using namespace llvm;
namespace dce {

unsigned DeadCodeTransformPass::removeDeadInstructions(
    Function &F, FunctionAnalysisManager &FAM) {
    unsigned Removed = 0;
    // Collect dead instructions first, then remove (avoid iterator invalidation)
    SmallVector<Instruction*, 32> Worklist;
    for (BasicBlock &BB : F) {
        for (Instruction &I : BB) {
            if (I.use_empty() && !I.isTerminator() && !I.mayHaveSideEffects()
                && !isa<LandingPadInst>(I) && !isa<DbgInfoIntrinsic>(I)) {
                Worklist.push_back(&I);
            }
        }
    }
    // Remove in reverse order for safety
    for (auto It = Worklist.rbegin(); It != Worklist.rend(); ++It) {
        Instruction *I = *It;
        I->replaceAllUsesWith(UndefValue::get(I->getType()));
        I->eraseFromParent();
        ++Removed;
    }
    return Removed;
}

PreservedAnalyses
DeadCodeTransformPass::run(Function &F, FunctionAnalysisManager &FAM) {
    unsigned TotalRemoved = 0;
    // Fixpoint loop — removing instructions may expose new dead code
    while (true) {
        unsigned Removed = removeDeadInstructions(F, FAM);
        if (Removed == 0) break;
        TotalRemoved += Removed;
    }
    errs() << "[DCE Transform] " << F.getName()
           << ": removed " << TotalRemoved << " dead instructions\n";
    return TotalRemoved > 0 ? PreservedAnalyses::none()
                            : PreservedAnalyses::all();
}

} // namespace dce
