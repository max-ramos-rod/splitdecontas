# SplitPay — Local Setup Guide

This document explains how to configure and run the project locally.

---

# Requirements

Recommended versions:

- Node.js 20+
- Rust stable
- Solana CLI 2.x
- Anchor CLI 1.0.2
- Phantom Wallet

---

# Install Rust

```bash
curl https://sh.rustup.rs -sSf | sh
```

Verify installation:

```bash
rustc --version
cargo --version
```

---

# Install Solana CLI

Linux/macOS:

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

Verify:

```bash
solana --version
```

---

# Configure Devnet

```bash
solana config set --url devnet
```

Verify:

```bash
solana config get
```

---

# Install AVM

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

---

# Install Anchor CLI

```bash
avm install 1.0.2
avm use 1.0.2
```

Verify:

```bash
anchor --version
```

---

# Clone Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd splitpay-app
```

---

# Install Frontend Dependencies

```bash
npm install
```

---

# Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Configure `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

# Build Anchor Program

Inside the Anchor project:

```bash
anchor build
```

IDL will be generated at:

```text
target/idl/split.json
```

---

# Deploy Program

```bash
anchor deploy --provider.cluster devnet
```

---

# Update Program ID

After deployment, update the Program ID in:

## `lib.rs`

```rust
declare_id!("YOUR_PROGRAM_ID");
```

## `sdk.ts`

```ts
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");
```

---

# Start Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Devnet Funds

Request SOL:

```bash
solana airdrop 2
```

---

# Devnet USDC

Mint address:

```text
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

You can obtain Devnet USDC using faucet services or transfers between wallets.

---

# Recommended Wallets

- Phantom
- Solflare

Mobile wallets are recommended for QR testing.

---

# Useful Commands

## Clean Build

```bash
anchor clean
```

## Rebuild

```bash
anchor build
```

## Run Tests

```bash
anchor test
```

## Local Validator

```bash
solana-test-validator
```

---

# Common Issues

## Blockhash expired

Retry the transaction.

---

## Wallet connection issues

Disconnect and reconnect the wallet.

---

## Anchor version mismatch

Verify:

```bash
anchor --version
npm list @anchor-lang/core
```

Ensure compatible versions are installed.

---

## IDL mismatch

Rebuild the program:

```bash
anchor build
```

Then copy the updated IDL to the frontend.

---

# Production Notes

This project currently targets:

- Solana Devnet
- demo environments
- hackathon usage

Additional auditing and security hardening are recommended before mainnet deployment.