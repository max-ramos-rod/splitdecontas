# programs/split

## Overview

This package contains the Anchor smart contract responsible for:
- bill creation
- participant payment tracking
- vault custody
- settlement
- refund logic

This program is the financial source of truth for SplitDeContas.

All critical financial rules MUST remain on-chain.

---

# Stack

- Rust
- Anchor 1.0.2
- SPL Token Program
- Solana Devnet

---

# Program Philosophy

The program acts as a decentralized settlement engine.

The frontend and backend are NOT trusted.

The program itself must validate:
- who can pay
- how much can be paid
- who can settle
- whether settlement is allowed
- vault ownership
- PDA integrity

---

# Core Accounts

## BillAccount

Stores:
- creator
- token mint
- vault ATA
- participants
- payment status
- settlement status
- expiration
- metadata

This is the canonical state object.

---

# PDA Rules

## Bill PDA

Seeds:
```txt
["bill", creator, bill_id]
```

Rules:
- seeds must NEVER change after deployment
- changing seeds breaks compatibility
- all PDA derivations must remain deterministic

---

# Vault Rules

Vaults are Associated Token Accounts owned by the Bill PDA.

Rules:
- vault owner MUST be Bill PDA
- vault mint MUST match bill token mint
- creator must NEVER directly own vault funds before settlement

---

# Supported Instructions

## create_bill

Responsibilities:
- initialize BillAccount
- validate participants
- initialize vault
- store metadata

Validation rules:
- minimum 2 participants
- maximum participant limit enforced
- positive share amount required
- expiration timestamp required

---

## pay_share

Responsibilities:
- validate participant
- transfer SPL tokens
- mark participant as paid

Validation rules:
- payer must match participant
- participant cannot pay twice
- bill must not be expired
- settlement must not already occur

---

## settle

Responsibilities:
- transfer vault balance to creator
- mark bill as settled

Validation rules:
- only creator can settle
- all participants must be paid
- vault balance must match expectations
- bill must not already be settled

---

## refund_one

Responsibilities:
- refund participant individually

Validation rules:
- only allowed under refund conditions
- participant must have paid
- prevent double refunds

---

# Security Principles

## Never trust frontend input

All accounts and relationships must be validated on-chain.

Examples:
- participant membership
- token ownership
- PDA derivation
- signer ownership

---

# SPL Token Rules

Always validate:
- token mint
- ATA ownership
- vault authority
- token program account

Never assume client-provided token accounts are correct.

---

# Account Constraints

Prefer Anchor constraints whenever possible.

Examples:
- `has_one`
- `constraint =`
- `seeds`
- `bump`
- `token::mint`
- `token::authority`

Avoid manual validation if Anchor can enforce it safely.

---

# Unchecked Accounts

Avoid `UncheckedAccount`.

Only use when:
- absolutely necessary
- fully validated manually

Every unchecked account must include:
- validation comments
- justification

---

# Events

Emit events for:
- bill creation
- participant payment
- settlement
- refunds

Events improve:
- indexing
- analytics
- UI responsiveness

---

# Serialization Rules

Avoid breaking account layouts.

Do NOT:
- reorder fields casually
- remove fields from live accounts
- change PDA seeds

If schema changes are required:
- create migration strategy
- preserve backward compatibility when possible

---

# Financial Safety

## Critical Rule

Funds must NEVER become inaccessible.

Always verify:
- authority correctness
- PDA ownership
- signer logic
- settlement conditions

---

# Integer Handling

Use integers only.

Never use floating point math.

USDC amounts use:
```txt
1 USDC = 1_000_000 units
```

All calculations must remain deterministic.

---

# Time Handling

Use Unix timestamps only.

Rules:
- expiration checks must use on-chain clock
- never trust client timestamps

Use:
```rust
Clock::get()?.unix_timestamp
```

---

# Compute Budget Awareness

Avoid:
- unnecessary loops
- large vectors
- repeated PDA derivations

Optimize for:
- predictable compute usage
- stable transaction costs

---

# Testing Requirements

Every financial path requires tests.

Required coverage:
- successful payment
- invalid participant
- double payment
- settlement before completion
- settlement after completion
- expired bill payment
- refund edge cases

---

# Logging

Use:
```rust
msg!()
```

for:
- debugging
- important state transitions
- validation failures

Avoid excessive logs in production paths.

---

# Deployment Rules

Before deploy:
- verify cluster
- verify wallet
- verify program ID
- rebuild IDL

Commands:
```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

# Important Constraints

## Never
- hardcode private keys
- bypass signer validation
- trust client state
- trust frontend calculations

## Always
- validate ownership
- validate signer
- validate PDA seeds
- validate token authority

---

# Philosophy Summary

The smart contract is the trusted financial engine.

Everything critical must be:
- deterministic
- auditable
- verifiable
- impossible to manipulate from frontend/backend