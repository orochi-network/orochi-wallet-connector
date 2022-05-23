import React, { useCallback, useState } from 'react';
import { IWallet, WalletConnector, useWalletConnector } from '@orochi-network/wallet-connector';
import './App.css';
import { Button } from '@mui/material';

function WalletConnectorTest({ chainSelected }: { chainSelected: number }) {
  const [wallet, setWallet] = useState<null | IWallet>(null);
  const [address, setAddress] = useState<null | string>(null);
  const [chainId, setChainId] = useState<undefined | number>(undefined);
  const { getConnectedWallet } = useWalletConnector();

  const onConnect = (err: Error | null, wallet: IWallet) => {
    if (err === null) {
      setWallet(wallet);
      wallet.getAddress().then((address) => setAddress(address));
    } else {
      setWallet(null);
    }
  };

  const onChange = (address: string) => setAddress(address);

  const onDisconnect = useCallback((error: Error | null) => {
    if (!error) {
      setWallet(null);
      setAddress(null);
    }
  }, []);

  const onClickDisconnect = () => {
    getConnectedWallet()?.disconnect();
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p>Chain Id: {chainSelected}</p>
      </div>
      <WalletConnector
        onConnect={onConnect}
        chainId={chainSelected}
        onChange={onChange}
        onDisconnect={onDisconnect}
        connectButton={<Button variant="contained">Connect</Button>}
        dialogOpenTitle={'Choose another text'}
        // isIgnoreChainId={true}
      />
      <div>
        <p>Connected address: {address || '...'}</p>
      </div>
    </div>
  );
}

export default WalletConnectorTest;
