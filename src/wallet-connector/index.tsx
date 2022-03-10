import React, { useState, useReducer, useEffect, cloneElement } from 'react';
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
  onDisconnect?: (error: Error | null) => void;
  onChange?: (address: string) => void;
  connectButton?: React.ReactElement<any>;
  disconnectButton?: React.ReactElement<any>;
  hideDisconnectButton?: boolean;
  isInvisible?: boolean;
  isIgnoreChainId?: boolean;
}

export interface IWalletConnectorHandle {
  connect: () => void;
  disconnect: () => void;
  getWallet: () => IWallet | null;
}

export const SupportedNetwork = new Map<number, string>([
  [1, 'Ethereum Mainnet'],
  [56, 'Binance Smart Chain'],
  [137, 'Polygon Mainnet'],
  [250, 'Fantom Opera'],
  [4002, 'Fantom Testnet'],
  [31337, 'Localhost'], // Hardhat localhost
]);

export const DefaultChainID = 56; // Binance Smart Chain

const WalletConnectorComponent: React.ForwardRefRenderFunction<IWalletConnectorHandle, IWalletConnectorProps> = (
  props,
  ref,
) => {
  const [context, dispatch] = useReducer(WalletConnectorReducer, DefaultWalletConnectorContext);
  const [modalState, setModalState] = useState({ title: 'Unknown Error', message: 'Unknown error', type: 'info' });
  const [isConnected, setIsConnected] = useState(false);

  const overrideDispatch = (type: string, value: any) => dispatch({ type, value });

  const removeSessionAndDispatchDisconnectEvent = (error: any = null) => {
    setIsConnected(false);
    localStorage.removeItem('wallet-connector-type');
    localStorage.removeItem('wallet-connector-chain-id');
    overrideDispatch('wallet-disconnected', DefaultWalletConnectorContext);
    if (props.onDisconnect) props.onDisconnect(error);
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
        .connect(getChainId(), props.isIgnoreChainId)
        .then((address: string) => {
          const chainId = getChainId();
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('wallet-connector-type', EConnectType.metamask);
            localStorage.setItem('wallet-connector-chain-id', chainId);
          }
          overrideDispatch('metamask-connected', {
            connected: true,
            type: EConnectType.metamask,
            address,
            chainId,
          });
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
          wallet.connect(chainId, props.isIgnoreChainId).then(() => {
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

  const handleMetamaskChangeAccount = (accounts: string[]) => {
    if (accounts.length > 0 && context.address !== accounts[0]) {
      overrideDispatch('metamask-change-account', { address: accounts[0] });
      if (props.onChange) props.onChange(accounts[0]);
    }
  };

  // Metamask strongly recommend refresh web page
  const handleMetamaskChangeChain = () => {
    window.location.reload();
  };

  // Handle user changing their account or chainId with metamask
  useEffect(() => {
    if (window.ethereum) {
      const { ethereum } = window;
      ethereum.on('chainChanged', handleMetamaskChangeChain);
      ethereum.on('accountsChanged', handleMetamaskChangeAccount);
    }
    return () => {
      if (window.ethereum) {
        const { ethereum } = window;
        ethereum.removeListener('chainChanged', handleMetamaskChangeChain);
        ethereum.removeListener('accountsChanged', handleMetamaskChangeAccount);
      }
    };
  }, []);

  const onConnectWalletConnect = () => {
    const wallet = CoreWalletConnect.getInstance();
    wallet
      .connect(getChainId(), props.isIgnoreChainId)
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
      .catch((err: Error) => {
        localStorage.removeItem('walletconnect');
        showModal('error', err.message, err.stack || 'Unknown reason');
      })
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

  const getWallet = () => {
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
    return null;
  };

  React.useImperativeHandle(ref, () => ({
    connect: () => {
      return handleButtonConnect();
    },
    disconnect: () => {
      return handleButtonDisconnect();
    },
    getWallet: () => {
      return getWallet();
    },
  }));

  if (props.isInvisible) {
    return (
      <WalletConnectorContext.Provider value={{ ...context, dispatch: overrideDispatch }}>
        <WalletConnectorDialog onClose={handleDialogClose} />
        <ModalMessage type={modalState.type} title={modalState.title}>
          {modalState.message}
        </ModalMessage>
      </WalletConnectorContext.Provider>
    );
  }

  if (props.hideDisconnectButton) {
    return (
      <WalletConnectorContext.Provider value={{ ...context, dispatch: overrideDispatch }}>
        {cloneElement(props.connectButton || <Button variant="contained">Connect</Button>, {
          onClick: handleButtonConnect,
        })}
        <WalletConnectorDialog onClose={handleDialogClose} />
        <ModalMessage type={modalState.type} title={modalState.title}>
          {modalState.message}
        </ModalMessage>
      </WalletConnectorContext.Provider>
    );
  }

  return (
    <WalletConnectorContext.Provider value={{ ...context, dispatch: overrideDispatch }}>
      {!isConnected
        ? cloneElement(props.connectButton || <Button variant="contained">Connect</Button>, {
            onClick: handleButtonConnect,
          })
        : cloneElement(props.disconnectButton || <Button variant="contained">Disconnect</Button>, {
            onClick: handleButtonDisconnect,
          })}
      <WalletConnectorDialog onClose={handleDialogClose} />
      <ModalMessage type={modalState.type} title={modalState.title}>
        {modalState.message}
      </ModalMessage>
    </WalletConnectorContext.Provider>
  );
};

export const WalletConnector = React.forwardRef(WalletConnectorComponent);

export * from './core';
