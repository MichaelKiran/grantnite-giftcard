#!/bin/bash

# Create a temp directory for dependencies
mkdir -p .temp_deps 2>/dev/null

# Install missing dependencies locally
cd .temp_deps
npm init -y >/dev/null 2>&1
npm install @alloc/quick-lru >/dev/null 2>&1
cd ..

# Set NODE_PATH to include our temp dependencies
export NODE_PATH=$(pwd)/.temp_deps/node_modules:$NODE_PATH

# Start Next.js
npx next dev 