import React, { useState, useEffect } from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import {
  TransactionPayload,
  Address,
  BigUIntValue,
  AddressValue,
  TypedValue,
  BytesValue,
  ArgSerializer
} from '@multiversx/sdk-core/out';
import { useNavigate } from 'react-router-dom';
import Time from 'components/Time';
import { SFT_STAKING_CONTRACT_ADDRESS, SFT_COLLECTION_ID } from 'config';
import { SFT_IMAGES, SFT_NAMES } from 'data';
import { routeNames } from 'routes';

import './index.scss';

const Card = (props: any) => {
  const navigate = useNavigate();
  const { address } = useGetAccountInfo();
  const isLoggedIn = Boolean(address);

  const handleLogin = () => {
    navigate(routeNames.unlock, { replace: true });
  };

  const [balance, setBalance] = useState(0);
  useEffect(() => {
    if (props.status === 1) {
      setBalance(props.item?.user_current_amount_per_nonce);
    } else if (props.status === 2) {
      setBalance(props.item?.user_staked_amount_per_nonce);
    } else if (props.status === 3) {
      setBalance(props.item?.user_unbonding_amount_per_nonce);
    } else {
      setBalance(props.item?.user_unbonded_amount_per_nonce);
    }
  }, []);

  const [value, setValue] = useState(1);

  const handleInput = (e: any) => {
    setValue(e.target.value);
  };

  const handleAction = async () => {
    if (props.status === 1) {
      // stake
      const args: TypedValue[] = [
        BytesValue.fromUTF8(SFT_COLLECTION_ID),
        new BigUIntValue(props.item?.nft_nonce.valueOf()),
        new BigUIntValue(value.valueOf()),
        new AddressValue(new Address(SFT_STAKING_CONTRACT_ADDRESS)),
        BytesValue.fromUTF8('stake')
      ];

      const { argumentsString } = new ArgSerializer().valuesToString(args);
      const data = new TransactionPayload(`ESDTNFTTransfer@${argumentsString}`);
      const tx = {
        receiver: address,
        gasLimit: 10000000,
        value: 0,
        data: data.toString()
      };
      await refreshAccount();

      await sendTransactions({
        transactions: tx,
        transactionsDisplayInfo: {
          processingMessage: 'Processing Staking transaction',
          errorMessage: 'An error has occured during Stake',
          successMessage: 'Staking transaction successful'
        },
        redirectAfterSign: false
      });
    } else if (props.status === 2) {
      // unstake
      const args: TypedValue[] = [
        BytesValue.fromUTF8(SFT_COLLECTION_ID),
        new BigUIntValue(props.item?.nft_nonce.valueOf()),
        new BigUIntValue(value.valueOf())
      ];

      const { argumentsString } = new ArgSerializer().valuesToString(args);
      const data = new TransactionPayload(`unstake@${argumentsString}`);
      const tx = {
        receiver: SFT_STAKING_CONTRACT_ADDRESS,
        gasLimit: 10000000,
        value: 0,
        data: data.toString()
      };
      await refreshAccount();

      await sendTransactions({
        transactions: tx,
        transactionsDisplayInfo: {
          processingMessage: 'Processing Unstaking transaction',
          errorMessage: 'An error has occured during Unstake',
          successMessage: 'Unstaking transaction successful'
        },
        redirectAfterSign: false
      });
    } else if (props.status === 4) {
      // claim nfts
      const args: TypedValue[] = [
        BytesValue.fromUTF8(SFT_COLLECTION_ID),
        new BigUIntValue(props.item?.nft_nonce.valueOf()),
        new BigUIntValue(value.valueOf())
      ];

      const { argumentsString } = new ArgSerializer().valuesToString(args);
      const data = new TransactionPayload(`claimNft@${argumentsString}`);
      const tx = {
        receiver: SFT_STAKING_CONTRACT_ADDRESS,
        gasLimit: 10000000,
        value: 0,
        data: data.toString()
      };
      await refreshAccount();

      await sendTransactions({
        transactions: tx,
        transactionsDisplayInfo: {
          processingMessage: 'Processing Claim transaction',
          errorMessage: 'An error has occured during Claim',
          successMessage: 'Claim transaction successful'
        },
        redirectAfterSign: false
      });
    }
  };

  const handleMax = () => {
    setValue(balance);
  };

  return (
    <div className='presale-container'>
      <div className='presale-container-status'>
        <div className='presale-container-status-left'>
          <div className='presale-container-status-phase-1'>
            {SFT_NAMES[props.item?.nft_nonce - 1]}
          </div>
        </div>
        {props.status === 3 ? (
          <Time
            leftTimestamp={props.item?.user_unbonding_end_timestamp_per_nonce}
          />
        ) : (
          <></>
        )}
      </div>
      <div className='presale-container-sft-asset'>
        <img src={SFT_IMAGES[props.item?.nft_nonce - 1]} alt='sft-image'></img>
      </div>
      <div className='presale-container-status-sale-amount'>
        {props.status === 1 ? 'Balance' : props.status === 2 ? 'Staked' : props.status === 3 ? 'Unbonding' : 'Unbonded'} : {balance} SFT
      </div>
      {props.status !== 3 ? (
        <div className='presale-container-input'>
          <input
            type='text'
            name='SFT amount'
            placeholder='Amount'
            aria-label='SFT amount'
            value={value}
            onChange={handleInput}
          />
          <div className='presale-container-input-text-max' onClick={handleMax}>
            MAX
          </div>
          {isLoggedIn ? (
            <button onClick={handleAction} className='is-style-cpc-btn-styled'>
              {props.status === 1
                ? 'STAKE'
                : props.status === 2
                  ? 'UNSTAKE'
                  : 'WITHDRAW'}
            </button>
          ) : (
            <button onClick={handleLogin}>CONNECT</button>
          )}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Card;
