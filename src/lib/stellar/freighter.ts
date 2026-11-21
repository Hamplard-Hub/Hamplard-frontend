import { isConnected, signTransaction, requestAccess, getNetwork, getPublicKey } from '@stellar/freighter-api';

export async function isFreighterInstalled(): Promise<boolean> {
  try { return await isConnected(); }
  catch { return false; }
}

export async function connectFreighter(): Promise<string> {
  await requestAccess();
  return getUserAddress();
}

export async function getUserAddress(): Promise<string> {
  return await getPublicKey();
}

export async function getWalletNetwork(): Promise<string> {
  return await getNetwork();
}

export async function signTx(xdr: string, networkPassphrase: string): Promise<string> {
  return await signTransaction(xdr, { networkPassphrase });
}

export async function signNonce(nonce: string, networkPassphrase: string): Promise<string> {
  const { TransactionBuilder, BASE_FEE, Operation } = await import('@stellar/stellar-sdk');
  const address = await getUserAddress();
  const dummy = {
    accountId: () => address,
    sequenceNumber: () => '0',
    incrementSequenceNumber: () => {},
  } as any;

  const tx = new TransactionBuilder(dummy, { fee: BASE_FEE, networkPassphrase })
    .addOperation(Operation.manageData({ name: 'hamplard_nonce', value: Buffer.from(nonce) }))
    .setTimeout(30)
    .build();

  return signTx(tx.toXDR(), networkPassphrase);
}
