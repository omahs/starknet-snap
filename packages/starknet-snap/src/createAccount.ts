//import { CompiledContract, hash, json, number, stark } from 'starknet';
//import compiledProxy from './contracts/Proxy.json';
//import compiledProxyCompressed from './contracts/ProxyCompressed.json';
import {
  getKeysFromAddressIndex,
  getAccContractAddressAndCallData,
  deployContract,
  //postData,
} from './utils/starknetUtils';
import {
  //getAddTransactionUrl,
  getNetworkFromChainId,
  getValidNumber,
  upsertAccount,
  upsertTransaction,
} from './utils/snapUtils';
import {
  AccContract,
  VoyagerTransactionType,
  Transaction,
  TransactionStatus,
  //TransactionType,
} from './types/snapState';
import { ApiParams, CreateAccountRequestParams } from './types/snapApi';
//import { AddTransactionResponse } from 'starknet/dist/types/api';
import {
  PROXY_CONTRACT_STR,
  //TRANSACTION_RECEIVED,
} from './utils/constants';

export async function createAccount(params: ApiParams) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;

    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    //const compiledContract = JSON.stringify(compiledProxy as CompiledContract);
    const compiledContract = PROXY_CONTRACT_STR;
    //console.log(`createAccount:\ncompiledContract = ${compiledContract}`);
    // const compiledContractCompressed = compiledProxyCompressed;
    // const contractDefinition = {
    //   ...compiledContract,
    //   program: compiledContractCompressed.program,
    // };

    const {
      publicKey,
      addressIndex: addressIndexInUsed,
      derivationPath,
    } = await getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
    const { address: contractAddress, callData: contractCallData } = getAccContractAddressAndCallData(
      network.accountClassHash,
      publicKey,
    );
    console.log(
      `createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    //const compressedProgram = stark.compressProgram(compiledContract.program);
    // console.log(`createAccount:\ncompressedProgram:\n${compressedProgram}`);
    // return null;

    const deployResp = await deployContract(network, compiledContract, contractCallData, publicKey);

    // const deployData = {
    //   type: TransactionType.DEPLOY,
    //   contract_address_salt: publicKey,
    //   constructor_calldata: number.bigNumberishArrayToDecimalStringArray(contractCallData),
    //   contract_definition: contractDefinition,
    //   version: number.toHex(number.toBN(hash.transactionVersion)),
    // };
    // console.log(`createAccount:\ndeployData: ${json.stringify(deployData)}`);

    // const deployResp: AddTransactionResponse = await postData(getAddTransactionUrl(network), deployData);

    // const nodeDeployData =  {
    //   jsonrpc: '2.0',
    //   method: 'starknet_addDeployTransaction',
    //   params: [
    //     deployData.contract_address_salt,
    //     contractCallData.map(x => `0x${number.toBN(x).toString('hex')}`),
    //     contractDefinition
    //   ],
    //   id: 1
    // };
    // console.log(`createAccount:\nnodeDeployData: ${json.stringify(nodeDeployData)}`);

    // const deployResp = await postData('https://starknet-goerli.infura.io/v3/60c7253fb48147658095fe0460ac9ee9', nodeDeployData);

    //if (deployResp?.code === TRANSACTION_RECEIVED) {
    if (deployResp.contract_address && deployResp.transaction_hash) {
      const userAccount: AccContract = {
        addressSalt: publicKey,
        publicKey,
        //address: deployResp.address,
        address: deployResp.contract_address,
        addressIndex: addressIndexInUsed,
        derivationPath,
        deployTxnHash: deployResp.transaction_hash,
        chainId: network.chainId,
      };

      await upsertAccount(userAccount, wallet, saveMutex);

      const txn: Transaction = {
        txnHash: deployResp.transaction_hash,
        txnType: VoyagerTransactionType.DEPLOY,
        chainId: network.chainId,
        // senderAddress: deployResp.address,
        // contractAddress: deployResp.address,
        senderAddress: deployResp.contract_address,
        contractAddress: deployResp.contract_address,
        contractFuncName: '',
        contractCallData: [],
        status: TransactionStatus.RECEIVED,
        failureReason: '',
        eventIds: [],
        timestamp: Math.floor(Date.now() / 1000),
      };

      await upsertTransaction(txn, wallet, saveMutex);
    }

    console.log(`createAccount:\ndeployResp: ${JSON.stringify(deployResp)}`);

    return {
      address: deployResp.contract_address,
      transaction_hash: deployResp.transaction_hash,
    };
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
