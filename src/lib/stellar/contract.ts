/**
 * lib/stellar/contract.ts
 * Soroban contract calls for Hamplard.
 * Students call enroll() to pay and get access.
 * Instructors call register_course() when submitting for review.
 */

import {
  Networks, SorobanRpc, Contract, TransactionBuilder,
  BASE_FEE, nativeToScVal, xdr, Address,
} from '@stellar/stellar-sdk';
import { signTx } from './freighter';

const RPC_URL     = process.env.NEXT_PUBLIC_STELLAR_RPC_URL!;
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK     = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';
const PASSPHRASE  = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;

let _rpc: SorobanRpc.Server;
const getRpc = () => (_rpc ??= new SorobanRpc.Server(RPC_URL, { allowHttp: true }));

async function invokeContract(caller: string, method: string, args: xdr.ScVal[]): Promise<string> {
  const rpc      = getRpc();
  const contract = new Contract(CONTRACT_ID);
  const account  = await rpc.getAccount(caller);

  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(sim)) throw new Error(`Simulation: ${sim.error}`);

  const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
  const signed    = await signTx(assembled.toXDR(), PASSPHRASE);

  const { Transaction } = await import('@stellar/stellar-sdk');
  const resp = await rpc.sendTransaction(new Transaction(signed));
  if (resp.status === 'ERROR') throw new Error('Submission failed');

  return waitForTx(resp.hash);
}

async function waitForTx(hash: string): Promise<string> {
  const rpc = getRpc();
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const r = await rpc.getTransaction(hash);
    if (r.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) return hash;
    if (r.status === SorobanRpc.Api.GetTransactionStatus.FAILED)
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
  return invokeContract(params.callerAddress, 'enroll', [
    new Address(params.callerAddress).toScVal(),
    nativeToScVal(params.courseId, { type: 'string' }),
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
  return invokeContract(params.callerAddress, 'register_course', [
    new Address(params.callerAddress).toScVal(),
    nativeToScVal(params.courseId, { type: 'string' }),
    nativeToScVal(params.price, { type: 'i128' }),
    new Address(params.tokenAddress).toScVal(),
    nativeToScVal(params.platformFeePct ?? 0, { type: 'u32' }),
  ]);
}
