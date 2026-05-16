//===----------------------------------------------------------------------===//
//  DeadCodeAnalysis.cpp — Dead Code Analysis Pass Implementation
//===----------------------------------------------------------------------===//

#include "DeadCodeAnalysis.h"
#include "llvm/IR/Instructions.h"
#include "llvm/IR/IntrinsicInst.h"
#include "llvm/Support/raw_ostream.h"

using namespace llvm;
namespace dce {

AnalysisKey DeadCodeAnalysisPass::Key;

void DeadCodeAnalysisResult::print(raw_ostream &OS) const {
    OS << "=== Dead Code Analysis: " << FunctionName << " ===\n";
    OS << "  Total: " << TotalInstructions
       << "  Dead: " << getDeadCount()
       << "  Protected: " << getProtectedCount() << "\n";
    for (const auto *I : DeadInstructions) {
        OS << "  [DEAD] "; I->print(OS); OS << "\n";
    }
    for (const auto *I : SideEffectProtected) {
        OS << "  [PROTECTED] "; I->print(OS); OS << "\n";
    }
}

bool DeadCodeAnalysisPass::hasSideEffects(const Instruction &I) {
    if (I.mayHaveSideEffects()) return true;
    if (isa<LandingPadInst>(I)) return true;
    if (isa<DbgInfoIntrinsic>(I)) return true;
    return false;
}

bool DeadCodeAnalysisPass::isDeadInstruction(const Instruction &I) {
    if (!I.use_empty()) return false;
    if (I.isTerminator()) return false;
    if (hasSideEffects(I)) return false;
    return true;
}

DeadCodeAnalysisResult
DeadCodeAnalysisPass::run(Function &F, FunctionAnalysisManager &FAM) {
    DeadCodeAnalysisResult Result;
    Result.FunctionName = F.getName().str();
    for (BasicBlock &BB : F) {
        for (Instruction &I : BB) {
            ++Result.TotalInstructions;
            if (I.use_empty() && !I.isTerminator()) {
                if (hasSideEffects(I))
                    Result.SideEffectProtected.push_back(&I);
                else
                    Result.DeadInstructions.push_back(&I);
            }
        }
    }
    Result.print(errs());
    return Result;
}

} // namespace dce
