/**
 * lib/stellar/contract.ts
 * Soroban contract calls for Hamplard.
 * Students call enroll() to pay and get access.
 * Instructors call register_course() when submitting for review.
 * 
 * Note: Stellar SDK imports are deferred to reduce initial bundle size.
 */

import { signTx } from './freighter';
import type { SorobanRpc, xdr } from '@stellar/stellar-sdk';

const RPC_URL     = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK     = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';

// Lazy-load Stellar SDK to reduce bundle size
let _stellarSdk: typeof import('@stellar/stellar-sdk') | null = null;
const getStellarSdk = async () => {
  if (!_stellarSdk) {
    _stellarSdk = await import('@stellar/stellar-sdk');
  }
  return _stellarSdk;
};

const getPassphrase = async () => {
  const sdk = await getStellarSdk();
  return NETWORK === 'mainnet' ? sdk.Networks.PUBLIC : sdk.Networks.TESTNET;
};

let _rpc: SorobanRpc.Server | null = null;
const getRpc = async () => {
  if (!_rpc) {
    const sdk = await getStellarSdk();
    _rpc = new sdk.SorobanRpc.Server(RPC_URL, {
      allowHttp: RPC_URL.startsWith('http://localhost') || process.env.NODE_ENV !== 'production',
    });
  }
  return _rpc;
};

async function invokeContract(caller: string, method: string, args: xdr.ScVal[]): Promise<string> {
  const sdk = await getStellarSdk();
  const rpc = await getRpc();
  const passphrase = await getPassphrase();
  
  const contract = new sdk.Contract(CONTRACT_ID);
  const account  = await rpc.getAccount(caller);

  const tx = new sdk.TransactionBuilder(account, { fee: sdk.BASE_FEE, networkPassphrase: passphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (sdk.SorobanRpc.Api.isSimulationError(sim)) throw new Error(`Simulation: ${sim.error}`);

  const assembled = sdk.SorobanRpc.assembleTransaction(tx, sim).build();
  const signed    = await signTx(assembled.toXDR(), passphrase);

  const { Transaction } = sdk;
  const resp = await rpc.sendTransaction(new Transaction(signed, passphrase));
  if (resp.status === 'ERROR') throw new Error('Submission failed');

  return waitForTx(resp.hash);
}

async function waitForTx(hash: string): Promise<string> {
  const sdk = await getStellarSdk();
  const rpc = await getRpc();
  
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const r = await rpc.getTransaction(hash);
    if (r.status === sdk.SorobanRpc.Api.GetTransactionStatus.SUCCESS) return hash;
    if (r.status === sdk.SorobanRpc.Api.GetTransactionStatus.FAILED)
      throw new Error(`Transaction failed: ${hash}`);
  }
  throw new Error('Transaction not confirmed');
}

/**
 * Student enrolls in a course and pays the fee.
 * Payment is split automatically: platform fee to treasury, remainder to instructor.
 */
export async function enrollInCourse(params: {
  callerAddress: string;
  courseId: string;
}): Promise<string> {
  const sdk = await getStellarSdk();
  return invokeContract(params.callerAddress, 'enroll', [
    new sdk.Address(params.callerAddress).toScVal(),
    sdk.nativeToScVal(params.courseId, { type: 'string' }),
  ]);
}

/**
 * Instructor registers a course on-chain (called before submitting for admin review).
 */
export async function registerCourseOnChain(params: {
  callerAddress: string;
  courseId: string;
  price: bigint;
  tokenAddress: string;
  platformFeePct?: number;
}): Promise<string> {
  const sdk = await getStellarSdk();
  return invokeContract(params.callerAddress, 'register_course', [
    new sdk.Address(params.callerAddress).toScVal(),
    sdk.nativeToScVal(params.courseId, { type: 'string' }),
    sdk.nativeToScVal(params.price, { type: 'i128' }),
    new sdk.Address(params.tokenAddress).toScVal(),
    sdk.nativeToScVal(params.platformFeePct ?? 0, { type: 'u32' }),
  ]);
}
