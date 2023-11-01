import { toJson } from './utils/serializer';
import { getKeysFromAddressIndex, getAccContractAddressAndCallData } from './utils/starknetUtils';
import {
  getNetworkFromChainId,
  getValidNumber,
  upsertAccount,
  upsertTransaction,
  buildDeployTxn,
} from './utils/snapUtils';
import { createAccountIfNot } from './utils/account';
import { AccContract, Transaction } from './types/snapState';
import { ApiParams, CreateAccountRequestParams } from './types/snapApi';
import { DialogType } from '@metamask/rpc-methods';
import { heading, panel, text } from '@metamask/snaps-ui';
import { logger } from './utils/logger';

export async function createAccount(params: ApiParams, silentMode = false) {
  try {
    const { state, wallet, saveMutex, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as CreateAccountRequestParams;

    const addressIndex = getValidNumber(requestParamsObj.addressIndex, -1, 0);
    const network = getNetworkFromChainId(state, requestParamsObj.chainId);
    const deploy = !!requestParamsObj.deploy;

    const {
      privateKey,
      publicKey,
      addressIndex: addressIndexInUsed,
      derivationPath,
    } = await getKeysFromAddressIndex(keyDeriver, network.chainId, state, addressIndex);
    const { address: contractAddress } = getAccContractAddressAndCallData(network.accountClassHash, publicKey);
    logger.log(
      `createAccount:\ncontractAddress = ${contractAddress}\npublicKey = ${publicKey}\naddressIndex = ${addressIndexInUsed}`,
    );

    if (deploy) {
      if (!silentMode) {
        const response = await wallet.request({
          method: 'snap_dialog',
          params: {
            type: DialogType.Confirmation,
            content: panel([
              heading('Do you want to sign this deploy account transaction ?'),
              text(`It will be signed with address: ${contractAddress}`),
              text(
                `Account Info:\n\nAddress: ${contractAddress}\n\nPublic Key: ${publicKey}\n\nAddress Index: ${addressIndex}`,
              ),
            ]),
          },
        });
        if (!response)
          return {
            address: contractAddress,
          };
      }

      const deployResp = await createAccountIfNot(network, publicKey, privateKey);

      if (deployResp.contract_address && deployResp.transaction_hash) {
        const userAccount: AccContract = {
          addressSalt: publicKey,
          publicKey,
          address: deployResp.contract_address,
          addressIndex: addressIndexInUsed,
          derivationPath,
          deployTxnHash: deployResp.transaction_hash,
          chainId: network.chainId,
        };

        await upsertAccount(userAccount, wallet, saveMutex);

        const txn: Transaction = buildDeployTxn(network, deployResp.transaction_hash, deployResp.contract_address);

        await upsertTransaction(txn, wallet, saveMutex);
      }

      logger.log(`createAccount:\ndeployResp: ${toJson(deployResp)}`);

      return {
        address: deployResp.contract_address,
        transaction_hash: deployResp.transaction_hash,
      };
    }
    return {
      address: contractAddress,
    };
  } catch (err) {
    logger.error(`Problem found: ${err}`);
    throw err;
  }
}
