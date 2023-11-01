import { toJson } from './serializer';
import {
  num,
  DeployContractResponse,
  RawCalldata,
  validateAndParseAddress as _validateAndParseAddress,
} from 'starknet';
import { Network } from '../types/snapState';
import { ETHER_MAINNET, ETHER_TESTNET } from './constants';
import { logger } from './logger';
import { ethers } from 'ethers';
import {
  callContract,
  estimateAccountDeployFee,
  deployAccount,
  getAccContractAddressAndCallData,
  isAccountDeployed,
} from './starknetUtils';

export const getEthBalance = async (network: Network, contractAddress: string) => {
  switch (network.chainId) {
    case ETHER_MAINNET.chainId:
      return await callContract(network, ETHER_MAINNET.address, 'balanceOf', [
        num.toBigInt(contractAddress).toString(10),
      ]);
    case ETHER_TESTNET.chainId:
      return await callContract(network, ETHER_TESTNET.address, 'balanceOf', [
        num.toBigInt(contractAddress).toString(10),
      ]);
  }
  throw new Error('network not supported');
};

export const canDeploy = async (
  network: Network,
  contractAddress: string,
  contractCallData: RawCalldata,
  publicKey: string,
  privateKey: string,
): Promise<{
  result: boolean;
  suggestedMaxFee: number;
}> => {
  const getBalanceResp = await getEthBalance(network, contractAddress);

  logger.log(`canDeploy:\ngetBalanceResp: ${toJson(getBalanceResp)}`);

  const estimateDeployFee = await estimateAccountDeployFee(
    network,
    contractAddress,
    contractCallData,
    publicKey,
    privateKey,
  );

  logger.log(`canDeploy:\nestimateDeployFee: ${toJson(estimateDeployFee)}`);

  if (Number(getBalanceResp.result[0]) < Number(estimateDeployFee.suggestedMaxFee)) {
    return {
      result: false,
      suggestedMaxFee: Number(estimateDeployFee.suggestedMaxFee),
    };
  }

  return {
    result: true,
    suggestedMaxFee: Number(estimateDeployFee.suggestedMaxFee),
  };
};

export const createAccountIfNot = async (
  network: Network,
  publicKey: string,
  privateKey: string,
): Promise<DeployContractResponse> => {
  const accountDeployed = await isAccountDeployed(network, publicKey);

  const { address: contractAddress, callData: contractCallData } = getAccContractAddressAndCallData(
    network.accountClassHash,
    publicKey,
  );

  if (!accountDeployed) {
    const { result: hasEnoughBalance, suggestedMaxFee } = await canDeploy(
      network,
      contractAddress,
      contractCallData,
      publicKey,
      privateKey,
    );

    logger.log(`createAccountIfNot:\nhasEnoughBalance: ${hasEnoughBalance}`);

    if (!hasEnoughBalance) {
      const gasFeeStr = ethers.utils.formatUnits(suggestedMaxFee.toString(10), 18);
      const gasFeeFloat = parseFloat(gasFeeStr).toFixed(6); // 6 decimal places for ether
      const gasFeeInEther = Number(gasFeeFloat) === 0 ? '0.000001' : gasFeeFloat;
      throw new Error(`The account address needs to hold at least ${gasFeeInEther} ETH for deploy fee`);
    }

    return await deployAccount(network, contractAddress, contractCallData, publicKey, privateKey, suggestedMaxFee);
  }

  return {
    contract_address: contractAddress,
    transaction_hash: null,
  };
};
