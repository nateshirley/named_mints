import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout } from "@solana/spl-token";
import { NamedMints } from "../target/types/named_mints";
interface Pda {
  address: PublicKey;
  bump: number;
}
describe("named_mints", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const anyAnchor: any = anchor;
  const program = anyAnchor.workspace.NamedMints as Program<NamedMints>;

  const clientMint = Keypair.generate();
  const programMint = Keypair.generate();
  const creator = provider.wallet;

  let namedMint: Pda;
  let namedMintAttribution: Pda;

  it("program init", async () => {
    let name = "test";
    namedMint = await findMint(name);
    namedMintAttribution = await findAttribution(namedMint.address);

    const tx = await program.rpc.createNewMint(
      namedMint.bump,
      namedMintAttribution.bump,
      name,
      0,
      creator.publicKey,
      creator.publicKey,
      {
        accounts: {
          creator: creator.publicKey,
          mint: namedMint.address,
          attribution: namedMintAttribution.address,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
      }
    );

    let newMint = await provider.connection.getAccountInfo(namedMint.address);
    //console.log(newMint);

    let newToken = new Token(
      provider.connection,
      namedMint.address,
      TOKEN_PROGRAM_ID,
      Keypair.generate()
    );
    let info = await newToken.getMintInfo();
    console.log(info);

    let newAttr = await program.account.attribution.fetch(
      namedMintAttribution.address
    );
    console.log(newAttr);
  });
});

const anyAnchor: any = anchor;
const NamedMints = anyAnchor.workspace.NamedMints as Program<NamedMints>;
const findMint = async (name: String) => {
  return PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode(name.toLowerCase())],
    NamedMints.programId
  ).then(([address, bump]) => {
    return {
      address: address,
      bump: bump,
    };
  });
};
const findAttribution = async (mint: PublicKey) => {
  let [address, bump] = await PublicKey.findProgramAddress(
    [mint.toBuffer()],
    NamedMints.programId
  );
  return {
    address: address,
    bump: bump,
  };
};
const getFreezeAuth = async (): Promise<Pda> => {
  let [address, bump] = await PublicKey.findProgramAddress(
    [anchor.utils.bytes.utf8.encode("freeze")],
    NamedMints.programId
  );
  return {
    address: address,
    bump: bump,
  };
};

/*
it("vanilla init", async () => {
    // Add your test here.
    console.log(MintLayout.span);
    const tx = await program.rpc.initialize({
      accounts: {},
      instructions: [
        SystemProgram.createAccount({
          fromPubkey: creator.publicKey,
          newAccountPubkey: clientMint.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
          ),
          programId: TOKEN_PROGRAM_ID,
        }),
        //init subscription mint account
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          clientMint.publicKey,
          0,
          creator.publicKey,
          creator.publicKey
        ),
      ],
      signers: [clientMint],
    });
    console.log("Your transaction signature", tx);

    let newMint = await provider.connection.getAccountInfo(
      clientMint.publicKey
    );
    console.log(newMint);
  });
*/
