import React, { useState, useEffect } from 'react';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { useGetNetworkConfig, useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks';
import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { refreshAccount } from '@multiversx/sdk-dapp/utils';
import {
  Account,
  TransactionPayload,
  Address,
  SmartContract,
  AbiRegistry,
  BigUIntValue,
  ContractFunction,
  AddressValue,
  SmartContractAbi,
  ResultsParser,
  TokenPayment,
  TypedValue,
  BytesValue,
  ArgSerializer
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import axios from 'axios';
import { Tabs, Tab } from 'react-bootstrap';
import { Row, Col } from 'react-bootstrap';
import sftAbi from 'abi/sft/city-staking-sc.abi.json';
import Card from 'components/Card';
import {
  SFT_STAKING_CONTRACT_ADDRESS,
  SFT_STAKING_CONTRACT_NAME,
  TOKEN_DECIMAL,
  GATEWAY,
  SFT_COLLECTION_ID,
  IS_DEV,
  YEARLY_TOKEN_DISTRIBUTION
} from 'config';
import { SECOND_IN_MILLI } from 'utils/const';

import { convertWeiToEgld, convertTimestampToDays } from 'utils/convert';

import './index.scss';

const Sft = () => {
  const { address } = useGetAccountInfo();
  const isLoggedIn = Boolean(address);
  const { hasPendingTransactions } = useGetPendingTransactions();
  const { network } = useGetNetworkConfig();
  const networkProvider = new ApiNetworkProvider(network.apiAddress);

  // load smart contract abi and parse it to SmartContract object for tx
  const [contractInteractor, setContractInteractor] = useState<any>(undefined);
  useEffect(() => {
    const ABI = sftAbi as any;
    // console.log(ABI);
    (async () => {
      const abiRegistry = AbiRegistry.create(ABI);
      const abi = new SmartContractAbi(abiRegistry, [
        SFT_STAKING_CONTRACT_NAME
      ]);
      const contract = new SmartContract({
        address: new Address(SFT_STAKING_CONTRACT_ADDRESS),
        abi: abi
      });
      setContractInteractor(contract);
    })();
  }, []); // [] makes useEffect run once

  const [status, setStatus] = useState(1);
  const [sftDatas, setSftDatas] = useState<any>();
  const [stakingStatus, setStakingStatus] = useState<any>();
  const [accountStatus, setAccountStatus] = useState<any>();
  const [userWalletAmount, setUserWalletAmount] = useState(0);
  const [userStakedAmount, setUserStakedAmount] = useState(0);
  const [userUnbondingAmount, setUserUnbondingAmount] = useState(0);
  const [userUnbonedAmount, setUserUnbondedAmount] = useState(0);
  const [baseApr, setBaseApr] = useState(0);

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get(
          `${GATEWAY}/accounts/${address}/nfts?from=0&size=500&collection=${SFT_COLLECTION_ID}`
        )
        .then((res) => {
          // console.log(res);
          if (res.status === 200 && res?.data?.length > 0) {
            let walletAmount = 0;
            const items: any = [];
            res.data.map((item: any) => {
              const status = {
                user_staked_nft_balance: 0,
                user_pool_score: 0,
                user_rewards: 0,
                nft_nonce: item.nonce,
                user_current_amount_per_nonce: item.balance,
                user_staked_amount_per_nonce: 0,
                user_unbonding_amount_per_nonce: 0,
                user_unbonded_amount_per_nonce: 0,
                user_unbonding_start_timestamp_per_nonce: 0,
                user_unbonding_end_timestamp_per_nonce: 0,
                apr: 0
              };

              walletAmount += parseInt(item.balance);
              items.push(status);
            });
            // console.log(items);
            setSftDatas(items);
            setUserWalletAmount(walletAmount);
          } else {
            setSftDatas([]);
            setUserWalletAmount(0);
          }
        });
    }

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
        stake_nft_token_id: value.stake_nft_token_id.toString(),
        reward_token_id: value.reward_token_id.toString(),
        unbond_duration: value.unbond_duration.toNumber() * SECOND_IN_MILLI,
        total_nft_nonces: value.total_nft_nonces.toNumber(),
        bonus_points: value.bonus_points.toNumber() / 10000,
        total_staked_nft_balance: value.total_staked_nft_balance.toNumber(),
        total_pool_score: value.total_pool_score.toNumber(),
        nft_price: convertWeiToEgld(value.nft_price.toNumber(), TOKEN_DECIMAL)
      };
      // console.log(status);
      setStakingStatus(status);

      const apr = YEARLY_TOKEN_DISTRIBUTION / status.total_pool_score / 10;
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

        let stakedAmount = 0;
        let unbondingAmount = 0;
        let unbondedAmount = 0;
        const items: any = [];
        value.map((item: any) => {
          const status = {
            user_staked_nft_balance: item.user_staked_nft_balance.toNumber(),
            user_pool_score: item.user_pool_score.toNumber(),
            user_rewards: convertWeiToEgld(
              item.user_rewards.toNumber(),
              TOKEN_DECIMAL
            ),
            nft_nonce: item.nft_nonce.toNumber(),
            user_current_amount_per_nonce: 0,
            user_staked_amount_per_nonce:
              item.user_staked_amount_per_nonce.toNumber(),
            user_unbonding_amount_per_nonce:
              item.user_unbonding_amount_per_nonce.toNumber(),
            user_unbonded_amount_per_nonce:
              item.user_unbonded_amount_per_nonce.toNumber(),
            user_unbonding_start_timestamp_per_nonce:
              item.user_unbonding_start_timestamp_per_nonce.toNumber() *
              SECOND_IN_MILLI,
            user_unbonding_end_timestamp_per_nonce:
              item.user_unbonding_end_timestamp_per_nonce.toNumber() *
              SECOND_IN_MILLI,
            apr: item.apr.toNumber() / 100
          };

          items.push(status);
          stakedAmount += item.user_staked_amount_per_nonce.toNumber();
          unbondingAmount += item.user_unbonding_amount_per_nonce.toNumber();
          unbondedAmount += item.user_unbonded_amount_per_nonce.toNumber();
        });
        // console.log(items);
        setAccountStatus(items);

        setUserStakedAmount(stakedAmount);
        setUserUnbondingAmount(unbondingAmount);
        setUserUnbondedAmount(unbondedAmount);
      }
    })();
  }, [contractInteractor, hasPendingTransactions]);

  const handleClaimReward = async () => {
    const tx = {
      receiver: SFT_STAKING_CONTRACT_ADDRESS,
      data: 'claimReward',
      value: 0,
      gasLimit: 10000000
    };

    await refreshAccount();
    await sendTransactions({
      transactions: tx
    });
  };

  const handleStakeAll = async () => {
    // stake
    const token_payments: TokenPayment[] = [];
    sftDatas.forEach((element: any) => {
      // const integer = parseInt(element.nonce, 16);
      token_payments.push(
        TokenPayment.semiFungible(
          SFT_COLLECTION_ID,
          element.nft_nonce,
          element.user_current_amount_per_nonce
        )
      );
    });
    let gas = 10000000 + 4000000 * sftDatas.length;
    if (gas > 600000000) gas = 600000000;

    const userAccount = new Account(new Address(address));
    const tx = contractInteractor.methods
      .stake()
      .withNonce(userAccount.nonce)
      .withGasLimit(gas)
      .withChainID(IS_DEV ? 'D' : '1')
      .withMultiESDTNFTTransfer(token_payments, new Address(address))
      .buildTransaction();

    await refreshAccount();

    await sendTransactions({
      transactions: [tx]
    });
  };

  const handleUnstakeAll = async () => {
    // unstake
    const args: TypedValue[] = [];
    let len = 0;
    accountStatus?.map((item: any, index: any) => {
      if (item?.user_staked_amount_per_nonce > 0) {
        args.push(BytesValue.fromUTF8(SFT_COLLECTION_ID));
        args.push(new BigUIntValue(item?.nft_nonce.valueOf()));
        args.push(
          new BigUIntValue(item?.user_staked_amount_per_nonce.valueOf())
        );
        len++;
      }
    });

    const { argumentsString } = new ArgSerializer().valuesToString(args);
    const data = new TransactionPayload(`unstake@${argumentsString}`);
    let gas = 10000000 + 4000000 * len;
    if (gas > 600000000) gas = 600000000;
    const tx = {
      receiver: SFT_STAKING_CONTRACT_ADDRESS,
      gasLimit: gas,
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
  };

  const handleUnbondAll = async () => {
    // claim nfts
    const args: TypedValue[] = [];
    let len = 0;
    accountStatus?.map((item: any, index: any) => {
      if (item?.user_unbonded_amount_per_nonce > 0) {
        args.push(BytesValue.fromUTF8(SFT_COLLECTION_ID));
        args.push(new BigUIntValue(item?.nft_nonce.valueOf()));
        args.push(
          new BigUIntValue(item?.user_unbonded_amount_per_nonce.valueOf())
        );
        len++;
      }
    });

    const { argumentsString } = new ArgSerializer().valuesToString(args);
    const data = new TransactionPayload(`claimNft@${argumentsString}`);
    let gas = 10000000 + 4000000 * len;
    if (gas > 600000000) gas = 600000000;
    const tx = {
      receiver: SFT_STAKING_CONTRACT_ADDRESS,
      gasLimit: gas,
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
  };

  return (
    <div className='container'>
      <Row>
        <Col lg={6} md={6} sm={12} className='container-left'>
          <h1 className='cpc-styled'>Stake your CityNFTs</h1>
          <p>
          Staking a building awards 1 point, and the total score will be determined by the total number of buildings the staker has placed.
          </p>

          <p>
            The formula to be used to calculate stake income is as follows:
            <br />— <span style={{ fontWeight: 'bold' }}>Pool Share</span> =
            User Score / Total Pool Score
            <br />—{' '}
            <span style={{ fontWeight: 'bold' }}>
              Yearly Distributed Token
            </span>{' '}
            = 20,000,000 / 6 Years = 3,333,333 CYBER
            <br />
            <br />
            <span style={{ fontWeight: 'bold' }}>NOTICE:</span> The unbonding period is 5 days. Every unstaking operation will reset the duration. If a user has all 14 different buildings, they will get a 1.5x score multiplier.
          </p>

          <div className='container-left-buttons'>
            <a
              href='https://xoxno.com/collection/CITYNFT-26cded'
              target='_blank'
              rel='noreferrer'
            >
              <button>BUY CityNFT</button>
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
                  {' '}
                  {stakingStatus
                    ? stakingStatus.total_staked_nft_balance
                    : '-'}{' '}
                  CityNFT
                </div>
              </div>
              <div className='col-6 text-right'>
                <div className='row-title static'>APR</div>
                <div className='row-body'>
                  {accountStatus
                    ? accountStatus[0].apr.toFixed(2)
                    : baseApr.toFixed(2)}{' '}
                  %
                </div>
              </div>
            </div>
            <div className='row mb-4'>
              <div className='col-6 text-left'>
                <div className='row-title static'>TOTAL SCORE</div>
                <div className='row-body'>
                  {' '}
                  {stakingStatus ? stakingStatus.total_pool_score : '-'}
                </div>
              </div>
              <div className='col-6 text-right'>
                <div className='row-title'>MY STAKED NFTs</div>
                <div className='row-body'>
                  {' '}
                  {accountStatus
                    ? accountStatus[0].user_staked_nft_balance
                    : '-'}
                </div>
                <div className='row-title'>MY SCORE</div>
                <div className='row-body'>
                  {accountStatus ? accountStatus[0].user_pool_score : '-'}
                </div>
                <div className='row-title'>MY REWARDS</div>
                <div className='row-body'>
                  {' '}
                  {accountStatus
                    ? accountStatus[0].user_rewards.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : '-'}
                </div>
                <button
                  className='is-style-cpc-btn-styled claim-reward'
                  onClick={handleClaimReward}
                >
                  CLAIM REWARD
                </button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col lg={12} className='mt-5 mb-5 sft-staking-status'>
          <Tabs defaultActiveKey={1} id='uncontrolled-tab-example'>
            <Tab eventKey={1} title={`WALLET (${userWalletAmount})`} onClick={() => setStatus(1)}>
              <div className='row tab-1'>
                <div className='col-12 nft-tab'>
                  <div className='row mt-3 d-flex justify-content-end'>
                    {sftDatas?.length > 0 ? (
                      <button
                        className='is-style-cpc-btn-styled stake'
                        onClick={handleStakeAll}
                      >
                        STAKE ALL
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className='row'>
                    {sftDatas?.map((item: any, index: any) => {
                      return (
                        <Col
                          lg={3}
                          md={4}
                          sm={6}
                          className='container-right mt-5 mb-5'
                          key={index}
                        >
                          <Card item={item} status={1} />
                        </Col>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Tab>
            <Tab eventKey={2} title={`STAKED (${userStakedAmount})`} onClick={() => setStatus(2)}>
              <div className='row tab-2'>
                <div className='col-12 nft-tab'>
                  <div className='row mt-3 d-flex justify-content-end'>
                    {accountStatus &&
                    accountStatus[0]?.user_staked_nft_balance > 0 ? (
                      <button
                        className='is-style-cpc-btn-styled unstake'
                        onClick={handleUnstakeAll}
                      >
                        UNSTAKE ALL
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className='row'>
                    {accountStatus?.map((item: any, index: any) => {
                      if (item?.user_staked_amount_per_nonce > 0) {
                        return (
                          <Col
                            lg={3}
                            md={4}
                            sm={6}
                            className='container-right mt-5 mb-5'
                            key={index}
                          >
                            <Card item={item} status={2} />
                          </Col>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            </Tab>
            <Tab eventKey={3} title={`UNBONDING (${userUnbondingAmount})`} onClick={() => setStatus(3)}>
              <div className='row tab-2'>
                <div className='col-12 nft-tab'>
                  <div className='row mt-3'>
                    {accountStatus?.map((item: any, index: any) => {
                      if (item?.user_unbonding_amount_per_nonce > 0) {
                        return (
                          <Col
                            lg={3}
                            md={4}
                            sm={6}
                            className='container-right mt-5 mb-5'
                            key={index}
                          >
                            <Card item={item} status={3} />
                          </Col>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            </Tab>
            <Tab eventKey={4} title={`UNBONDED (${userUnbonedAmount})`} onClick={() => setStatus(4)}>
              <div className='row tab-2'>
                <div className='col-12 nft-tab'>
                  <div className='row mt-3 d-flex justify-content-end'>
                    {userUnbonedAmount > 0 ? (
                      <button
                        className='is-style-cpc-btn-styled claim'
                        onClick={handleUnbondAll}
                      >
                        WITHDRAW ALL
                      </button>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className='row'>
                    {accountStatus?.map((item: any, index: any) => {
                      if (item?.user_unbonded_amount_per_nonce > 0) {
                        return (
                          <Col
                            lg={3}
                            md={4}
                            sm={6}
                            className='container-right mt-5 mb-5'
                            key={index}
                          >
                            <Card item={item} status={4} />
                          </Col>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default Sft;
