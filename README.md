# SplitPay

On-chain shared payments powered by Solana Pay and Anchor.

SplitPay allows groups to create shared bills where each participant pays individually using QR codes and Solana Pay Transaction Requests.

Unlike traditional transfer requests, SplitPay updates payment state directly on-chain, enabling trustless coordination between participants.

---

## Features

- Shared bill creation
- Individual QR codes per participant
- Solana Pay Transaction Requests
- PDA vault escrow
- Real-time participant payment tracking
- Mobile wallet support
- Devnet USDC support
- Anchor smart contract
- Live payment status updates

---

## Why Transaction Requests?

Traditional Solana Pay transfer requests only move tokens between wallets.

SplitPay uses Transaction Requests to execute custom Anchor program instructions, allowing the protocol to:

- validate participants
- prevent double payments
- update participant state on-chain
- enforce expiration rules
- coordinate settlement trustlessly

This transforms the application from a simple transfer flow into a real decentralized payment coordination protocol.

---

## Architecture

```text
User
 ↓
QR Scan (Phantom / Solflare)
 ↓
Solana Pay Transaction Request
 ↓
Next.js API (/api/pay)
 ↓
Anchor Program
 ↓
PDA Bill Account
 ↓
Vault ATA (USDC)
```

---

## Smart Contract

The Anchor program includes:

- `create_bill`
- `pay_share`
- `settle`
- `refund_one`

Core protocol features:

- PDA bill accounts
- PDA-owned vault ATA
- participant payment tracking
- expiration guards
- SPL token transfers
- event emission
- settlement validation

---

## Tech Stack

### Frontend

- Next.js 14
- React
- Solana Wallet Adapter
- Solana Pay

### Smart Contract

- Anchor 1.0.2
- Rust
- SPL Token Program

### Blockchain

- Solana Devnet
- Devnet USDC

---

## Demo Flow

1. Create a shared bill
2. Generate participant QR codes
3. Scan QR using Phantom mobile
4. Pay USDC on devnet
5. Watch participant status update live
6. Settle the bill
7. Verify transactions on Solana Explorer

---

## Devnet USDC Mint

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

---

## Program ID

```text
33Vu3HsczEWrrnmmWoXX1gFvaHTp5RUs228cFERJFvTY
```

---

## Security Considerations

- on-chain participant validation
- double payment prevention
- expiration validation
- PDA-controlled vault
- wallet ownership verification
- trustless settlement flow

---

## Local Setup

See:

```text
README_SETUP.md
```

---

## License

MIT