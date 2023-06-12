import React from 'react';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks';
import {
  ExtensionLoginButton,
  WebWalletLoginButton,
  LedgerLoginButton,
  WalletConnectLoginButton
} from '@multiversx/sdk-dapp/UI';
import { useNavigate } from 'react-router-dom';
import { routeNames } from 'routes';

import './index.scss';

export const UnlockRoute: ({
  loginRoute
}: {
  loginRoute: string;
}) => JSX.Element = ({ loginRoute }) => {
  const { isLoggedIn } = useGetLoginInfo();

  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoggedIn) {
      navigate(routeNames.home, { replace: true });
    }
  }, [isLoggedIn]);

  return (
    <div className='home d-flex flex-fill custom-unlock-button'>
      <div className='m-auto' data-testid='unlockPage'>
        <h3 className='cpc-styled'>CONNECT WALLET</h3>
        <p className='text-center'>
          Connect with your Elrond Wallet.
          <br />
          Select your login method:
        </p>

        <div className='col-12 d-flex'>
          <ExtensionLoginButton
            className='is-style-cpc-btn-styled button'
            callbackRoute={loginRoute}
            loginButtonText={'Extension'}
          >
            <div className='d-flex align-items-center'>
              <span>{'EXTENSION'}</span>
            </div>
          </ExtensionLoginButton>
        </div>
        <div className='col-12 d-flex'>
          <WalletConnectLoginButton
            className='is-style-cpc-btn-styled button'
            callbackRoute={loginRoute}
            loginButtonText={'Maiar'}
          >
            <div className='d-flex align-items-center'>
              <span>{'MAIAR APP'}</span>
            </div>
          </WalletConnectLoginButton>
        </div>
        <div className='col-12 d-flex'>
          <WebWalletLoginButton
            className='is-style-cpc-btn-styled button'
            callbackRoute={loginRoute}
            loginButtonText={'Web wallet'}
          >
            <div className='d-flex align-items-center'>
              <span>{'WEB WALLET'}</span>
            </div>
          </WebWalletLoginButton>
        </div>
        <div className='col-12 d-flex'>
          <LedgerLoginButton
            className='is-style-cpc-btn-styled button'
            loginButtonText={'Ledger'}
            callbackRoute={loginRoute}
          >
            <div className='d-flex align-items-center'>
              <span>{'LEDGER'}</span>
            </div>
          </LedgerLoginButton>
        </div>
      </div>
    </div>
  );
};

export default UnlockRoute;
