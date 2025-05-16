#!/bin/bash

# Script to remove console.log, console.error, and console.warn statements from TypeScript files
# This is a preparation step for production deployment

echo "Removing console statements from TypeScript files..."

# Find all TypeScript files with console statements
FILES=$(find app -type f \( -name "*.tsx" -o -name "*.ts" \) | xargs grep -l 'console\.')

# Count files to process
COUNT=$(echo "$FILES" | wc -l)
echo "Found $COUNT files with console statements"

# Process each file
for file in $FILES; do
  echo "Processing $file"
  
  # Create a backup (optional)
  # cp "$file" "${file}.bak"
  
  # Remove console statements using sed
  # This matches console.log, console.error, console.warn with various formatting
  sed -i '' -E 's/console\.(log|error|warn)\(.*\);?//g' "$file"
  
  # Clean up any blank lines created (optional)
  sed -i '' '/^\s*$/d' "$file"
done

echo "Finished removing console statements" 