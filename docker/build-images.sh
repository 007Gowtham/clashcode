#!/bin/bash
# Builds all clashcode language runner images
set -e

echo "Building Java 21 runner image..."
docker build -t clashcode/java:runner -f docker/java/Dockerfile docker/java

echo "Building Python 3.12 runner image..."
docker build -t clashcode/python:runner -f docker/python/Dockerfile docker/python

echo "Building GCC C++ runner image..."
docker build -t clashcode/cpp:runner -f docker/cpp/Dockerfile docker/cpp

echo "Building Node.js LTS runner image..."
docker build -t clashcode/javascript:runner -f docker/javascript/Dockerfile docker/javascript

echo "All ClashCode runner images built successfully!"

