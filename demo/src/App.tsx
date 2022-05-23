import React from 'react';
import './App.css';
import WalletConnectorTest from './WalletConnectorTest';

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <WalletConnectorTest chainSelected={56}/>
        <WalletConnectorTest chainSelected={137}/>
        <WalletConnectorTest chainSelected={4002}/>
      </header>
    </div>
  );
}

export default App;
