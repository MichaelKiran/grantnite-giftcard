#!/bin/bash
set -e

# Build the program
echo "Building program..."
cargo build-sbf --manifest-path=programs/protocol/Cargo.toml

# Generate IDL
echo "Generating IDL..."
mkdir -p target/idl
cat target/types/protocol.ts | sed -n '/export type protocol = {/,$p' > temp_idl.ts

# Convert TypeScript IDL to JSON
echo "Converting TypeScript IDL to JSON..."
node -e "
const fs = require('fs');
const ts = fs.readFileSync('temp_idl.ts', 'utf8');
const json = JSON.stringify(eval('(' + ts.replace('export type protocol =', '') + ')'), null, 2);
fs.writeFileSync('target/idl/protocol.json', json);
fs.unlinkSync('temp_idl.ts');
"

echo "Build completed successfully!" 