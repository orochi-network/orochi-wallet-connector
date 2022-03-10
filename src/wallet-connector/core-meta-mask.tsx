/* eslint-disable class-methods-use-this */
import { ethers } from 'ethers';
import { ITransaction, IWallet } from './core';
import { networkData, toChainIdString } from './utilities';

type TRpcMethod =
  | 'eth_accounts'
  | 'eth_requestAccounts'
  | 'eth_sendTransaction'
  | 'wallet_switchEthereumChain'
  | 'wallet_addEthereumChain'
  | 'personal_sign'
  | 'eth_chainId';

declare let ethereum: {
  request: (rpcRequest: { method: TRpcMethod; params?: any[] }) => Promise<any>;
  chainId: string;
  on: (event: string, handler: (error: any) => void) => void;
};

const singleton = new Map<string, any>();

export class CoreMetaMask implements IWallet {
  private chainId: number = 0;

  private address: string = '';

  public getChainId(): number {
    return this.chainId;
  }

  public isWallet(): boolean {
    return true;
  }

  public static getInstance(instanceName: string = 'metamask'): CoreMetaMask {
    if (!singleton.has(instanceName)) {
      singleton.set(instanceName, new CoreMetaMask());
    }
    return singleton.get(instanceName) as CoreMetaMask;
  }

  public async connect(chainId: number, isIgnoreChainId: boolean = false) {
    if (chainId === 0) throw new Error('Invalid chainId');
    const [walletAddress] = await ethereum.request({ method: 'eth_requestAccounts' });
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    this.address = walletAddress;
    this.chainId = currentChainId;
    if (isIgnoreChainId) return walletAddress;

    // We are on different network
    if (currentChainId !== toChainIdString(chainId)) {
      await this.switchNetwork(chainId);
    }
    return walletAddress;
  }

  public disconnect(): Promise<any> {
    return Promise.resolve();
  }

  public onDisconnect(cbFn: (err: Error | null) => void): void {
    ethereum.on('disconnect', () => {
      if (cbFn && typeof cbFn === 'function') {
        cbFn(null);
      }
    });
  }

  public async getAddress(): Promise<string> {
    const [address]: [string] = await ethereum.request({ method: 'eth_accounts' });
    if (address && !ethers.utils.isAddress(address)) {
      // Try to reconnect to correct the issue
      this.address = address;
    }
    return this.address;
  }

  public async switchNetwork(chainId: number): Promise<boolean> {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: toChainIdString(chainId) }],
      });
    } catch (e) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkData[toChainIdString(chainId)] || {}],
      });
    }
    return true;
  }

  public async sendTransaction(transaction: ITransaction): Promise<string> {
    return ethereum.request({ method: 'eth_sendTransaction', params: [transaction] });
  }

  public isConnected(): boolean {
    return ethers.utils.isAddress(this.address || '');
  }

  public async signMessage(message: string): Promise<string> {
    return ethereum.request({
      method: 'personal_sign',
      params: [message, await this.getAddress()],
    });
  }
}

export default CoreMetaMask;
