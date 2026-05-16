use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

declare_id!("33Vu3HsczEWrrnmmWoXX1gFvaHTp5RUs228cFERJFvTY");

pub const MAX_PARTICIPANTS: usize = 8;
pub const MAX_DESC_LEN: usize = 64;

#[program]
pub mod split {
    use super::*;

    /// Criador abre uma conta compartilhada.
    /// bill_id: 8 bytes aleatórios gerados pelo cliente — garante seeds únicas
    /// sem depender do conteúdo da description (que pode ter >32 bytes).
    pub fn create_bill(
        ctx: Context<CreateBill>,
        bill_id: [u8; 8],
        description: String,
        share_amount: u64,
        participants: Vec<Pubkey>,
        expires_at: i64,
    ) -> Result<()> {
        require!(description.len() <= MAX_DESC_LEN, SplitError::DescriptionTooLong);
        require!(participants.len() >= 2, SplitError::TooFewParticipants);
        require!(participants.len() <= MAX_PARTICIPANTS, SplitError::TooManyParticipants);
        require!(share_amount > 0, SplitError::InvalidAmount);
        require!(expires_at > Clock::get()?.unix_timestamp, SplitError::InvalidExpiry);

        let bill = &mut ctx.accounts.bill;
        bill.creator = ctx.accounts.creator.key();
        bill.creator_ata = ctx.accounts.creator_token_account.key();
        bill.token_mint = ctx.accounts.token_mint.key();
        bill.vault = ctx.accounts.vault.key();
        bill.bill_id = bill_id;
        bill.description = description;
        bill.share_amount = share_amount;
        bill.total_amount = share_amount
            .checked_mul(participants.len() as u64)
            .ok_or(SplitError::Overflow)?;
        bill.expires_at = expires_at;
        bill.created_at = Clock::get()?.unix_timestamp;
        bill.settled = false;
        bill.bump = ctx.bumps.bill;
        bill.participants = participants
            .iter()
            .map(|p| ParticipantStatus { wallet: *p, paid: false })
            .collect();

        emit!(BillCreated {
            bill: bill.key(),
            creator: bill.creator,
            total: bill.total_amount,
            share: bill.share_amount,
            num_payers: bill.participants.len() as u8,
        });

        Ok(())
    }

    /// Participante paga sua parte. Transfere share_amount para o vault do PDA.
    /// Normalmente invocado pelo Solana Pay após scan do QR.
    pub fn pay_share(ctx: Context<PayShare>) -> Result<()> {
        let bill = &mut ctx.accounts.bill;

        require!(!bill.settled, SplitError::BillAlreadySettled);
        require!(
            Clock::get()?.unix_timestamp < bill.expires_at,
            SplitError::BillExpired
        );

        let payer_key = ctx.accounts.payer.key();
        let participant = bill
            .participants
            .iter_mut()
            .find(|p| p.wallet == payer_key)
            .ok_or(SplitError::NotAParticipant)?;

        require!(!participant.paid, SplitError::AlreadyPaid);
        participant.paid = true;

        let share = bill.share_amount;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.payer_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            share,
        )?;

        let paid_count = bill.participants.iter().filter(|p| p.paid).count() as u8;
        emit!(SharePaid {
            bill: bill.key(),
            payer: payer_key,
            amount: share,
            paid_count,
            total_payers: bill.participants.len() as u8,
        });

        Ok(())
    }

    /// Quando todos pagaram: transfere vault → criador e fecha o PDA.
    /// Qualquer pessoa pode chamar — o programa valida internamente.
    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        let bill = &ctx.accounts.bill;

        require!(!bill.settled, SplitError::BillAlreadySettled);
        require!(
            bill.participants.iter().all(|p| p.paid),
            SplitError::NotAllPaid
        );

        // Captura antes de mutar (borrow checker)
        let creator = bill.creator;
        let bill_id = bill.bill_id;
        let bump = bill.bump;
        let vault_amount = ctx.accounts.vault.amount;
        let total = bill.total_amount;
        let bill_key = ctx.accounts.bill.key();

        // Marca antes de transferir (prevenção de reentrância)
        ctx.accounts.bill.settled = true;

        let seeds: &[&[u8]] = &[b"bill", creator.as_ref(), &bill_id, &[bump]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.creator_token_account.to_account_info(),
                    authority: ctx.accounts.bill.to_account_info(),
                },
                &[seeds],
            ),
            vault_amount,
        )?;

        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: ctx.accounts.bill.to_account_info(),
            },
            &[seeds],
        ))?;

        emit!(BillSettled { bill: bill_key, total });
        Ok(())
    }

    /// Criador cancela ou expiração: devolve pagamento de um participante.
    /// Chame uma vez por participante que já pagou.
    pub fn refund_one(ctx: Context<RefundOne>) -> Result<()> {
        let bill = &mut ctx.accounts.bill;

        require!(!bill.settled, SplitError::BillAlreadySettled);

        let caller = ctx.accounts.caller.key();
        let now = Clock::get()?.unix_timestamp;
        require!(
            caller == bill.creator || now >= bill.expires_at,
            SplitError::Unauthorized
        );

        let refund_owner = ctx.accounts.refund_token_account.owner;
        let share = bill.share_amount;
        let creator = bill.creator;
        let bill_id = bill.bill_id;
        let bump = bill.bump;

        let participant = bill
            .participants
            .iter_mut()
            .find(|p| p.wallet == refund_owner && p.paid)
            .ok_or(SplitError::NothingToRefund)?;
        participant.paid = false;
        let bill_key = bill.key();

        let seeds: &[&[u8]] = &[b"bill", creator.as_ref(), &bill_id, &[bump]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.refund_token_account.to_account_info(),
                    authority: ctx.accounts.bill.to_account_info(),
                },
                &[seeds],
            ),
            share,
        )?;

        emit!(RefundIssued {
            bill: bill_key,
            recipient: refund_owner,
            amount: share,
        });

        Ok(())
    }

    /// Fecha um bill após todos os participantes serem reembolsados.
    /// Recupera o rent do vault e do PDA para o criador.
    pub fn close_bill(ctx: Context<CloseBill>) -> Result<()> {
        let bill = &ctx.accounts.bill;

        let caller = ctx.accounts.caller.key();
        let now = Clock::get()?.unix_timestamp;
        require!(
            caller == bill.creator || now >= bill.expires_at,
            SplitError::Unauthorized
        );
        require!(
            bill.participants.iter().all(|p| !p.paid),
            SplitError::NotAllRefunded
        );

        let creator = bill.creator;
        let bill_id = bill.bill_id;
        let bump = bill.bump;
        let seeds: &[&[u8]] = &[b"bill", creator.as_ref(), &bill_id, &[bump]];

        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.creator.to_account_info(),
                authority: ctx.accounts.bill.to_account_info(),
            },
            &[seeds],
        ))?;

        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(bill_id: [u8; 8], description: String, share_amount: u64, participants: Vec<Pubkey>)]
pub struct CreateBill<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = BillAccount::size(participants.len()),
        seeds = [b"bill", creator.key().as_ref(), &bill_id],
        bump
    )]
    pub bill: Account<'info, BillAccount>,

    /// Vault: ATA do PDA — criado aqui, recebe os pagamentos
    #[account(
        init,
        payer = creator,
        associated_token::mint = token_mint,
        associated_token::authority = bill,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        constraint = creator_token_account.owner == creator.key() @ SplitError::Unauthorized,
        constraint = creator_token_account.mint == token_mint.key() @ SplitError::InvalidAmount,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PayShare<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bill", bill.creator.as_ref(), &bill.bill_id],
        bump = bill.bump,
    )]
    pub bill: Account<'info, BillAccount>,

    #[account(
        mut,
        constraint = payer_token_account.owner == payer.key() @ SplitError::Unauthorized,
        constraint = payer_token_account.mint == bill.token_mint @ SplitError::InvalidAmount,
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    /// Vault validado contra o endereço armazenado no bill
    #[account(
        mut,
        constraint = vault.key() == bill.vault @ SplitError::InvalidVault,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    /// CHECK: qualquer pessoa pode acionar o settle
    pub caller: UncheckedAccount<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [b"bill", bill.creator.as_ref(), &bill.bill_id],
        bump = bill.bump,
        has_one = creator,
    )]
    pub bill: Account<'info, BillAccount>,

    /// CHECK: validado via has_one no bill
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = vault.key() == bill.vault @ SplitError::InvalidVault,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = creator_token_account.key() == bill.creator_ata @ SplitError::Unauthorized,
        constraint = creator_token_account.owner == bill.creator @ SplitError::Unauthorized,
        constraint = creator_token_account.mint == bill.token_mint @ SplitError::InvalidAmount,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundOne<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bill", bill.creator.as_ref(), &bill.bill_id],
        bump = bill.bump,
    )]
    pub bill: Account<'info, BillAccount>,

    #[account(
        mut,
        constraint = vault.key() == bill.vault @ SplitError::InvalidVault,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = refund_token_account.mint == bill.token_mint @ SplitError::InvalidAmount,
    )]
    pub refund_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseBill<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        close = creator,
        seeds = [b"bill", bill.creator.as_ref(), &bill.bill_id],
        bump = bill.bump,
        has_one = creator,
    )]
    pub bill: Account<'info, BillAccount>,

    /// CHECK: validado via has_one no bill
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = vault.key() == bill.vault @ SplitError::InvalidVault,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ParticipantStatus {
    pub wallet: Pubkey, // 32
    pub paid: bool,     // 1
}

#[account]
pub struct BillAccount {
    pub creator: Pubkey,                   // 32
    pub creator_ata: Pubkey,               // 32
    pub token_mint: Pubkey,                // 32
    pub vault: Pubkey,                     // 32  ← endereço do vault para validação
    pub bill_id: [u8; 8],                  // 8   ← seed única (evita limite de 32 bytes)
    pub description: String,               // 4 + 64
    pub share_amount: u64,                 // 8
    pub total_amount: u64,                 // 8
    pub expires_at: i64,                   // 8
    pub created_at: i64,                   // 8
    pub settled: bool,                     // 1
    pub bump: u8,                          // 1
    pub participants: Vec<ParticipantStatus>, // 4 + n*33
}

impl BillAccount {
    pub fn size(n: usize) -> usize {
        8           // discriminator
        + 32 * 4    // creator, creator_ata, token_mint, vault
        + 8         // bill_id
        + 4 + 64    // description
        + 8 * 4     // share_amount, total_amount, expires_at, created_at
        + 1 + 1     // settled, bump
        + 4 + n * 33 // participants
        + 64        // margem
    }
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum SplitError {
    #[msg("Descrição muito longa (max 64 chars)")]
    DescriptionTooLong,
    #[msg("Mínimo de 2 participantes")]
    TooFewParticipants,
    #[msg("Máximo de 8 participantes")]
    TooManyParticipants,
    #[msg("Valor deve ser maior que zero")]
    InvalidAmount,
    #[msg("Data de expiração inválida")]
    InvalidExpiry,
    #[msg("Conta já liquidada")]
    BillAlreadySettled,
    #[msg("Conta expirada")]
    BillExpired,
    #[msg("Wallet não está na lista de participantes")]
    NotAParticipant,
    #[msg("Participante já pagou")]
    AlreadyPaid,
    #[msg("Nem todos pagaram ainda")]
    NotAllPaid,
    #[msg("Não autorizado")]
    Unauthorized,
    #[msg("Nada a reembolsar para esta conta")]
    NothingToRefund,
    #[msg("Overflow no cálculo do total")]
    Overflow,
    #[msg("Vault inválido — endereço não confere com o registrado no bill")]
    InvalidVault,
    #[msg("Ainda há participantes com pagamento pendente de reembolso")]
    NotAllRefunded,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct BillCreated {
    pub bill: Pubkey,
    pub creator: Pubkey,
    pub total: u64,
    pub share: u64,
    pub num_payers: u8,
}

#[event]
pub struct SharePaid {
    pub bill: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
    pub paid_count: u8,
    pub total_payers: u8,
}

#[event]
pub struct BillSettled {
    pub bill: Pubkey,
    pub total: u64,
}

#[event]
pub struct RefundIssued {
    pub bill: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}
