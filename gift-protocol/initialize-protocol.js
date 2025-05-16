const fs = require('fs');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');

// Load IDL
const idl = JSON.parse(fs.readFileSync('./target/idl/protocol.json', 'utf8'));

// Set program ID
const programId = new PublicKey('6r236i5BgwfWHnuqBxTtBuwyd8n7gWoYEP5PfbTNm5mr');

// Protocol parameters
const COMMISSION_RATE = 300; // 3% in basis points
const REFERRAL_RATE = 100;   // 1% in basis points

// Set devnet connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// If you have a keypair file, load it
let keypair;
try {
  const keypairData = JSON.parse(fs.readFileSync(
    process.env.HOME + '/.config/solana/id.json', 
    'utf8'
  ));
  keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
} catch (err) {
  console.error("Could not load keypair. Make sure you have a Solana keypair at ~/.config/solana/id.json");
  process.exit(1);
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
    
    // Find the protocol state PDA
    const [protocolStatePDA, _] = await PublicKey.findProgramAddress(
      [Buffer.from('protocol_state')],
      programId
    );
    
    console.log('Protocol state PDA:', protocolStatePDA.toString());
    
    // Create a new keypair for the treasury account
    const treasuryKeypair = Keypair.generate();
    console.log('Generated treasury keypair:', treasuryKeypair.publicKey.toString());
    
    // Initialize the protocol
    console.log(`Initializing protocol with commission rate: ${COMMISSION_RATE/100}%, referral rate: ${REFERRAL_RATE/100}%`);
    
    try {
      const tx = await program.methods
        .initialize(COMMISSION_RATE, REFERRAL_RATE)
        .accounts({
          protocolState: protocolStatePDA,
          treasury: treasuryKeypair.publicKey,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([treasuryKeypair])
        .rpc();
      
      console.log('Initialization successful!');
      console.log('Transaction signature:', tx);
      console.log('Protocol State:', protocolStatePDA.toString());
      console.log('Treasury Address:', treasuryKeypair.publicKey.toString());
      
      // Save the treasury keypair to a file for safekeeping
      fs.writeFileSync(
        './treasury-keypair.json', 
        JSON.stringify(Array.from(treasuryKeypair.secretKey))
      );
      console.log('Treasury keypair saved to treasury-keypair.json');
      
    } catch (err) {
      console.error('Error initializing protocol:', err);
      console.log('The program may not be deployed yet or there might be other issues.');
      console.log('Make sure the program is properly deployed.');
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

main(); 