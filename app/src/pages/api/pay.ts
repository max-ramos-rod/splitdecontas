/**
 * Solana Pay — Transaction Request endpoint
 *
 * GET  /api/pay?bill=<base58>&participant=<base58>
 *   → { label, icon } para o wallet exibir antes de confirmar
 *
 * POST /api/pay?bill=<base58>&participant=<base58>
 *   → recebe { account } do wallet, retorna { transaction } em base64
 */

import { NextApiRequest, NextApiResponse } from "next";
import * as anchor from "@anchor-lang/core";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import IDL from "../../idl/split.json";

const connection = new Connection(
  process.env.RPC_URL ?? clusterApiUrl("devnet"),
  "confirmed"
);

function parsePubkey(value: unknown, fieldName: string): PublicKey {
  if (typeof value !== "string" || !value) {
    throw new Error(`${fieldName} ausente ou inválido`);
  }
  try {
    return new PublicKey(value);
  } catch {
    throw new Error(`${fieldName} não é uma chave pública Solana válida`);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const billPDA = parsePubkey(req.query.bill, "bill");
    const participantPubkey = parsePubkey(req.query.participant, "participant");

    // ── GET: info para exibição no wallet ─────────────────────────────────
    if (req.method === "GET") {
      const appUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      return res.status(200).json({
        label: "SplitPay",
        icon: `${appUrl}/icon.png`,
        title: "SplitPay",
        description: "Pagar conta compartilhada",
      });
    }

    // ── POST: montar e retornar a transação ───────────────────────────────
    if (req.method === "POST") {
      const payer = parsePubkey(req.body?.account, "account");
      if (!payer.equals(participantPubkey)) {
        return res.status(403).json({ error: "Wallet conectada não confere com o participante" });
      }

      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey: payer, signTransaction: async (t) => t, signAllTransactions: async (ts) => ts },
        { commitment: "confirmed" }
      );

      const program = new anchor.Program(IDL as any, provider);
      const billAccount = await (program.account as any).billAccount.fetch(billPDA);

      // Valida que o payer está na lista de participantes
      const isParticipant = billAccount.participants.some(
        (p: any) => p.wallet.equals(participantPubkey)
      );
      if (!isParticipant) {
        return res.status(403).json({ error: "Wallet não está na lista de participantes" });
      }

      const payerATA = getAssociatedTokenAddressSync(billAccount.tokenMint, payer);

      const ix = await (program.methods as any)
        .payShare()
        .accounts({
          payer,
          bill: billPDA,
          payerTokenAccount: payerATA,
          vault: billAccount.vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer });
      tx.add(ix);

      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        transaction: serialized.toString("base64"),
        message: "Pay Split Bill",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(400).json({ error: message });
  }
}
