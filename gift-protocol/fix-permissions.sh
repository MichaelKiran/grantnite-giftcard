#!/bin/bash

echo "Fixing Solana and Rustup permissions..."

# Fix rustup directory ownership
sudo chown -R $(whoami) ~/.rustup
echo "✅ Fixed rustup directory ownership"

# Fix solana directory ownership
sudo chown -R $(whoami) ~/.local/share/solana
echo "✅ Fixed Solana directory ownership"

# Fix specific permission issue with the rust toolchain link
sudo chmod -R 755 ~/.local/share/solana/install/releases
echo "✅ Fixed Solana releases permissions"

# Check if the solana directory exists in rustup toolchains
if [ -L ~/.rustup/toolchains/solana ]; then
  sudo rm ~/.rustup/toolchains/solana
  echo "✅ Removed existing solana toolchain symlink"
fi

# Create the symlink manually
SOLANA_RELEASE_DIR=$(ls -d ~/.local/share/solana/install/releases/stable-* | head -n 1)
if [ -n "$SOLANA_RELEASE_DIR" ]; then
  ln -s "$SOLANA_RELEASE_DIR/solana-release/bin/sdk/sbf/dependencies/platform-tools/rust" ~/.rustup/toolchains/solana
  echo "✅ Created solana toolchain symlink"
else
  echo "❌ Could not find Solana release directory"
fi

echo "Done! Now try running 'anchor build' again." 