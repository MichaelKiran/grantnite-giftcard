const fs = require('fs');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');

// Load IDL
const idl = JSON.parse(fs.readFileSync('./target/idl/protocol.json', 'utf8'));

// Set program ID
const programId = new PublicKey('GiFtpLZbmQcu4LPYoFg2ZX5he7qeXXdXiNVzQ5Lm24R1');

// Set devnet connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// If you have a keypair file, load it (otherwise we'll use a new one for this demo)
let keypair;
try {
  const keypairData = JSON.parse(fs.readFileSync(
    process.env.HOME + '/.config/solana/id.json', 
    'utf8'
  ));
  keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
} catch (err) {
  console.log("Could not load keypair, generating a new one for this demo");
  keypair = Keypair.generate();
}

async function main() {
  try {
    // Create provider
    const wallet = new anchor.Wallet(keypair);
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
    
    // Create an instance of the program
    const program = new anchor.Program(idl, programId, provider);
    
    console.log('Connected to program:', programId.toString());
    
    // Initialize program accounts
    console.log('Creating protocol state account...');
    
    // Find the protocol state PDA
    const [protocolStatePDA, _] = await PublicKey.findProgramAddress(
      [Buffer.from('protocol_state')],
      programId
    );
    
    console.log('Protocol state PDA:', protocolStatePDA.toString());
    
    // At this point, we would normally initialize the program,
    // but since we can't build the program, we'll just share the IDL
    console.log('Ready to initialize program when deployed!');
    console.log('Deployment data:');
    console.log('- Program ID:', programId.toString());
    console.log('- Protocol State PDA:', protocolStatePDA.toString());
    console.log('- Treasury Address:', new PublicKey('GiFtTrEa5UryXbhY8CNpWZ9VBMi84NyNQsQP3KTuK1J9').toString());
    
    // For reference, this is how you would initialize the program:
    /*
    await program.methods
      .initialize(300, 100) // 3% commission, 1% referral
      .accounts({
        protocolState: protocolStatePDA,
        treasury: treasuryKeypair.publicKey,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([treasuryKeypair])
      .rpc();
    */
    
    console.log('\nDeployment info ready!');
    console.log('Once you have access to properly build the program, you can:');
    console.log('1. Build using: anchor build');
    console.log('2. Deploy using: anchor deploy --program-id GiFtpLZbmQcu4LPYoFg2ZX5he7qeXXdXiNVzQ5Lm24R1');
    console.log('3. Initialize using the script that calls the initialize method');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 