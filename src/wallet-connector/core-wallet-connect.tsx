/* eslint-disable class-methods-use-this */
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { ethers } from 'ethers';
import { SupportedNetwork } from '.';
import { ITransaction, IWallet } from './core';

const singleton = new Map<string, any>();

export class CoreWalletConnect implements IWallet {
  private chainId: number = 0;

  private address: string = '';

  private connected: boolean = false;

  private walletConnectInstance: WalletConnect = {} as WalletConnect;

  private instanceName: string = '';

  private resolve: (value: any) => void = () => undefined;

  private reject: (reason: any) => void = () => undefined;

  public isWallet(): boolean {
    return true;
  }

  public getChainId(): number {
    if (this.chainId === 0) {
      this.chainId = this.walletConnectInstance.chainId;
    }
    return this.chainId;
  }

  constructor(instanceName: string) {
    this.instanceName = instanceName;
    this.reloadWalletConnect();
    this.connected = this.walletConnectInstance.connected;
    if (this.connected) {
      [this.address] = this.walletConnectInstance.accounts;
      this.chainId = this.walletConnectInstance.chainId;
    }
  }

  private reloadWalletConnect(isIgnoreChainId: boolean = false) {
    this.walletConnectInstance = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal,
      storageId: this.instanceName,
    });

    this.walletConnectInstance.on('connect', (error, payload) => {
      if (error) {
        return this.reject(error);
      }

      // Get provided accounts and chainId
      const { accounts, chainId } = payload.params[0];
      if (!isIgnoreChainId && chainId !== this.chainId) {
        this.walletConnectInstance.killSession();
        return this.reject(
          new Error(
            `WalletConnect Error: ChainId is different. Please connect to ${SupportedNetwork.get(this.chainId)} `,
          ),
        );
      }
      this.address = accounts[0] as string;
      this.connected = true;
      // It's in the end so return  is unnecessary
      return this.resolve(accounts[0]);
    });
  }

  public static getInstance(chainId: number, instanceName: string = 'wallet-connect'): CoreWalletConnect {
    const chainInstanceName = `${instanceName}-${chainId}`;
    if (!singleton.has(chainInstanceName)) {
      singleton.set(chainInstanceName, new CoreWalletConnect(chainInstanceName));
    }
    return singleton.get(chainInstanceName) as CoreWalletConnect;
  }

  public connect(chainId: number, isIgnoreChainId: boolean = false): Promise<string> {
    // Set target chain Id
    this.chainId = chainId;
    // If connected we have nothing to do here
    if (this.connected) return this.getAddress();

    // Perform connect
    return new Promise((resolve, reject) => {
      if (this.connected) resolve(this.address);
      this.reloadWalletConnect(isIgnoreChainId);
      this.resolve = resolve;
      this.reject = reject;
      this.walletConnectInstance.createSession({
        chainId,
      });
    });
  }

  public async disconnect(): Promise<any> {
    await this.walletConnectInstance.killSession();
    this.address = '';
    this.connected = false;
  }

  public onDisconnect(cbFn: (err: Error | null) => void) {
    this.walletConnectInstance.on('disconnect', (error: Error | null) => {
      cbFn(error);
      this.address = '';
      this.connected = false;
    });
  }

  public async getAddress(): Promise<string> {
    if (!ethers.utils.isAddress(this.address)) {
      [this.address] = this.walletConnectInstance.accounts;
    }
    return this.address;
  }

  // eslint-disable-next-line no-unused-vars
  public async switchNetwork(_chainId: number): Promise<boolean> {
    // Wallet might not support network switch yet, might be we need another approach
    return true;
  }

  public async sendTransaction(transaction: ITransaction): Promise<string> {
    return this.walletConnectInstance.sendTransaction(transaction);
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async signMessage(message: string): Promise<string> {
    return this.walletConnectInstance.signPersonalMessage([message, await this.getAddress()]);
  }
}

export default CoreWalletConnect;
