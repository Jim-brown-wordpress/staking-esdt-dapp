import React, { useState } from 'react';
import { useGetNetworkConfig, useGetPendingTransactions } from '@multiversx/sdk-dapp/hooks';
import {
  Address,
  SmartContract,
  AbiRegistry,
  ContractFunction,
  AddressValue,
  SmartContractAbi,
  ResultsParser
} from '@multiversx/sdk-core/out';
import { ApiNetworkProvider } from '@multiversx/sdk-network-providers/out';
import axios from 'axios';
import { Row, Col } from 'react-bootstrap';
import esdtAbi from 'abi/esdt/city-staking-sc.abi.json';
import sftAbi from 'abi/sft/city-staking-sc.abi.json';
import {
  SFT_STAKING_CONTRACT_ADDRESS,
  SFT_STAKING_CONTRACT_NAME,
  TOKEN_DECIMAL,
  GATEWAY,
  SFT_COLLECTION_ID,
  CITIZEN_SFT_ID,
  ESDT_STAKING_CONTRACT_NAME,
  ESDT_STAKING_CONTRACT_ADDRESS,
  TOKEN_ID,
} from 'config';
import { convertWeiToEgld } from 'utils/convert';

import './index.scss';

const Profile = () => {
  const { network } = useGetNetworkConfig();
  const networkProvider = new ApiNetworkProvider(network.apiAddress);

  const [cyberBalance, setCyberBalance] = useState(0);
  const [cyberStakedBalance, setCyberStakedBalance] = useState(0);
  const [sftDatas, setSftDatas] = useState<any>([]);
  const [citizenSftDatas, setCitizenSftDatas] = useState<any>([]);

  const [value, setValue] = useState<string>('');
  const handleInput = (e: any) => {
    setValue(e.target.value);
  };

  const handleClick = async () => {
    const userAddress = value.trim();
    console.log(userAddress);

    try {
      const url = GATEWAY + '/accounts/' + userAddress + '/tokens/' + TOKEN_ID;
      const response: any = await axios.get(url);
      if (response.status == 200) {
        const token = response.data;
        const balance = token['balance'] / Math.pow(10, token['decimals']);
        setCyberBalance(balance);
      }
    } catch (error) {
      console.log(error);
      setCyberBalance(0);
    }

    try {
      const ESDT_ABI = esdtAbi as any;
      const abiRegistry = AbiRegistry.create(ESDT_ABI);
      const abi = new SmartContractAbi(abiRegistry, [
        ESDT_STAKING_CONTRACT_NAME
      ]);
      const contract = new SmartContract({
        address: new Address(ESDT_STAKING_CONTRACT_ADDRESS),
        abi: abi
      });
      if (contract) {
        const query = contract.createQuery({
          func: new ContractFunction('getAccountState'),
          args: [new AddressValue(new Address(userAddress))]
        });
        const resultsParser = new ResultsParser();
        const responseQuery = await networkProvider.queryContract(query);
        const endpointDefinition = contract.getEndpoint('getAccountState');
        const res = resultsParser.parseQueryResponse(
          responseQuery,
          endpointDefinition
        );
        const values = res.firstValue?.valueOf();
        const stakedAmount = convertWeiToEgld(
          values.user_stake_balance.toNumber(),
          TOKEN_DECIMAL
        );
        setCyberStakedBalance(stakedAmount);
      }
    } catch (error) {
      console.log(error);
      setCyberStakedBalance(0);
    }

    const sfts: any = [
      {
        name: 'Hotel',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Airport',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Apartment',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Fire Dept.',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Gas Station',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Media Center',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Shopping M.',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Police St.',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Hospital',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Diner',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Residence',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Bus Station',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Night Club',
        wallet: 0,
        staked: 0
      },
      {
        name: 'Finance Cen.',
        wallet: 0,
        staked: 0
      }
    ];

    const sfts2: any = [
      {
        name: 'Lázaro',
        wallet: 0
      },
      {
        name: 'Kiera',
        wallet: 0
      },
      {
        name: 'Varujan',
        wallet: 0
      },
      {
        name: 'Jasna',
        wallet: 0
      },
      {
        name: 'HiMonkey',
        wallet: 0
      },
      {
        name: 'Aiko',
        wallet: 0
      },
      {
        name: 'Xerxes',
        wallet: 0
      },
      {
        name: 'Silena',
        wallet: 0
      },
      {
        name: 'Burton',
        wallet: 0
      },
      {
        name: 'Nisha',
        wallet: 0
      },
      {
        name: 'Bardrick',
        wallet: 0
      },
      {
        name: 'Layla',
        wallet: 0
      },
      {
        name: 'Unknown',
        wallet: 0
      },
      {
        name: 'Agrapina',
        wallet: 0
      },
      {
        name: 'Albert',
        wallet: 0
      }
    ];

    try {
      const response = await axios.get(
        `${GATEWAY}/accounts/${userAddress}/nfts?from=0&size=500&collections=${SFT_COLLECTION_ID},${CITIZEN_SFT_ID}`
      );

      console.log(response);
      if (response.status === 200 && response?.data?.length > 0) {
        response.data.map((item: any) => {
          if (item.collection == SFT_COLLECTION_ID) {
            sfts[item.nonce - 1].wallet = item.balance;
          } else {
            sfts2[item.nonce - 1].wallet = item.balance;
          }
        });
      }
    } catch (error) {
      console.log(error);
    }

    try {
      const ABI = sftAbi as any;
      const abiRegistry = AbiRegistry.create(ABI);
      const abi = new SmartContractAbi(abiRegistry, [
        SFT_STAKING_CONTRACT_NAME
      ]);
      const contract = new SmartContract({
        address: new Address(SFT_STAKING_CONTRACT_ADDRESS),
        abi: abi
      });
      if (contract) {
        const query = contract.createQuery({
          func: new ContractFunction('getAccountState'),
          args: [new AddressValue(new Address(userAddress))]
        });
        const resultsParser = new ResultsParser();
        const response = await networkProvider.queryContract(query);
        const endpointDefinition = contract.getEndpoint('getAccountState');
        const res = resultsParser.parseQueryResponse(
          response,
          endpointDefinition
        );
        const value = res.firstValue?.valueOf();

        value.map((item: any) => {
          sfts[item.nft_nonce.toNumber() - 1].staked =
            item.user_staked_amount_per_nonce.toNumber();
        });
      }
    } catch (error) {
      console.log(error);
    }

    setSftDatas(sfts);
    setCitizenSftDatas(sfts2);

    // try {
    //   const response = await axios.get(
    //     `${GATEWAY}/accounts/${userAddress}/nfts?from=0&size=500&collection=${CITIZEN_SFT_ID}`
    //   );

    //   if (response.status === 200 && response?.data?.length > 0) {
    //     console.log(response.data);
    //     setCitizenSftDatas(response.data);
    //   }
    // } catch (error) {
    //   console.log(error);
    // }
  };

  return (
    <div className='container-p mt-5 mb-5'>
      <div className='container-z py-4'>
        <Row>
          <div className='d-flex col-8'>
            <input
              type='text'
              onChange={handleInput}
              style={{ width: '100%' }}
            ></input>
          </div>
          <div className='d-flex col-4'>
            <button onClick={handleClick} style={{ width: '100%' }}>
              Get
            </button>
          </div>
        </Row>
        <Row className='m-5 d-flex justify-content-between text-center'>
          <div>
            <h3>WALLET</h3>
            <p>{cyberBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <h3>STAKE</h3>
            <p>{cyberStakedBalance.toLocaleString()}</p>
          </div>
        </Row>
        <Row>
          <Col md={8} sm={12} className='p-0'>
            <table className='table m-0'>
              <thead>
                <tr>
                  <td>
                    <h3 className='text-left'>CityNFT</h3>
                  </td>
                  <td>
                    <h3 className='text-center'>WALLET</h3>
                  </td>
                  <td>
                    <h3 className='text-center'>STAKE</h3>
                  </td>
                </tr>
              </thead>
              <tbody>
                {sftDatas?.map((item: any, index: any) => {
                  return (
                    <tr key={index}>
                      <td>
                        <p>{item.name}</p>
                      </td>
                      <td className='text-center'>
                        <p>{item.wallet}</p>
                      </td>
                      <td className='text-center'>
                        <p>{item.staked}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Col>
          <Col md={4} sm={12} className='p-0'>
            <table className='table m-0'>
              <thead>
                <tr>
                  <td>
                    <h3 className='text-left'>CitizenNFT</h3>
                  </td>
                  <td>
                    <h3 className='text-center'>WALLET</h3>
                  </td>
                </tr>
              </thead>
              <tbody>
                {citizenSftDatas?.map((item: any, index: any) => {
                  return (
                    <tr key={index}>
                      <td>
                        <p>{item.name}</p>
                      </td>
                      <td className='text-center'>
                        <p>{item.wallet}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Profile;
