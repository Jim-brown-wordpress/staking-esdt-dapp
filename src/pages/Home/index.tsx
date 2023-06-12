import React, { useState, useEffect } from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { useGetNetworkConfig, useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import {
  TransactionPayload,
  Address,
  SmartContract,
  AbiRegistry,
  BigUIntValue,
  ContractFunction,
  AddressValue,
  SmartContractAbi,
  ResultsParser,
  TypedValue,
  BytesValue,
  ArgSerializer
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';

import axios from 'axios';
import BigNumber from 'bignumber.js/bignumber.js';
import { Modal } from 'react-bootstrap';
import { Row, Col } from 'react-bootstrap';
import esdtAbi from 'abi/esdt/city-staking-sc.abi.json';
import {
  ESDT_STAKING_CONTRACT_ADDRESS,
  ESDT_STAKING_CONTRACT_NAME,
  TOKEN_ID,
  TOKEN_DECIMAL,
  GATEWAY,
  YEARLY_TOKEN_DISTRIBUTION
} from 'config';
import { SECOND_IN_MILLI } from 'utils/const';

import { convertWeiToEgld, convertTimestampToDays } from 'utils/convert';

import './index.scss';

const Home = () => {
  const { address } = useGetAccountInfo();
  const isLoggedIn = Boolean(address);
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { network } = useGetNetworkConfig();
  const networkProvider = new ApiNetworkProvider(network.apiAddress);

  // load smart contract abi and parse it to SmartContract object for tx
  const [contractInteractor, setContractInteractor] = useState<any>(undefined);
  useEffect(() => {
    const ABI = esdtAbi as any;
    // console.log(ABI);
    (async () => {
      const abiRegistry = AbiRegistry.create(ABI);
      const abi = new SmartContractAbi(abiRegistry, [
        ESDT_STAKING_CONTRACT_NAME
      ]);
      const contract = new SmartContract({
        address: new Address(ESDT_STAKING_CONTRACT_ADDRESS),
        abi: abi
      });
      setContractInteractor(contract);
    })();
  }, []); // [] makes useEffect run once

  const [cyberBalance, setCyberBalance] = useState(0);
  const [stakingStatus, setStakingStatus] = useState<any>();
  const [accountStatus, setAccountStatus] = useState<any>();
  const [baseApr, setBaseApr] = useState(0);
  useEffect(() => {
    (async () => {
      if (!isLoggedIn) return;

      try {
        const url = GATEWAY + '/accounts/' + address + '/tokens/' + TOKEN_ID;
        const response: any = await axios.get(url);
        const token = response.data;
        const balance = token['balance'] / Math.pow(10, token['decimals']);
        // console.log(balance);
        setCyberBalance(Math.floor(balance * 100) / 100);
      } catch (error) {
        setCyberBalance(0);
      }

    })();

    (async () => {
      if (!contractInteractor) return;

      const query = contractInteractor.createQuery({
        func: new ContractFunction('getStakingStatus')
      });
      const resultsParser = new ResultsParser();
      const response = await networkProvider.queryContract(query);
      const endpointDefinition =
        contractInteractor.getEndpoint('getStakingStatus');
      const res = resultsParser.parseQueryResponse(
        response,
        endpointDefinition
      );
      const value = res.firstValue?.valueOf();

      const status = {
        stake_token_id: value.stake_token_id.toString(),
        reward_token_id: value.reward_token_id.toString(),
        unbond_duration: value.unbond_duration.toNumber() * SECOND_IN_MILLI,
        total_stake_balance: convertWeiToEgld(
          value.total_stake_balance.toNumber(),
          TOKEN_DECIMAL
        )
      };
      // console.log(status);
      setStakingStatus(status);
      const apr =
        (YEARLY_TOKEN_DISTRIBUTION / status.total_stake_balance) * 100;
      setBaseApr(apr);
    })();

    (async () => {
      if (!contractInteractor) return;

      if (isLoggedIn) {
        const query = contractInteractor.createQuery({
          func: new ContractFunction('getAccountState'),
          args: [new AddressValue(new Address(address))]
        });
        const resultsParser = new ResultsParser();
        const response = await networkProvider.queryContract(query);
        const endpointDefinition =
          contractInteractor.getEndpoint('getAccountState');
        const res = resultsParser.parseQueryResponse(
          response,
          endpointDefinition
        );
        const value = res.firstValue?.valueOf();

        const status = {
          user_stake_balance: convertWeiToEgld(
            value.user_stake_balance.toNumber(),
            TOKEN_DECIMAL
          ),
          user_rewards: convertWeiToEgld(
            value.user_rewards.toNumber(),
            TOKEN_DECIMAL
          ),
          user_unbonding_balance: convertWeiToEgld(
            value.user_unbonding_balance.toNumber(),
            TOKEN_DECIMAL
          ),
          user_unbonded_balance: convertWeiToEgld(
            value.user_unbonded_balance.toNumber(),
            TOKEN_DECIMAL
          ),
          user_unbonding_start_timestamp:
            value.user_unbonding_start_timestamp.toNumber() * SECOND_IN_MILLI,
          user_unbonding_end_timestamp:
            value.user_unbonding_end_timestamp.toNumber() * SECOND_IN_MILLI,
          apr: value.apr.toNumber() / 100
        };
        // console.log(status);
        setAccountStatus(status);
      }
    })();
  }, [contractInteractor, hasPendingTransactions]);

  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [isStakeModal, setIsStakeModal] = React.useState<boolean>(true);
  const [value, setValue] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInput = (e: any) => {
    const value = e.target.value;
    if (isStakeModal) {
      if (value > cyberBalance) {
        setErrorMsg('The amount you are trying to stake is too high');
      } else {
        setErrorMsg('');
      }
    } else {
      if (value > accountStatus?.user_stake_balance) {
        setErrorMsg('The amount you are trying to unstake is too high');
      } else {
        setErrorMsg('');
      }
    }
    setValue(e.target.value);
  };

  const handleMax = () => {
    let maxPurchase = 0;
    if (isStakeModal) {
      maxPurchase = cyberBalance;
    } else {
      maxPurchase = accountStatus?.user_stake_balance;
    }
    setValue(maxPurchase);
  };

  function onShowStakeModal() {
    if (!address) {
      // onShowAlertModal('You should connect your wallet first!');
      return;
    }
    setIsStakeModal(true);
    setShowModal(true);
  }

  function onShowUnstakeModal() {
    if (!address) {
      // onShowAlertModal('You should connect your wallet first!');
      return;
    }
    setIsStakeModal(false);
    setShowModal(true);
  }

  async function handleStake() {
    //
    if (value <= 0 || value > cyberBalance) {
      setErrorMsg('The amount is not valid');
      return;
    }

    const stakeAmount = new BigNumber(value).multipliedBy(
      Math.pow(10, TOKEN_DECIMAL)
    );

    const args: TypedValue[] = [
      BytesValue.fromUTF8(TOKEN_ID),
      new BigUIntValue(stakeAmount.valueOf()),
      BytesValue.fromUTF8('stake')
    ];

    const { argumentsString } = new ArgSerializer().valuesToString(args);
    const data = new TransactionPayload(`ESDTTransfer@${argumentsString}`);
    const tx = {
      receiver: ESDT_STAKING_CONTRACT_ADDRESS,
      gasLimit: 10000000,
      data: data.toString(),
      value: 0
    };
    await refreshAccount();

    await sendTransactions({
      transactions: tx,
      transactionsDisplayInfo: {
        processingMessage: 'Processing Staking transaction',
        errorMessage: 'An error has occured during Staking',
        successMessage: 'Staking transaction successful'
      },
      redirectAfterSign: false
    });

    setShowModal(false);
  }

  async function handleUnstake() {
    if (value > accountStatus?.user_stake_balance || value <= 0) {
      setErrorMsg('The amount is not valid');
      return;
    }

    let tx;
    if (
      Number(value).toFixed(2) == accountStatus?.user_stake_balance.toFixed(2)
    ) {
      tx = {
        data: 'unstake',
        gasLimit: 10000000,
        value: 0,
        receiver: ESDT_STAKING_CONTRACT_ADDRESS
      };
    } else {
      const unstakeAmount = new BigNumber(value).multipliedBy(
        Math.pow(10, TOKEN_DECIMAL)
      );

      const args: TypedValue[] = [new BigUIntValue(unstakeAmount.valueOf())];

      const { argumentsString } = new ArgSerializer().valuesToString(args);
      const data = new TransactionPayload(`unstake@${argumentsString}`);

      tx = {
        data: data.toString(),
        gasLimit: 10000000,
        value: 0,
        receiver: ESDT_STAKING_CONTRACT_ADDRESS
      };
    }

    await refreshAccount();
    await sendTransactions({
      transactions: tx,
      transactionsDisplayInfo: {
        processingMessage: 'Processing Unstake transaction',
        errorMessage: 'An error has occured during Unstake',
        successMessage: 'Unstake transaction successful'
      },
      redirectAfterSign: false
    });

    setShowModal(false);
  }

  async function reinvest() {
    if (!address) {
      // onShowAlertModal('You should connect your wallet first!');
      return;
    }

    if (accountStatus.user_rewards > 0) {
      const tx = {
        receiver: ESDT_STAKING_CONTRACT_ADDRESS,
        data: 'reinvest',
        value: 0,
        gasLimit: 6000000
      };

      await refreshAccount();
      await sendTransactions({
        transactions: tx
      });
    } else {
      // onShowAlertModal('You don\'t have rewards.');
    }
  }

  async function claim() {
    if (!address) {
      // onShowAlertModal('You should connect your wallet first!');
      return;
    }

    const tx = {
      receiver: ESDT_STAKING_CONTRACT_ADDRESS,
      data: 'claim',
      value: 0,
      gasLimit: 10000000
    };

    await refreshAccount();
    await sendTransactions({
      transactions: tx
    });
  }

  return (
    <div className='container'>
      <Row>
        <Col lg={6} md={6} sm={12} className='container-left'>
          <h1 className='cpc-styled'>Stake your CYBER</h1>
          <p>
            The purpose of &apos;CYBER token staking&apos; is to create a
            revenue model while relieving investors of selling pressure.
          </p>

          <p>
            <span style={{ fontWeight: 'bold' }}>Q:</span> What is the APR?
            <br />
            <span style={{ fontWeight: 'bold' }}>A:</span> With CYBER token stake, 20M CYBER will be distributed over 6 years. So when we do the math, we see the staking SC generates 0.1057 CYBER every second, which will be distributed to the stakers according to their share. Formula:
            <br />— <span style={{ fontWeight: 'bold' }}>Pool Share</span> =
            Your Staked CYBER / Total Staked CYBER
            <br />—{' '}
            <span style={{ fontWeight: 'bold' }}>
              Yearly Distributed CYBER
            </span>{' '}
            = 20,000,000 / 6 = 3,333,333 CYBER
            <br />— <span style={{ fontWeight: 'bold' }}>APR</span> = YDC /
            Total Staked CYBER
            <br />— <span style={{ fontWeight: 'bold' }}>
              TOTAL STAKED:
            </span>{' '}
            Total amount of staked CYBER.
            <br />
            <br />
            <span style={{ fontWeight: 'bold' }}>NOTICE:</span> The unbonding period is 5 days. Every unstaking operation will reset the duration.
          </p>

          <div className='container-left-buttons'>
            <a
              href='https://xexchange.com/swap'
              target='_blank'
              rel='noreferrer'
            >
              <button>BUY CYBER</button>
            </a>
            <a
              href='https://cyberpunkcity.com'
            >
              <button className='ml-3'>
                GO TO HOMEPAGE
              </button>
            </a>
          </div>
        </Col>
        <Col lg={6} md={6} sm={12}>
          <div className='container-token-staking'>
            <div className='row mb-5'>
              <div className='col-6 text-left'>
                <div className='row-title static'>TOTAL STAKED</div>
                <div className='row-body'>
                  {stakingStatus
                    ? stakingStatus.total_stake_balance.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )
                    : '-'}{' '}
                  $CYBER
                </div>
              </div>
              <div className='col-6 text-right'>
                <div className='row-title static'>APR</div>
                <div className='row-body'>
                  {accountStatus
                    ? accountStatus.apr.toFixed(2)
                    : baseApr.toFixed(2)}{' '}
                  %
                </div>
              </div>
            </div>
            <div className='row mb-5'>
              <div className='col-6 text-left'>
                <div className='row-title'>MY BALANCE</div>
                <div className='row-body'>
                  {cyberBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  $CYBER
                </div>
                <button
                  className='is-style-cpc-btn-styled stake'
                  onClick={onShowStakeModal}
                >
                  STAKE
                </button>
              </div>
              <div className='col-6 text-right'>
                <div className='row-title'>MY STAKED</div>
                <div className='row-body'>
                  {accountStatus
                    ? accountStatus.user_stake_balance.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )
                    : '-'}
                </div>
                <button
                  className='is-style-cpc-btn-styled unstake'
                  onClick={onShowUnstakeModal}
                >
                  UNSTAKE
                </button>
              </div>
            </div>
            <div className='row mb-4'>
              <div className='col-6 text-left'>
                <div className='row-title'>MY EARNED</div>
                <div className='row-body'>
                  {accountStatus
                    ? accountStatus.user_rewards.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                    : '-'}
                </div>
                <button
                  className='is-style-cpc-btn-styled reinvest'
                  onClick={reinvest}
                >
                  REINVEST
                </button>
                <button
                  className='is-style-cpc-btn-styled harvest'
                  onClick={claim}
                >
                  HARVEST
                </button>
              </div>
              <div className='col-6 text-right'>
                <div className='row-title'>MY UNBONDING</div>
                <div className='row-body'>
                  {accountStatus
                    ? accountStatus.user_unbonding_balance.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )
                    : '-'}
                </div>
                <div className='days-left'>
                  {accountStatus
                    ? accountStatus.user_unbonding_end_timestamp > Date.now()
                      ? convertTimestampToDays(
                        accountStatus.user_unbonding_end_timestamp -
                        Date.now()
                      )
                      : 0
                    : '-'}{' '}
                  days left
                </div>
                {/* <div className='days-left'>
                  {stakingStatus
                    ? convertTimestampToDays(stakingStatus.unbond_duration)
                    : '-'}{' '}
                  days left
                </div>*/}
                <div className='row-title'>UNCLAIMED</div>
                <div className='row-body'>
                  {accountStatus
                    ? accountStatus.user_unbonded_balance.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )
                    : '-'}
                </div>
                <button
                  className='is-style-cpc-btn-styled claim'
                  onClick={claim}
                >
                  CLAIM
                </button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
        centered
      >
        <Modal.Body>
          <>
            {isStakeModal ? (
              <div className='title'>
                MY BALANCE:
                <br />{' '}
                {cyberBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{' '}
                CYBER
              </div>
            ) : (
              <div className='title'>
                MY STAKED:
                <br />{' '}
                {accountStatus
                  ? accountStatus.user_stake_balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })
                  : '-'}{' '}
                CYBER
              </div>
            )}
            <div className='modal-action'>
              <div className='staking-amount-input'>
                <input
                  type='text'
                  placeholder='amount'
                  value={value}
                  onChange={handleInput}
                />
                <div
                  className='staking-amount-input-text-max'
                  onClick={handleMax}
                >
                  MAX
                </div>
              </div>
              <div className='col-12'>
                <span className='error-message'>{errorMsg}</span>
              </div>
              {isStakeModal ? (
                <button
                  className='is-style-cpc-btn-styled stake'
                  onClick={handleStake}
                >
                  STAKE
                </button>
              ) : (
                <button
                  className='is-style-cpc-btn-styled unstake'
                  onClick={handleUnstake}
                >
                  UNSTAKE
                </button>
              )}
            </div>
          </>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Home;
