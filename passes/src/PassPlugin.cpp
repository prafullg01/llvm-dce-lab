//===----------------------------------------------------------------------===//
//  PassPlugin.cpp — Registration for LLVM New Pass Manager
//===----------------------------------------------------------------------===//

#include "DeadCodeAnalysis.h"
#include "DeadCodeTransform.h"
#include "llvm/Passes/PassBuilder.h"
#include "llvm/Passes/PassPlugin.h"

using namespace llvm;

extern "C" LLVM_ATTRIBUTE_WEAK ::llvm::PassPluginLibraryInfo
llvmGetPassPluginInfo() {
    return {
        LLVM_PLUGIN_API_VERSION, "DeadCodeElimination", LLVM_VERSION_STRING,
        [](PassBuilder &PB) {
            // Register the analysis pass
            PB.registerAnalysisRegistrationCallback(
                [](FunctionAnalysisManager &FAM) {
                    FAM.registerPass([&] {
                        return dce::DeadCodeAnalysisPass();
                    });
                });
            // Register the transform pass
            PB.registerPipelineParsingCallback(
                [](StringRef Name, FunctionPassManager &FPM,
                   ArrayRef<PassBuilder::PipelineElement>) {
                    if (Name == "dead-code-transform") {
                        FPM.addPass(dce::DeadCodeTransformPass());
                        return true;
                    }
                    return false;
                });
        }};
}
