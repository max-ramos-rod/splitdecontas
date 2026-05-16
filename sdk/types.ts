import { PublicKey } from "@solana/web3.js";
import { BN } from "@anchor-lang/core";
import { createQR } from "@solana/pay";

export interface ParticipantStatus {
  wallet: PublicKey;
  paid: boolean;
}

export interface BillAccount {
  creator: PublicKey;
  creatorAta: PublicKey;
  tokenMint: PublicKey;
  vault: PublicKey;
  billId: number[];
  description: string;
  shareAmount: BN;
  totalAmount: BN;
  expiresAt: BN;
  createdAt: BN;
  settled: boolean;
  bump: number;
  participants: ParticipantStatus[];
}

export interface QREntry {
  participant: PublicKey;
  url: string;
  qr: ReturnType<typeof createQR>;
}