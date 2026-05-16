# tests

## Overview

This package contains:
- Anchor tests
- integration tests
- transaction flow validation
- protocol security validation

Tests are mandatory for all critical financial flows.

The protocol must remain deterministic and auditable.

---

# Stack

- TypeScript
- Anchor testing framework
- Mocha
- Chai
- Solana Devnet / Localnet

---

# Testing Philosophy

Financial logic must NEVER rely only on manual testing.

Every critical path should have automated validation.

Priority:
1. correctness
2. security
3. deterministic behavior
4. edge cases

Performance is secondary during early protocol development.

---

# Required Test Coverage

## create_bill

Must validate:
- successful creation
- invalid participant count
- invalid amount
- expiration handling
- PDA derivation correctness
- vault initialization

---

## pay_share

Must validate:
- successful payment
- invalid participant rejection
- double payment prevention
- expired bill rejection
- incorrect token account rejection

---

## settle

Must validate:
- successful settlement
- partial payment rejection
- double settlement prevention
- creator-only restriction

---

## refund_one

Must validate:
- successful refund
- double refund prevention
- unpaid participant rejection

---

# Security Testing

Always test:
- signer validation
- PDA spoofing attempts
- unauthorized settlement
- invalid ATA ownership
- invalid token mint usage

Security regressions are critical failures.

---

# Cluster Rules

Default environments:
- local validator
- devnet

Avoid:
- mainnet testing
- real funds during automated tests

---

# Localnet Preference

Prefer local validator for:
- deterministic execution
- reproducible results
- isolated testing

Use devnet for:
- integration validation
- mobile flow testing
- wallet compatibility

---

# Fake Assets

Use fake/devnet USDC only.

Never:
- use production assets
- test with real value

---

# Test Wallet Rules

Test wallets should:
- remain isolated
- contain no real funds
- be generated for testing only

Never commit:
- funded wallet secrets
- private keys

---

# Deterministic Tests

Tests should:
- avoid timing randomness
- avoid external dependency assumptions
- avoid unstable RPC behavior

Prefer deterministic setup whenever possible.

---

# Fixtures

Reusable fixtures should exist for:
- creator wallet
- participant wallets
- mint setup
- funded accounts
- initialized bills

Avoid duplicated setup logic across tests.

---

# Logging

Use:
```ts
console.log()
```

sparingly.

Prefer:
- assertions
- explicit expectation checks
- structured failure output

---

# Assertion Rules

Assertions should validate:
- balances
- ownership
- PDA correctness
- account state
- transaction failure conditions

Avoid weak assertions.

---

# Error Validation

Expected failures should be tested explicitly.

Examples:
- invalid signer
- already paid
- bill expired
- settlement locked

Tests should verify correct error behavior.

---

# Time-Based Logic

When testing expiration:
- manipulate timestamps carefully
- avoid flaky delays
- prefer deterministic clock handling

---

# RPC Reliability

Tests should tolerate:
- temporary RPC latency
- blockhash refresh needs

Avoid:
- unnecessary network dependency

---

# SDK Usage

Tests may use the shared SDK when appropriate.

Avoid duplicating:
- PDA derivation
- transaction building
- account parsing

---

# File Structure

Recommended:
```txt
tests/
├── create_bill.ts
├── pay_share.ts
├── settle.ts
├── refund.ts
├── fixtures/
└── helpers/
```

---

# Helper Rules

Helpers should:
- reduce duplication
- simplify setup
- remain deterministic

Avoid hidden side effects in helpers.

---

# Cleanup Rules

Tests should:
- avoid leaking state
- isolate account usage when possible

Future CI environments must support parallel execution safely.

---

# Continuous Validation

Every protocol change should trigger:
- contract tests
- integration tests
- SDK compatibility checks

---

# Monorepo Rules

Tests should validate:
- contract behavior
- SDK compatibility
- frontend transaction assumptions

Avoid coupling tests directly to UI rendering.

---

# Important Principle

The protocol should fail safely.

Tests must verify:
- invalid actions fail
- valid actions succeed
- funds remain safe under failure conditions

---

# Philosophy Summary

Testing exists to guarantee:
- financial correctness
- deterministic execution
- protocol safety
- trustworthiness

Financial protocols without strong testing are unsafe by default.