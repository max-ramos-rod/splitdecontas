/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/split.json`.
 */
export type Split = {
  "address": "33Vu3HsczEWrrnmmWoXX1gFvaHTp5RUs228cFERJFvTY",
  "metadata": {
    "name": "split",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "closeBill",
      "docs": [
        "Fecha um bill após todos os participantes serem reembolsados.",
        "Recupera o rent do vault e do PDA para o criador."
      ],
      "discriminator": [
        237,
        108,
        151,
        67,
        249,
        83,
        247,
        250
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "bill",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true,
          "relations": [
            "bill"
          ]
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createBill",
      "docs": [
        "Criador abre uma conta compartilhada.",
        "bill_id: 8 bytes aleatórios gerados pelo cliente — garante seeds únicas",
        "sem depender do conteúdo da description (que pode ter >32 bytes)."
      ],
      "discriminator": [
        28,
        241,
        180,
        161,
        109,
        255,
        220,
        44
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "bill",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  108,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "billId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Vault: ATA do PDA — criado aqui, recebe os pagamentos"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bill"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "creatorTokenAccount"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "billId",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "shareAmount",
          "type": "u64"
        },
        {
          "name": "participants",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "expiresAt",
          "type": "i64"
        }
      ]
    },
    {
      "name": "payShare",
      "docs": [
        "Participante paga sua parte. Transfere share_amount para o vault do PDA.",
        "Normalmente invocado pelo Solana Pay após scan do QR."
      ],
      "discriminator": [
        95,
        14,
        255,
        254,
        57,
        192,
        231,
        238
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bill",
          "writable": true
        },
        {
          "name": "payerTokenAccount",
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "Vault validado contra o endereço armazenado no bill"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "refundOne",
      "docs": [
        "Criador cancela ou expiração: devolve pagamento de um participante.",
        "Chame uma vez por participante que já pagou."
      ],
      "discriminator": [
        51,
        162,
        110,
        71,
        71,
        81,
        71,
        58
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "bill",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "refundTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "settle",
      "docs": [
        "Quando todos pagaram: transfere vault → criador e fecha o PDA.",
        "Qualquer pessoa pode chamar — o programa valida internamente."
      ],
      "discriminator": [
        175,
        42,
        185,
        87,
        144,
        131,
        102,
        212
      ],
      "accounts": [
        {
          "name": "caller"
        },
        {
          "name": "bill",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true,
          "relations": [
            "bill"
          ]
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "creatorTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "billAccount",
      "discriminator": [
        179,
        107,
        38,
        94,
        129,
        246,
        222,
        7
      ]
    }
  ],
  "events": [
    {
      "name": "billCreated",
      "discriminator": [
        8,
        132,
        232,
        186,
        147,
        183,
        161,
        33
      ]
    },
    {
      "name": "billSettled",
      "discriminator": [
        252,
        54,
        237,
        105,
        113,
        14,
        217,
        166
      ]
    },
    {
      "name": "refundIssued",
      "discriminator": [
        249,
        16,
        159,
        159,
        93,
        186,
        145,
        206
      ]
    },
    {
      "name": "sharePaid",
      "discriminator": [
        36,
        246,
        242,
        254,
        175,
        66,
        177,
        78
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "descriptionTooLong",
      "msg": "Descrição muito longa (max 64 chars)"
    },
    {
      "code": 6001,
      "name": "tooFewParticipants",
      "msg": "Mínimo de 2 participantes"
    },
    {
      "code": 6002,
      "name": "tooManyParticipants",
      "msg": "Máximo de 8 participantes"
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Valor deve ser maior que zero"
    },
    {
      "code": 6004,
      "name": "invalidExpiry",
      "msg": "Data de expiração inválida"
    },
    {
      "code": 6005,
      "name": "billAlreadySettled",
      "msg": "Conta já liquidada"
    },
    {
      "code": 6006,
      "name": "billExpired",
      "msg": "Conta expirada"
    },
    {
      "code": 6007,
      "name": "notAParticipant",
      "msg": "Wallet não está na lista de participantes"
    },
    {
      "code": 6008,
      "name": "alreadyPaid",
      "msg": "Participante já pagou"
    },
    {
      "code": 6009,
      "name": "notAllPaid",
      "msg": "Nem todos pagaram ainda"
    },
    {
      "code": 6010,
      "name": "unauthorized",
      "msg": "Não autorizado"
    },
    {
      "code": 6011,
      "name": "nothingToRefund",
      "msg": "Nada a reembolsar para esta conta"
    },
    {
      "code": 6012,
      "name": "overflow",
      "msg": "Overflow no cálculo do total"
    },
    {
      "code": 6013,
      "name": "invalidVault",
      "msg": "Vault inválido — endereço não confere com o registrado no bill"
    },
    {
      "code": 6014,
      "name": "notAllRefunded",
      "msg": "Ainda há participantes com pagamento pendente de reembolso"
    }
  ],
  "types": [
    {
      "name": "billAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "creatorAta",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "billId",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "shareAmount",
            "type": "u64"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "settled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "participants",
            "type": {
              "vec": {
                "defined": {
                  "name": "participantStatus"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "billCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bill",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "total",
            "type": "u64"
          },
          {
            "name": "share",
            "type": "u64"
          },
          {
            "name": "numPayers",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "billSettled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bill",
            "type": "pubkey"
          },
          {
            "name": "total",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "participantStatus",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "paid",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "refundIssued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bill",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sharePaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bill",
            "type": "pubkey"
          },
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "paidCount",
            "type": "u8"
          },
          {
            "name": "totalPayers",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
