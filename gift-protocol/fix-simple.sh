#!/bin/bash

echo "Fixing Solana and Rustup directories with simpler approach..."

# Step 1: Take ownership of the directories
sudo chown -R $(whoami):$(id -gn) ~/.rustup
sudo chown -R $(whoami):$(id -gn) ~/.local/share/solana

# Step 2: Fix permissions
sudo chmod -R 755 ~/.rustup
sudo chmod -R 755 ~/.local/share/solana

echo "Permissions fixed. Try running 'anchor build' now." 