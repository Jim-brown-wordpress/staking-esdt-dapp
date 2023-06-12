import React from 'react';
import { DappProvider } from '@multiversx/sdk-dapp/wrappers';
import { BrowserRouter as Router } from 'react-router-dom';
// import '@elrondnetwork/dapp-core/build/index.css';
import { ENVIRONMENT, walletConnectV2ProjectId } from 'config';
import ContextWrapper from './ContextWrapper';

const App = () => {
  return (
    <Router>
      <DappProvider
        environment={ENVIRONMENT}
        customNetworkConfig={{ 
          name: 'customConfig', 
          apiTimeout: 6000,
          walletConnectV2ProjectId
        }}
      >
        <ContextWrapper />
      </DappProvider>
    </Router>
  );
};

export default App;
