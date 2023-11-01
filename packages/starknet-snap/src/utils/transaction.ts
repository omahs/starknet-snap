import { toJson } from './serializer';
import {
  EstimateFee,
  TransactionType,
  Invocations,
  validateAndParseAddress as _validateAndParseAddress,
} from 'starknet';
import { PROXY_CONTRACT_HASH } from './constants';
import { logger } from './logger';
import {
  isAccountDeployed,
  getAccContractAddressAndCallData,
  estimateFeeBulk,
  addFeesFromAllTransactions,
} from './starknetUtils';
import { Network } from '../types/snapState';

export const estimateFeeWIthDeploy = async (
  network: Network,
  publicKey: string,
  privateKey: string,
  senderAddress: string,
  invocations: Invocations,
): Promise<{
  estimateFee: EstimateFee;
  includeDeploy: boolean;
}> => {
  //Estimate deploy account fee if the signer has not been deployed yet
  const accountDeployed = await isAccountDeployed(network, publicKey);

  if (!accountDeployed) {
    const { callData } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);

    const deployAccountpayload = {
      classHash: PROXY_CONTRACT_HASH,
      contractAddress: senderAddress,
      constructorCalldata: callData,
      addressSalt: publicKey,
    };

    invocations = [
      ...invocations,
      {
        type: TransactionType.DEPLOY_ACCOUNT,
        payload: deployAccountpayload,
      },
    ];
  }

  const estimateBulkFeeResp = await estimateFeeBulk(network, senderAddress, privateKey, invocations);
  logger.log(`estimateFeeWIthDeploy:\nestimateBulkFeeResp: ${toJson(estimateBulkFeeResp)}`);
  const estimateFeeResp = addFeesFromAllTransactions(estimateBulkFeeResp);

  return {
    estimateFee: estimateFeeResp,
    includeDeploy: !accountDeployed,
  };
};
