export interface ITransaction {
  from: string;
  to: string;
  data?: string;
  value?: string | number;
  gas?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface IWallet {
  isWallet(): boolean;
  connect: (chainId: number) => Promise<string>;
  disconnect: () => Promise<any>;
  getChainId(): number;
  getAddress: () => Promise<string>;
  sendTransaction: (transaction: ITransaction) => Promise<string>;
  switchNetwork: (chainId: number) => Promise<boolean>;
  isConnected: () => boolean;
  signMessage: (message: string) => Promise<string>;
}

export enum EConnectType {
  metamask = 'metamask',
  walletconnect = 'walletconnect',
}
