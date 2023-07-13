import { PublicKey } from '@solana/web3.js'

import BN from 'bn.js'
import { TokenAccount as _TokenAccount } from '@raydium-io/raydium-sdk'

export interface ITokenAccount {
  publicKey?: PublicKey
  mint?: PublicKey
  isAssociated?: boolean
  amount: BN
  isNative: boolean
}
export type TokenAccountRawInfo = _TokenAccount
export type RpcUrl = string
export type WalletOwner = string
