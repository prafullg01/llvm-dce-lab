cmake_minimum_required(VERSION 3.20)
project(DeadCodeElimination)

find_package(LLVM REQUIRED CONFIG)
message(STATUS "Found LLVM ${LLVM_PACKAGE_VERSION}")

list(APPEND CMAKE_MODULE_PATH "${LLVM_CMAKE_DIR}")
include(AddLLVM)

add_definitions(${LLVM_DEFINITIONS})
include_directories(${LLVM_INCLUDE_DIRS} ${CMAKE_CURRENT_SOURCE_DIR}/include)

add_llvm_library(DeadCodeElimination MODULE
    src/DeadCodeAnalysis.cpp
    src/DeadCodeTransform.cpp
    src/PassPlugin.cpp
    PLUGIN_TOOL opt
)

target_compile_features(DeadCodeElimination PRIVATE cxx_std_17)
