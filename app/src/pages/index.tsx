import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { ClientOnly } from "@/components/ClientOnly";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import * as anchor from "@anchor-lang/core";
import { PublicKey, Transaction } from "@solana/web3.js";
import { SplitSDK, BillAccount } from "@sdk";
import { QRDisplay } from "../components/QRDisplay";
import IDL from "../idl/split.json";

interface BillResult {
  billPDA: string;
  qrCodes: { participant: string; url: string }[];
}

function parsePubkeys(raw: string): PublicKey[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      try {
        return new PublicKey(s);
      } catch {
        throw new Error(`Endereço inválido: ${s}`);
      }
    });
}

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [description, setDescription] = useState("");
  const [shareAmount, setShareAmount] = useState("");
  const [participants, setParticipants] = useState("");
  const [expiresIn, setExpiresIn] = useState("60");

  const [result, setResult] = useState<BillResult | null>(null);
  const [billStatus, setBillStatus] = useState<BillAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSDK = useCallback((): SplitSDK => {
    if (!wallet.publicKey) throw new Error("Conecte sua wallet primeiro");
    const provider = new anchor.AnchorProvider(connection, wallet as any, {});
    const program = new anchor.Program(IDL as any, provider);
    return new SplitSDK(program, provider);
  }, [connection, wallet]);

  // Polling de status enquanto bill está ativa e não liquidada
  useEffect(() => {
    if (!result || billStatus?.settled) return;
    const id = setInterval(async () => {
      try {
        const sdk = getSDK();
        const bill = await sdk.fetchBill(new PublicKey(result.billPDA));
        setBillStatus(bill);
      } catch {
        // silencioso — polling best-effort
      }
    }, 5000);
    return () => clearInterval(id);
  }, [result, billStatus?.settled, getSDK]);

  const handleCreate = async () => {
    setError(null);
    try {
      setLoading(true);
      const sdk = getSDK();
      const participantList = parsePubkeys(participants);

      const { tx, billPDA, qrCodes } = await sdk.createBill({
        description,
        shareAmountUsdc: parseFloat(shareAmount),
        participants: participantList,
        expiresInMinutes: parseInt(expiresIn),
        apiBase: process.env.NEXT_PUBLIC_API_URL,
      });

      setResult({
        billPDA: billPDA.toBase58(),
        qrCodes: qrCodes.map((q) => ({
          participant: q.participant.toBase58(),
          url: q.url,
        })),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (solanaPayUrl: string) => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setError(null);
    try {
      setLoading(true);
      const httpsUrl = decodeURIComponent(solanaPayUrl.replace("solana:", ""));
      const res = await fetch(httpsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: wallet.publicKey.toBase58() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao buscar transação");
      }
      const { transaction: txBase64 } = await res.json();
      const tx = Transaction.from(Buffer.from(txBase64, "base64"));
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      const sdk = getSDK();
      setBillStatus(await sdk.fetchBill(new PublicKey(result!.billPDA)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!result || !billStatus) return;
    setError(null);
    try {
      setLoading(true);
      const sdk = getSDK();
      await sdk.settle({
        billPDA: new PublicKey(result.billPDA),
        creatorAddress: billStatus.creator,
        tokenMint: billStatus.tokenMint,
      });
      setBillStatus({ ...billStatus, settled: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const allPaid = billStatus?.participants.every((p) => p.paid) ?? false;
  const paidCount = billStatus?.participants.filter((p) => p.paid).length ?? 0;
  const total = billStatus?.participants.length ?? 0;

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: "1.5rem" }}>
        SplitPay — rachar contas no Solana
      </h1>

      <ClientOnly>
        <WalletMultiButton />
      </ClientOnly>

      {error && (
        <p style={{ color: "#c0392b", marginTop: "1rem", fontSize: 14 }}>{error}</p>
      )}

      {wallet.connected && !result && (
        <form
          style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
        >
          <label style={labelStyle}>
            Descrição
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jantar Veridiana 13/05"
              maxLength={64}
              required
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Valor por pessoa (USDC)
            <input
              type="number"
              value={shareAmount}
              onChange={(e) => setShareAmount(e.target.value)}
              placeholder="25.00"
              min="0.000001"
              step="0.01"
              required
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Endereços dos participantes (um por linha)
            <textarea
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              rows={4}
              placeholder={"ABC...xyz\nDEF...uvw"}
              required
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          <label style={labelStyle}>
            Expira em (minutos)
            <input
              type="number"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              min="1"
              style={{ ...inputStyle, width: 120 }}
            />
          </label>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Criando..." : "Criar conta compartilhada"}
          </button>
        </form>
      )}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#555", wordBreak: "break-all" }}>
            PDA: {result.billPDA}
          </p>

          {billStatus && (
            <div
              style={{
                margin: "1rem 0",
                padding: "0.75rem 1rem",
                background: allPaid ? "#eafaf1" : "#fef9e7",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <p style={{ margin: 0, fontWeight: 500 }}>
                {paidCount} / {total} pagaram
                {allPaid && " ✓ Todos pagaram!"}
                {billStatus.settled && " — Liquidado"}
              </p>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {billStatus.participants.map((p, i) => (
                  <li key={i} style={{ color: p.paid ? "#27ae60" : "#e67e22" }}>
                    {p.wallet.toBase58().slice(0, 8)}… — {p.paid ? "Pago" : "Pendente"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!billStatus?.settled && (
            <button
              onClick={handleSettle}
              disabled={loading || !allPaid}
              style={{ ...btnStyle, marginBottom: "1.5rem", opacity: allPaid ? 1 : 0.5 }}
            >
              {loading ? "Liquidando..." : "Liquidar (settle)"}
            </button>
          )}

          <h2 style={{ fontSize: 17, fontWeight: 500, marginBottom: "1rem" }}>
            QR codes para pagamento
          </h2>

          {result.qrCodes.map((qr, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                padding: "1rem",
                marginBottom: "1rem",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <QRDisplay url={qr.url} size={160} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontFamily: "monospace", margin: "0 0 0.5rem" }}>
                  {qr.participant.slice(0, 20)}…
                </p>
                <p style={{ fontSize: 11, color: "#888", margin: 0, wordBreak: "break-all" }}>
                  {qr.url}
                </p>
                {wallet.publicKey?.toBase58() === qr.participant && (
                  <button
                    onClick={() => handlePay(qr.url)}
                    disabled={loading}
                    style={{ ...btnStyle, marginTop: "0.75rem", background: "#27ae60" }}
                  >
                    {loading ? "Pagando..." : "Pagar minha parte"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 14,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  background: "#512da8",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};
