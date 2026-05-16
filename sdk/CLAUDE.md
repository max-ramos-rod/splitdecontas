````md id="d4f7h2"
# sdk

## Overview

This package contains the shared TypeScript SDK used by:
- frontend
- scripts
- future backend/indexers
- integrations

The SDK is the shared interaction layer for the SplitDeContas protocol.

Responsibilities:
- PDA derivation
- transaction builders
- Solana Pay helpers
- account parsing
- shared types
- protocol abstractions

---

# Stack

- TypeScript
- @solana/web3.js
- @solana/pay
- Anchor client
- SPL Token utilities

---

# SDK Philosophy

The SDK should remain:
- reusable
- framework-agnostic
- environment-safe
- deterministic

The SDK is infrastructure, not UI.

---

# SDK Responsibilities

## Allowed

- derive PDAs
- build transactions
- parse accounts
- generate Solana Pay URLs
- expose shared constants
- expose protocol helpers

---

# Not Allowed

The SDK must NEVER:
- contain private keys
- sign transactions directly
- depend on React
- depend on browser-only APIs in core logic
- contain UI logic
- contain Tailwind/CSS logic

---

# Directory Structure

```txt
sdk/
├── client.ts
├── constants.ts
├── pda.ts
├── types.ts
├── explorer.ts
└── index.ts
```

---

# PDA Rules

All PDA derivations must remain centralized in:
```txt
pda.ts
```

Never duplicate PDA derivation logic across:
- frontend
- scripts
- tests

This prevents:
- seed mismatch
- account inconsistency
- hardcoded errors

---

# Constants Rules

Shared constants belong in:
```txt
constants.ts
```

Examples:
- PROGRAM_ID
- USDC mint
- cluster defaults

Never hardcode these values in multiple packages.

---

# Transaction Builders

The SDK may:
- construct instructions
- construct transactions
- serialize transactions

The SDK must NOT:
- automatically broadcast transactions
- automatically sign transactions

Wallet ownership belongs to the caller.

---

# Solana Pay Rules

The SDK is responsible for generating:
- payment URLs
- QR payloads
- transaction request links

Correct protocol format:
```txt
solana:https://domain.com/api/pay?...
```

Never generate:
```txt
https://...
```

without the `solana:` prefix for Solana Pay QR usage.

---

# Mobile Compatibility

SDK logic must work across:
- desktop
- mobile
- browser wallets
- deep links

Avoid assumptions about:
- Phantom-only behavior
- browser-only APIs
- localhost availability

---

# Browser Compatibility

Avoid using browser-only APIs in shared core logic.

Examples to avoid:
- `window`
- `document`
- `localStorage`

unless isolated behind environment checks.

---

# Environment Safety

The SDK should support:
- frontend usage
- Node.js scripts
- backend workers

Keep logic isomorphic whenever possible.

---

# Error Handling

SDK errors should be:
- explicit
- human-readable
- deterministic

Prefer:
```txt
"Participant already paid"
```

over raw RPC traces.

---

# Account Fetching

The SDK may expose:
- fetch helpers
- account parsers
- list utilities

Avoid:
- hidden caching
- implicit polling
- silent retries

Consumers should control state refresh strategy.

---

# Type Safety

Prefer:
- explicit interfaces
- typed account models
- typed transaction params

Avoid:
- `any`
- implicit casting
- dynamic account assumptions

---

# Explorer Utilities

Explorer links should remain centralized.

Example:
```ts
explorerTx(signature)
explorerAccount(pubkey)
```

---

# Serialization Rules

Always serialize transactions safely.

Preferred:
```ts
serialize({
  requireAllSignatures: false,
  verifySignatures: false,
})
```

---

# RPC Rules

SDK should:
- accept external connection/provider
- avoid global singleton assumptions

Do not hardcode RPC URLs internally.

---

# Monorepo Rules

The SDK is shared infrastructure.

Frontend-specific logic does NOT belong here.

Examples of forbidden SDK logic:
- React hooks
- UI state
- component rendering
- DOM manipulation

---

# Version Compatibility

Current expected stack:
- Anchor 1.0.2
- Solana web3.js
- Solana Pay
- Next.js frontend

Changes affecting compatibility should be documented carefully.

---

# Testing Requirements

SDK utilities should be testable independently.

Important coverage:
- PDA derivation
- transaction building
- QR generation
- serialization
- account parsing

---

# Security Rules

Never:
- embed secrets
- expose deploy authorities
- bypass ownership validation

Always:
- validate pubkeys
- validate signer expectations
- validate transaction assumptions

---

# Performance Rules

Avoid:
- repeated PDA derivation in loops
- unnecessary RPC calls
- excessive serialization

Prefer:
- reusable helpers
- explicit caching by consumers

---

# Philosophy Summary

The SDK exists to:
- standardize protocol interaction
- reduce duplicated blockchain logic
- keep integrations consistent

It is the shared infrastructure layer between:
- smart contracts
- frontend
- scripts
- future backend services
````