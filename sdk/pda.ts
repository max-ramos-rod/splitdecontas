import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Buffer } from "buffer";
import { PROGRAM_ID } from "./constants";

export function findBillPDA(
  creator: PublicKey,
  billId: Uint8Array
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("bill"),
      creator.toBuffer(),
      Buffer.from(billId),
    ],
    PROGRAM_ID
  );
}

export function findVaultAddress(
  billPDA: PublicKey,
  tokenMint: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(
    tokenMint,
    billPDA,
    true
  );
}