import { AnchorProvider, BN, Program } from "@anchor-lang/core";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { createQR } from "@solana/pay";
import { findBillPDA, findVaultAddress } from "./pda";
import { BillAccount, QREntry } from "./types";
import { USDC_MINT_DEVNET } from "./constants";
import { randomBytes } from "crypto";
import { Split } from "../target/types/split";

export class SplitSDK {
  constructor(
    private program: Program<Split>,
    private provider: AnchorProvider
  ) {}

  async createBill(params: {
    description: string;
    shareAmountUsdc: number;
    participants: PublicKey[];
    expiresInMinutes?: number;
    tokenMint?: PublicKey;
    apiBase?: string;
  }) {
    if (params.description.length > 64) throw new Error("Descrição máx 64 chars");
    if (params.participants.length < 2) throw new Error("Mínimo 2 participantes");
    if (params.participants.length > 8) throw new Error("Máximo 8 participantes");
    if (params.shareAmountUsdc <= 0) throw new Error("Valor inválido");

    const creator = this.provider.wallet.publicKey;
    const tokenMint = params.tokenMint ?? USDC_MINT_DEVNET;

    // bill_id: 8 bytes aleatórios — seed única sem limite de tamanho
    const billId = Uint8Array.from(randomBytes(8));

    const shareAmount = Math.round(params.shareAmountUsdc * 1_000_000);
    const expiresAt = Math.floor(Date.now() / 1000) + (params.expiresInMinutes ?? 60) * 60;

    const [billPDA] = findBillPDA(creator, billId);
    const vaultAddress = findVaultAddress(billPDA, tokenMint);
    const creatorATA = getAssociatedTokenAddressSync(tokenMint, creator);

    const tx = await (this.program.methods as any)
      .createBill(
        Array.from(billId),
        params.description,
        new BN(shareAmount),
        params.participants,
        new BN(expiresAt)
      )
      .accounts({
        creator,
        bill: billPDA,
        vault: vaultAddress,
        tokenMint,
        creatorTokenAccount: creatorATA,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const apiBase = params.apiBase ?? "http://localhost:3000";

    const qrCodes: QREntry[] = params.participants.map((participant) => {
      const url = new URL(`${apiBase}/api/pay`);
      url.searchParams.set("bill", billPDA.toBase58());
      url.searchParams.set("participant", participant.toBase58());
      const solanaPayUrl = `solana:${encodeURIComponent(url.toString())}`;
      return { participant, url: solanaPayUrl, qr: createQR(solanaPayUrl, 256, "white") };
    });

    return { tx, billPDA, billId, vaultAddress, qrCodes };
  }

  async fetchBill(billPDA: PublicKey): Promise<BillAccount> {
    const accounts = this.program.account as unknown as {
      billAccount: { fetch: (pda: PublicKey) => Promise<BillAccount> };
    };
    return accounts.billAccount.fetch(billPDA);
  }

  async listCreatorBills(creator: PublicKey) {
    const accounts = this.program.account as unknown as {
      billAccount: { all: (filters: unknown[]) => Promise<unknown[]> };
    };
    return accounts.billAccount.all([
      { memcmp: { offset: 8, bytes: creator.toBase58() } },
    ]);
  }

  async settle(params: { billPDA: PublicKey; creatorAddress: PublicKey; tokenMint: PublicKey }) {
    const caller = this.provider.wallet.publicKey;
    const creatorATA = getAssociatedTokenAddressSync(params.tokenMint, params.creatorAddress);
    const vaultAddress = findVaultAddress(params.billPDA, params.tokenMint);

    return (this.program.methods as any)
      .settle()
      .accounts({
        caller,
        bill: params.billPDA,
        creator: params.creatorAddress,
        vault: vaultAddress,
        creatorTokenAccount: creatorATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
  }
}
