#!/bin/bash
set -e

# Full deployment script for the Gift Card Protocol

# 1. Install dependencies (if needed)
echo "Step 1: Setting up dependencies..."
npm install @solana/web3.js @project-serum/anchor

# 2. Build the program 
echo "Step 2: Building Anchor program..."
echo "NOTE: This step may fail due to permission issues. If it does, you can:"
echo "  - Fix permissions with: sudo chmod -R 755 ~/.local/share/solana/install/releases"
echo "  - Use a docker container for Anchor development"
echo "  - Run on another machine with full permissions"

# Attempt to build - if this fails, we'll continue with the deployment info
anchor build || echo "Build failed, but we'll continue with the deployment info"

# 3. Deploy Program
echo "Step 3: Deploying to devnet..."
echo "NOTE: This requires a funded devnet wallet and proper permissions."
echo "If you have issues, try:"
echo "  - solana config set --url devnet"
echo "  - solana airdrop 2  # Get some devnet SOL"
echo "Command to run when ready: anchor deploy --program-id GiFtpLZbmQcu4LPYoFg2ZX5he7qeXXdXiNVzQ5Lm24R1"

# 4. Get Protocol Info
echo "Step 4: Getting protocol state info..."
node deploy-idl.js

# 5. Instructions for initialization
echo "Step 5: Initialize the protocol"
echo "After successful deployment, run: node initialize-protocol.js"

echo "===================================================================="
echo "IMPORTANT: The full deployment requires the Anchor program to be built"
echo "and deployed first. Due to permission issues on your system, we've"
echo "provided all the necessary files and scripts to complete this process"
echo "when you have access to an environment with proper permissions."
echo ""
echo "For now, your frontend will work with simulated data, and will"
echo "automatically switch to real data once the protocol is deployed."
echo "====================================================================" 