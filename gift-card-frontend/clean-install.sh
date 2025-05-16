#!/bin/bash

# Stop any running processes on port 3000
echo "Stopping any processes running on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Stop any running processes on port 3001
echo "Stopping any processes running on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Remove build artifacts and dependencies
echo "Removing build artifacts and dependencies..."
rm -rf .next node_modules package-lock.json

# Reinstall dependencies with force flag
echo "Reinstalling dependencies..."
npm install --force

# Run the development server
echo "Starting the development server..."
npm run dev 