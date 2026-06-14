import {
  isConnected, getAddress, signTransaction,
  requestAccess, getNetwork, WatchWalletChanges,
} from '@stellar/freighter-api';

export async function isFreighterInstalled(): Promise<boolean> {
  try { const r = await isConnected(); return r.isConnected; }
  catch { return false; }
}

export async function connectFreighter(): Promise<string> {
  const r = await requestAccess();
  if (r.error) throw new Error(r.error);
  return getUserAddress();
}

export async function getUserAddress(): Promise<string> {
  const r = await getAddress();
  if (r.error) throw new Error(r.error);
  return r.address;
}

export async function getWalletNetwork(): Promise<string> {
  const r = await getNetwork();
  if (r.error) throw new Error(r.error);
  return r.network;
}

export async function signTx(xdr: string, networkPassphrase: string): Promise<string> {
  const r = await signTransaction(xdr, { networkPassphrase });
  if (r.error) throw new Error(r.error);
  return r.signedTxXdr;
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

export function watchWallet(onChange: (address: string) => void): () => void {
  const watcher = new WatchWalletChanges(3000);
  watcher.watch(async () => {
    try { onChange(await getUserAddress()); } catch {}
  });
  return () => watcher.stop();
}
