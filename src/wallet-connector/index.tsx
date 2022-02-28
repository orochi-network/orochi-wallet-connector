import React, { useState, useReducer, useEffect, useMemo } from 'react';
import { Buffer as safeBuffer } from 'safe-buffer';
import Button from '@mui/material/Button';
import { WalletConnectorDialog } from './dialog-select-wallet';
import ModalMessage from './modal-message';
import { DefaultWalletConnectorContext, WalletConnectorContext, WalletConnectorReducer } from './context';
import { CoreMetaMask } from './core-meta-mask';
import CoreWalletConnect from './core-wallet-connect';
import { IWallet, EConnectType } from './core';

declare let localStorage: any;

// @ts-ignore
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = safeBuffer;

declare let window: any;

export const VoidWallet = { isWallet: () => false } as IWallet;

export interface IWalletConnectorState {
  connected: boolean;
  address: string;
  chainId: number;
  type: 'unknown' | 'metamask' | 'walletconnect';
  dialogOpen: boolean;
  modalOpen: boolean;
  modalType: 'info' | 'error' | 'success' | 'warning';
  modalTitle: string;
  modalMessage: string;
}

export interface IWalletConnectorProps {
  onConnect: (error: Error | null, walletInstance: IWallet) => void;
  chainId?: number;
  onDisconnect: (error: Error | null) => void;
  connectButton?: React.ReactNode;
  disconnectButton?: React.ReactNode;
}

export const SupportedNetwork = new Map<number, string>([
  [1, 'Ethereum Mainnet'],
  [56, 'Binance Smart Chain'],
  [137, 'Polygon Mainnet'],
  [250, 'Fantom Opera'],
  [4002, 'Fantom Testnet'],
]);

export const DefaultChainID = 56; // Binance Smart Chain

export function WalletConnector(props: IWalletConnectorProps) {
  const [context, dispatch] = useReducer(WalletConnectorReducer, DefaultWalletConnectorContext);
  const [modalState, setModalState] = useState({ title: 'Unknown Error', message: 'Unknown error', type: 'info' });
  const [isConnected, setIsConnected] = useState(false);

  const overrideDispatch = (type: string, value: any) => dispatch({ type, value });

  const removeSessionAndDispatchDisconnectEvent = (error: any = null) => {
    setIsConnected(false);
    localStorage.removeItem('wallet-connector-type');
    localStorage.removeItem('wallet-connector-chain-id');
    overrideDispatch('wallet-disconnected', DefaultWalletConnectorContext);
    props.onDisconnect(error);
  };

  const getChainId = () => {
    return props.chainId || DefaultChainID;
  };

  const showModal = (type: string, title: string, message: string) => {
    setModalState({ title, type, message });
    overrideDispatch('open-modal', { modalOpen: true });
  };

  const onConnectMetamask = () => {
    if (typeof window.ethereum !== 'undefined') {
      const wallet = CoreMetaMask.getInstance();
      wallet
        .connect(getChainId())
        .then((address: string) => {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('wallet-connector-type', EConnectType.metamask);
            localStorage.setItem('wallet-connector-chain-id', getChainId());
          }
          overrideDispatch('metamask-connected', { connected: true, type: EConnectType.metamask, address });
          props.onConnect(null, wallet);
          setIsConnected(true);
          wallet.onDisconnect(() => {
            removeSessionAndDispatchDisconnectEvent();
          });
        })
        .catch((err: Error) => showModal('error', err.message, err.stack || 'Unknown reason'))
        .finally(() => overrideDispatch('close-dialog', { dialogOpen: false }));
    } else {
      showModal('error', 'Metamask Not Found', "Metamask wallet wasn't installed");
    }
  };

  useEffect(() => {
    // Restore previous session
    if (typeof localStorage !== 'undefined') {
      const type = localStorage.getItem('wallet-connector-type') || '';
      const chainId = Number(localStorage.getItem('wallet-connector-chain-id') || getChainId());
      if (type === EConnectType.metamask) {
        const wallet = CoreMetaMask.getInstance();
        if (wallet.isConnected()) {
          wallet.connect(chainId).then(() => {
            setIsConnected(true);
          });
          wallet.onDisconnect(() => {
            removeSessionAndDispatchDisconnectEvent();
          });
          props.onConnect(null, wallet);
        } else {
          onConnectMetamask();
        }
      } else if (type === EConnectType.walletconnect) {
        const wallet = CoreWalletConnect.getInstance();
        if (wallet.isConnected()) {
          setIsConnected(true);
          wallet.onDisconnect((err) => {
            removeSessionAndDispatchDisconnectEvent(err);
          });
          props.onConnect(null, wallet);
        }
      }
    }
  }, []);

  const onConnectWalletConnect = () => {
    const wallet = CoreWalletConnect.getInstance();
    wallet
      .connect(getChainId())
      .then((address: string) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('wallet-connector-type', EConnectType.walletconnect);
          localStorage.setItem('wallet-connector-chain-id', getChainId());
        }
        overrideDispatch('walletconnect-connected', { connected: true, type: EConnectType.walletconnect, address });
        props.onConnect(null, wallet);
        setIsConnected(true);
        wallet.onDisconnect((err) => {
          removeSessionAndDispatchDisconnectEvent(err);
        });
      })
      .catch((err: Error) => showModal('error', err.message, err.stack || 'Unknown reason'))
      .finally(() => overrideDispatch('close-dialog', { dialogOpen: false }));
  };

  const handleDialogClose = (connectType: string) => {
    if (connectType === 'metamask') {
      onConnectMetamask();
    } else if (connectType === 'walletconnect') {
      onConnectWalletConnect();
    } else {
      overrideDispatch('close-dialog', { dialogOpen: false });
    }
  };

  const handleButtonConnect = () => {
    if (props.chainId && !SupportedNetwork.get(props.chainId)) {
      showModal('error', 'Unsupported network', `Unsupported network with chain Id: ${props.chainId}`);
      return;
    }
    overrideDispatch('open-dialog', { dialogOpen: true });
  };

  const handleButtonDisconnect = async () => {
    if (isConnected) {
      const connectType = localStorage.getItem('wallet-connector-type') || '';
      switch (connectType) {
        case EConnectType.metamask: {
          const wallet = CoreMetaMask.getInstance();
          await wallet.disconnect();
          break;
        }
        case EConnectType.walletconnect: {
          const wallet = CoreWalletConnect.getInstance();
          await wallet.disconnect();
          break;
        }
        default:
          break;
      }
      removeSessionAndDispatchDisconnectEvent();
    }
  };

  const CustomConnectButton: any = useMemo(() => props.connectButton || Button, [props.connectButton]);

  const getPropsCustomConnectButton: any = useMemo(
    () => (props.connectButton ? {} : { variant: 'contained' }),
    [props.connectButton],
  );

  const CustomDisconnectButton: any = useMemo(() => props.disconnectButton || Button, [props.disconnectButton]);

  const getPropsCustomDisconnectButton: any = useMemo(
    () => (props.disconnectButton ? {} : { variant: 'contained' }),
    [props.disconnectButton],
  );

  return (
    <>
      <WalletConnectorContext.Provider value={{ ...context, dispatch: overrideDispatch }}>
        {!isConnected ? (
          <CustomConnectButton {...getPropsCustomConnectButton} onClick={handleButtonConnect}>
            Connect
          </CustomConnectButton>
        ) : (
          <CustomDisconnectButton {...getPropsCustomDisconnectButton} onClick={handleButtonDisconnect}>
            Disconnect
          </CustomDisconnectButton>
        )}
        <WalletConnectorDialog onClose={handleDialogClose} />
        <ModalMessage type={modalState.type} title={modalState.title}>
          {modalState.message}
        </ModalMessage>
      </WalletConnectorContext.Provider>
    </>
  );
}

export * from './core';
