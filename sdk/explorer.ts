export function explorerTx(sig: string) {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

export function explorerAccount(pubkey: string) {
  return `https://explorer.solana.com/address/${pubkey}?cluster=devnet`;
}