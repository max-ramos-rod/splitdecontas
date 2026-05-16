# scripts

## Overview

This package contains operational and automation scripts for:
- deployment
- indexing
- synchronization
- maintenance
- utilities
- future crank jobs

Scripts are operational infrastructure and must remain isolated from frontend logic.

---

# Responsibilities

Scripts may:
- deploy programs
- initialize protocol state
- index blockchain data
- sync database state
- generate reports
- automate maintenance tasks

Scripts must NEVER:
- expose secrets publicly
- bypass protocol security
- modify on-chain state unsafely

---

# Stack

- TypeScript
- Node.js
- Solana web3.js
- Anchor client
- SDK utilities

---

# Deployment Rules

Before deploying:
- verify cluster
- verify wallet authority
- verify program ID
- verify environment variables

Always confirm:
```bash
solana config get
```

before deploy operations.

---

# Safe Deploy Commands

Preferred:
```bash
anchor build
anchor deploy --provider.cluster devnet
```

Avoid:
- deploying blindly
- using unknown wallets
- deploying to mainnet accidentally

---

# Cluster Safety

Scripts must validate cluster explicitly.

Never assume:
- devnet
- testnet
- mainnet

Use explicit configuration.

---

# Secret Handling

Never hardcode:
- private keys
- mnemonics
- RPC secrets
- API tokens

Use:
- `.env`
- environment variables
- secure secret managers

---

# Environment Variables

Expected:
```env
RPC_URL=
PRIVATE_KEY=
DATABASE_URL=
```

Never commit secrets.

---

# Indexing Philosophy

Indexers are UX layers only.

Blockchain remains the source of truth.

Indexers may:
- cache data
- accelerate queries
- improve UX

Indexers must NEVER:
- become authoritative financial state
- override blockchain state

---

# Crank Jobs

Future crank scripts may:
- monitor unpaid bills
- trigger automated settlement
- process protocol maintenance

Cranks must:
- remain idempotent
- validate state before execution
- avoid repeated execution loops

---

# Database Sync

Sync jobs should:
- tolerate RPC failure
- retry safely
- remain resumable

Avoid:
- destructive synchronization
- unsafe overwrites

---

# SDK Usage

Scripts should use the shared SDK whenever possible.

Avoid duplicating:
- PDA derivation
- transaction construction
- account parsing

---

# Logging Rules

Scripts should use structured logging.

Recommended:
```txt
[INFO]
[WARN]
[ERROR]
```

Important operations should log:
- tx signatures
- cluster
- account addresses
- failures

---

# Error Handling

Scripts must fail loudly and safely.

Never swallow:
- transaction failures
- RPC failures
- serialization errors

---

# Retry Rules

Safe retries are allowed for:
- RPC fetches
- indexing
- read operations

Be careful retrying:
- state-changing transactions
- settlement flows
- token transfers

---

# Transaction Rules

Scripts may:
- build transactions
- submit transactions
- monitor confirmations

Scripts must always:
- verify signers
- verify authorities
- verify target cluster

---

# Explorer Links

Useful logs should include:
- explorer transaction links
- account links

Example:
```txt
https://explorer.solana.com/tx/<signature>?cluster=devnet
```

---

# Automation Safety

Avoid automation that:
- loops infinitely
- spams RPC providers
- creates duplicate state transitions

Always rate-limit polling/indexing jobs.

---

# Monitoring Philosophy

Operational scripts should help monitor:
- failed settlements
- unpaid bills
- expired bills
- stuck transactions

Monitoring should remain non-destructive.

---

# File Structure

Recommended:
```txt
scripts/
├── deploy.ts
├── indexer.ts
├── sync.ts
├── crank.ts
├── seed.ts
└── utils/
```

---

# Seed Scripts

Seed scripts may:
- create fake bills
- fund test wallets
- generate demo environments

Never use seed scripts against mainnet.

---

# Mainnet Rules

Before any future mainnet deployment:
- perform security review
- verify deploy authority
- audit scripts
- enable monitoring
- validate recovery strategy

---

# Monorepo Rules

Scripts should avoid:
- frontend dependencies
- UI assumptions
- browser-only APIs

Scripts must remain operational tooling only.

---

# Operational Philosophy

Scripts exist to:
- simplify maintenance
- improve reliability
- automate repetitive operations
- improve protocol observability

They are infrastructure, not business logic.

---

# Important Principle

Automation must NEVER compromise financial safety.

Correctness is more important than convenience.

Every operational action should remain:
- auditable
- reversible when possible
- deterministic
- observable