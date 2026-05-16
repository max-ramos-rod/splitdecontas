# SplitDeContas Monorepo

## Overview

SplitDeContas is a Solana-based shared payment settlement protocol built with:
- Anchor
- Solana Pay
- SPL Token (USDC)
- Next.js
- TypeScript

The system allows users to:
- create shared bills
- assign participants
- collect USDC payments individually
- settle funds trustlessly on-chain

The Solana blockchain is the source of truth for all financial state.

---

# Monorepo Structure

```txt
SplitDeContas/
├── programs/       # Anchor smart contracts
├── app/            # Next.js frontend
├── sdk/            # Shared TypeScript SDK
├── scripts/        # Dev and operational scripts
├── tests/          # Anchor and integration tests
├── target/         # Anchor build artifacts
└── idl/            # Generated IDLs
```

---

# Architecture Principles

## Source of Truth

All financial state must live on-chain.

Examples:
- participant payment status
- settlement state
- vault balances
- creator ownership
- expiration rules

Frontend and backend must NEVER become the source of truth for balances or settlement status.

---

## Backend Responsibilities

Off-chain services are UX and indexing layers only.

Backend responsibilities:
- notifications
- payment links
- analytics
- indexing
- caching
- user experience improvements

Backend must NEVER:
- mark payments as completed
- control settlement rules
- modify financial state off-chain

---

## Frontend Responsibilities

Frontend is responsible only for:
- wallet interaction
- transaction requests
- displaying state
- rendering QR codes
- UX

Frontend must NEVER:
- contain financial logic
- bypass smart contract validations
- trust cached balances over on-chain state

---

# Technology Stack

## Smart Contracts
- Rust
- Anchor 1.0.2
- SPL Token Program

## Frontend
- Next.js 14
- React
- TypeScript
- TailwindCSS

## Solana
- @solana/web3.js
- @solana/pay
- wallet-adapter

## SDK
- Shared TypeScript SDK
- PDA helpers
- Solana Pay utilities
- transaction builders

---

# Package Management

Use ONLY npm for this repository.

Do NOT:
- use bun
- use yarn
- use pnpm

---

# Solana Environment

Current default cluster:
- Devnet

USDC Devnet Mint:
```txt
4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

---

# Smart Contract Philosophy

The smart contract is the trusted execution layer.

Critical logic MUST remain on-chain:
- payment authorization
- participant validation
- settlement
- vault ownership
- expiration checks

Never move financial validations to frontend-only logic.

---

# SDK Philosophy

The SDK is shared infrastructure.

It must:
- remain reusable
- remain framework-agnostic when possible
- avoid browser-only APIs in core modules
- avoid wallet-specific assumptions

The SDK must NEVER:
- contain private keys
- sign transactions
- depend directly on frontend state

---

# Solana Pay

This project uses Solana Pay Transaction Requests.

Important:
- QR codes must use `solana:` protocol
- transaction building happens server-side
- wallets perform GET + POST request flow

The mobile flow is expected to work with:
- Phantom
- Backpack
- compatible Solana Pay wallets

---

# Security Rules

## Never hardcode:
- private keys
- seed phrases
- RPC secrets
- API credentials

## Never commit:
- `.env`
- wallet files
- deploy authorities

## Always validate:
- PDA seeds
- token mint ownership
- participant authorization
- signer ownership

---

# Git Rules

## Ignore
```txt
node_modules/
target/
.next/
.env
.env.local
CLAUDE.local.md
```

---

# Coding Standards

## TypeScript
- Prefer strict typing
- Avoid `any`
- Prefer explicit interfaces

## React
- Prefer functional components
- Avoid unnecessary state duplication
- Keep wallet logic isolated

## Rust
- Prefer explicit account constraints
- Validate all financial assumptions
- Avoid unchecked accounts unless justified

---

# Testing Philosophy

All financial flows should be testable.

Critical flows:
- create bill
- pay share
- double payment prevention
- invalid participant rejection
- settlement
- expiration handling

---

# Commands

## Frontend
```bash
npm run dev
npm run build
```

## Anchor
```bash
anchor build
anchor deploy --provider.cluster devnet
anchor test
```

## Solana
```bash
solana config get
solana program show <PROGRAM_ID>
```

---

# Important Development Notes

## Next.js + Solana

Wallet adapters and browser wallet APIs must run only on the client side.

Avoid:
- SSR wallet access
- hydration mismatches
- window access during server render

---

## Monorepo Boundaries

Do not modify unrelated packages unnecessarily.

Examples:
- frontend tasks should not rewrite smart contracts
- SDK updates should avoid frontend-only assumptions
- scripts should remain operational and isolated

---

# Deployment Philosophy

Current target:
- Devnet
- hackathon demos
- MVP validation

Mainnet deployment requires:
- security review
- smart contract audit
- RPC redundancy
- monitoring
- failure recovery strategy

---

# General Principles

- Keep logic deterministic
- Prefer explicit validation
- Prefer transparency over hidden automation
- Optimize for correctness before optimization
- Keep financial logic auditable
- Treat blockchain state as authoritative