````md id="u3v8k1"
# app

## Overview

This package contains the SplitDeContas frontend application.

Responsibilities:
- wallet connection
- transaction UX
- bill creation UI
- participant visualization
- Solana Pay integration
- settlement interaction

The frontend is NOT the source of truth.

All financial state must come from the blockchain.

---

# Stack

- Next.js 14
- React
- TypeScript
- TailwindCSS
- Solana Wallet Adapter
- Solana Pay

---

# Frontend Philosophy

The frontend is a presentation and interaction layer only.

The frontend must NEVER:
- store authoritative financial state
- bypass contract validations
- calculate settlement independently
- assume payments succeeded without confirmation

The blockchain is always authoritative.

---

# Directory Structure

```txt
src/
├── components/
├── hooks/
├── pages/
├── styles/
├── lib/
└── idl/
```

---

# Wallet Rules

## Wallet access is client-side only

Never access:
- `window`
- wallet adapter
- Phantom provider

during server-side rendering.

---

# SSR Rules

Avoid hydration mismatches.

Rules:
- wallet UI must render only on client
- browser-only APIs require mounted state
- avoid random values during SSR

Use:
- `dynamic(..., { ssr: false })`
- mounted/client guards
- ClientOnly wrappers

---

# Wallet Adapter

Supported wallets:
- Phantom
- Backpack
- Solflare

Rules:
- never auto-sign transactions
- always require explicit user approval
- never assume wallet connection state

---

# Solana Pay Rules

This project uses Solana Pay Transaction Requests.

QR codes must:
- use `solana:` protocol
- point to public URLs
- avoid localhost in production/mobile flows

Correct format:
```txt
solana:https://domain.com/api/pay?...
```

---

# Mobile Flow Notes

Localhost does NOT work on mobile wallets.

Use:
- ngrok
- public domains
- deployed environments

for mobile transaction testing.

---

# API Rules

Frontend API calls should:
- handle loading states
- handle RPC failures
- handle wallet rejection gracefully

Never assume:
- transaction success
- RPC consistency
- wallet availability

---

# SDK Usage

Frontend must consume logic through the shared SDK whenever possible.

Avoid duplicating:
- PDA derivation
- Solana Pay logic
- transaction builders
- account parsing

The SDK is the shared abstraction layer.

---

# State Management

Keep state minimal and explicit.

Avoid:
- duplicated blockchain state
- hidden global mutations
- optimistic financial updates

Preferred:
- fetch on-chain state
- refresh after confirmation
- polling or websocket subscriptions

---

# Recommended UX

## Loading states

Every transaction action should show:
- loading
- success
- failure

Never leave actions visually frozen.

---

# Error Handling

Always display readable errors.

Examples:
- wallet rejected transaction
- insufficient USDC
- bill expired
- participant invalid

Avoid raw RPC errors in UI.

---

# Real-Time Updates

Preferred approaches:
- polling
- `connection.onAccountChange`

Use real-time updates for:
- participant payment status
- settlement status
- progress tracking

---

# Components

Components should remain:
- reusable
- presentation-focused
- isolated

Avoid placing:
- RPC logic
- wallet logic
- financial logic

deep inside UI components.

---

# Styling

Preferred:
- Tailwind utility classes
- responsive layouts
- mobile-first design

Avoid:
- inline styles
- duplicated styling patterns

---

# Security Rules

Never expose:
- private keys
- admin secrets
- RPC secrets

Never trust:
- frontend-only validation
- client-generated financial assumptions

---

# Performance Rules

Avoid:
- excessive RPC calls
- repeated account fetching
- unnecessary re-renders

Prefer:
- memoization
- cached fetches
- shared connections

---

# Solana RPC Rules

Always:
- handle RPC failure
- retry gracefully when appropriate
- show user-friendly fallback messages

Never assume:
- instant finality
- stable RPC latency

---

# Environment Variables

Expected:
```env
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_API_URL=
```

Never expose secrets through `NEXT_PUBLIC_*`.

---

# Explorer Integration

Frontend should expose:
- transaction links
- account explorer links

Useful format:
```txt
https://explorer.solana.com/address/<pubkey>?cluster=devnet
```

---

# Testing Philosophy

Important UI flows:
- wallet connect
- create bill
- render QR
- pay share
- settle bill

Test both:
- desktop
- mobile wallet flows

---

# Monorepo Rules

Frontend changes should avoid:
- modifying smart contract logic
- duplicating SDK functionality
- creating frontend-only business rules

Keep responsibilities separated.

---

# Important UX Principle

Users should always understand:
- what they are signing
- how much they are paying
- who receives funds
- transaction status

Transparency is critical for financial UX.

---

# Philosophy Summary

The frontend exists to:
- simplify blockchain interaction
- improve usability
- expose transparent financial state

It must NEVER become the financial authority.
````