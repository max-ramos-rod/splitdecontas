import * as anchor from "@anchor-lang/core";
import { BN, Program } from "@anchor-lang/core";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";
import { Split } from "../target/types/split";

describe("split", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Split as Program<Split>;

  const creator = (provider.wallet as anchor.Wallet).payer;
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const SHARE = 5_000_000; // 5 USDC

  let mint: PublicKey;
  let creatorATA: PublicKey;
  let aliceATA: PublicKey;
  let bobATA: PublicKey;
  let billPDA: PublicKey;
  let vault: PublicKey;
  let billId: number[];

  before(async () => {
    for (const kp of [creator, alice, bob]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL)
      );
    }

    mint = await createMint(provider.connection, creator, creator.publicKey, null, 6);
    creatorATA = await createAccount(provider.connection, creator, mint, creator.publicKey);
    aliceATA = await createAccount(provider.connection, creator, mint, alice.publicKey);
    bobATA = await createAccount(provider.connection, creator, mint, bob.publicKey);

    await mintTo(provider.connection, creator, mint, aliceATA, creator, 50_000_000);
    await mintTo(provider.connection, creator, mint, bobATA, creator, 50_000_000);
  });

  it("create_bill: cria BillAccount com participantes corretos", async () => {
    const rawId = new Uint8Array(8);
    crypto.getRandomValues(rawId);
    billId = Array.from(rawId);

    [billPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("bill"), creator.publicKey.toBuffer(), Buffer.from(rawId)],
      program.programId
    );

    vault = getAssociatedTokenAddressSync(mint, billPDA, true);

    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    await program.methods
      .createBill(
        billId,
        "Jantar teste",
        new BN(SHARE),
        [alice.publicKey, bob.publicKey],
        new BN(expiresAt)
      )
      .accounts({
        creator: creator.publicKey,
        bill: billPDA,
        vault,
        tokenMint: mint,
        creatorTokenAccount: creatorATA,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const bill = await program.account.billAccount.fetch(billPDA);
    assert.equal(bill.shareAmount.toNumber(), SHARE);
    assert.equal(bill.totalAmount.toNumber(), SHARE * 2);
    assert.equal(bill.participants.length, 2);
    assert.isFalse(bill.settled);
    assert.isTrue(bill.vault.equals(vault));
  });

  it("pay_share: Alice paga, vault recebe SHARE", async () => {
    await program.methods.payShare()
      .accounts({
        payer: alice.publicKey,
        bill: billPDA,
        payerTokenAccount: aliceATA,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([alice])
      .rpc();

    const bill = await program.account.billAccount.fetch(billPDA);
    const alicePart = bill.participants.find((p: any) => p.wallet.equals(alice.publicKey));
    assert.isTrue(alicePart!.paid);

    const vaultInfo = await getAccount(provider.connection, vault);
    assert.equal(Number(vaultInfo.amount), SHARE);
  });

  it("pay_share: rejeita vault forjado", async () => {
    try {
      await program.methods.payShare()
        .accounts({
          payer: alice.publicKey,
          bill: billPDA,
          payerTokenAccount: aliceATA,
          vault: creatorATA,          // token account válida, mas não é o vault do bill
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();
      assert.fail("Deveria rejeitar vault inválido");
    } catch (e: any) {
      assert.equal(e.error?.errorCode?.code, "InvalidVault");
    }
  });

  it("pay_share: rejeita wallet fora da lista", async () => {
    const outsider = Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(outsider.publicKey, LAMPORTS_PER_SOL)
    );
    const outsiderATA = await createAccount(provider.connection, creator, mint, outsider.publicKey);
    await mintTo(provider.connection, creator, mint, outsiderATA, creator, 10_000_000);

    try {
      await program.methods.payShare()
        .accounts({ payer: outsider.publicKey, bill: billPDA,
          payerTokenAccount: outsiderATA, vault, tokenProgram: TOKEN_PROGRAM_ID })
        .signers([outsider]).rpc();
      assert.fail("Deveria rejeitar NotAParticipant");
    } catch (e: any) {
      assert.equal(e.error?.errorCode?.code, "NotAParticipant");
    }
  });

  it("settle: após todos pagarem, criador recebe total", async () => {
    await program.methods.payShare()
      .accounts({ payer: bob.publicKey, bill: billPDA,
        payerTokenAccount: bobATA, vault, tokenProgram: TOKEN_PROGRAM_ID })
      .signers([bob]).rpc();

    const before = (await getAccount(provider.connection, creatorATA)).amount;

    await program.methods.settle()
      .accounts({
        caller: creator.publicKey,
        bill: billPDA,
        creator: creator.publicKey,
        vault,
        creatorTokenAccount: creatorATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      }).rpc();

    const after = (await getAccount(provider.connection, creatorATA)).amount;
    assert.equal(Number(after - before), SHARE * 2);
  });

  async function createFreshBill(): Promise<{ billPDA: PublicKey; vault: PublicKey }> {
    const rawId = new Uint8Array(8);
    crypto.getRandomValues(rawId);
    const id = Array.from(rawId);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bill"), creator.publicKey.toBuffer(), Buffer.from(rawId)],
      program.programId
    );
    const v = getAssociatedTokenAddressSync(mint, pda, true);
    await program.methods
      .createBill(id, "test", new BN(SHARE), [alice.publicKey, bob.publicKey], new BN(Math.floor(Date.now() / 1000) + 3600))
      .accounts({
        creator: creator.publicKey, bill: pda, vault: v, tokenMint: mint,
        creatorTokenAccount: creatorATA, systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      }).rpc();
    return { billPDA: pda, vault: v };
  }

  describe("create_bill: validações de entrada", () => {
    async function tryCreate(overrides: { participants?: PublicKey[]; share?: number; expiresAt?: number }) {
      const rawId = new Uint8Array(8);
      crypto.getRandomValues(rawId);
      const id = Array.from(rawId);
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bill"), creator.publicKey.toBuffer(), Buffer.from(rawId)],
        program.programId
      );
      const v = getAssociatedTokenAddressSync(mint, pda, true);
      return program.methods
        .createBill(
          id, "test",
          new BN(overrides.share ?? SHARE),
          overrides.participants ?? [alice.publicKey, bob.publicKey],
          new BN(overrides.expiresAt ?? Math.floor(Date.now() / 1000) + 3600)
        )
        .accounts({
          creator: creator.publicKey, bill: pda, vault: v, tokenMint: mint,
          creatorTokenAccount: creatorATA, systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID, associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        }).rpc();
    }

    it("rejeita 1 participante → TooFewParticipants", async () => {
      try {
        await tryCreate({ participants: [alice.publicKey] });
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "TooFewParticipants");
      }
    });

    it("rejeita share_amount = 0 → InvalidAmount", async () => {
      try {
        await tryCreate({ share: 0 });
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "InvalidAmount");
      }
    });

    it("rejeita expires_at no passado → InvalidExpiry", async () => {
      try {
        await tryCreate({ expiresAt: Math.floor(Date.now() / 1000) - 60 });
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "InvalidExpiry");
      }
    });
  });

  describe("pay_share: duplo pagamento", () => {
    let b: PublicKey;
    let v: PublicKey;

    before(async () => {
      ({ billPDA: b, vault: v } = await createFreshBill());
      await program.methods.payShare()
        .accounts({ payer: alice.publicKey, bill: b, payerTokenAccount: aliceATA, vault: v, tokenProgram: TOKEN_PROGRAM_ID })
        .signers([alice]).rpc();
    });

    it("Alice tenta pagar de novo → AlreadyPaid", async () => {
      try {
        await program.methods.payShare()
          .accounts({ payer: alice.publicKey, bill: b, payerTokenAccount: aliceATA, vault: v, tokenProgram: TOKEN_PROGRAM_ID })
          .signers([alice]).rpc();
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "AlreadyPaid");
      }
    });
  });

  describe("settle: rejeita pagamento parcial", () => {
    let b: PublicKey;
    let v: PublicKey;

    before(async () => {
      ({ billPDA: b, vault: v } = await createFreshBill());
      await program.methods.payShare()
        .accounts({ payer: alice.publicKey, bill: b, payerTokenAccount: aliceATA, vault: v, tokenProgram: TOKEN_PROGRAM_ID })
        .signers([alice]).rpc();
    });

    it("settle falha quando nem todos pagaram → NotAllPaid", async () => {
      try {
        await program.methods.settle()
          .accounts({
            caller: creator.publicKey, bill: b, creator: creator.publicKey,
            vault: v, creatorTokenAccount: creatorATA, tokenProgram: TOKEN_PROGRAM_ID,
          }).rpc();
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "NotAllPaid");
      }
    });
  });

  describe("refund_one", () => {
    let b: PublicKey;
    let v: PublicKey;

    before(async () => {
      ({ billPDA: b, vault: v } = await createFreshBill());
      await program.methods.payShare()
        .accounts({ payer: alice.publicKey, bill: b, payerTokenAccount: aliceATA, vault: v, tokenProgram: TOKEN_PROGRAM_ID })
        .signers([alice]).rpc();
    });

    it("criador reembolsa Alice com sucesso", async () => {
      const before = (await getAccount(provider.connection, aliceATA)).amount;
      await program.methods.refundOne()
        .accounts({
          caller: creator.publicKey, bill: b, vault: v,
          refundTokenAccount: aliceATA, tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc();
      const after = (await getAccount(provider.connection, aliceATA)).amount;
      assert.equal(Number(after - before), SHARE);
      const bill = await program.account.billAccount.fetch(b);
      const alicePart = bill.participants.find((p: any) => p.wallet.equals(alice.publicKey));
      assert.isFalse(alicePart!.paid);
    });

    it("reembolso duplo falha → NothingToRefund", async () => {
      try {
        await program.methods.refundOne()
          .accounts({
            caller: creator.publicKey, bill: b, vault: v,
            refundTokenAccount: aliceATA, tokenProgram: TOKEN_PROGRAM_ID,
          }).rpc();
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "NothingToRefund");
      }
    });

    it("reembolso de Bob (nunca pagou) falha → NothingToRefund", async () => {
      try {
        await program.methods.refundOne()
          .accounts({
            caller: creator.publicKey, bill: b, vault: v,
            refundTokenAccount: bobATA, tokenProgram: TOKEN_PROGRAM_ID,
          }).rpc();
        assert.fail("Deveria rejeitar");
      } catch (e: any) {
        assert.equal(e.error?.errorCode?.code, "NothingToRefund");
      }
    });
  });
});
