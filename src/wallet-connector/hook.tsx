import { EConnectType } from './core';
import { CoreMetaMask } from './core-meta-mask';
import CoreWalletConnect from './core-wallet-connect';

export const useWalletConnector = () => {
  const getConnectedWallet = () => {
    if (localStorage) {
      const isConnected = localStorage.getItem('wallet-connector-chain-id');
      
      if (isConnected) {
        const connectType = localStorage.getItem('wallet-connector-type') || '';
        switch (connectType) {
          case EConnectType.metamask: {
            return CoreMetaMask.getInstance();
          }
          case EConnectType.walletconnect: {
            return CoreWalletConnect.getInstance();
          }
          default:
            return null;
        }
      }
    }
    return null;
  };
  return { getConnectedWallet };
};
