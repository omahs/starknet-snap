import { validateAndParseAddress } from 'starknet';
import { ApiParams, ExtractPrivateKeyRequestParams } from './types/snapApi';
import { getNetworkFromChainId } from './utils/snapUtils';
import { getKeysFromAddress } from './utils/starknetUtils';

export async function extractPrivateKey(params: ApiParams) {
  try {
    const { state, snap, keyDeriver, requestParams } = params;
    const requestParamsObj = requestParams as ExtractPrivateKeyRequestParams;
    const useOldAccounts = !!requestParamsObj.useOldAccounts;

    if (!requestParamsObj.userAddress) {
      throw new Error(
        `The given user address need to be non-empty string, got: ${JSON.stringify(requestParamsObj.userAddress)}`,
      );
    }

    try {
      validateAndParseAddress(requestParamsObj.userAddress);
    } catch (err) {
      throw new Error(`The given user address is invalid: ${requestParamsObj.userAddress}`);
    }

    const response = await snap.request({
      method: 'snap_confirm',
      params: [
        {
          prompt: `Do you want to export your private Key ?`,
        },
      ],
    });

    if (response === true) {
      const userAddress = requestParamsObj.userAddress;
      const network = getNetworkFromChainId(state, requestParamsObj.chainId, useOldAccounts);
      const { privateKey: userPrivateKey } = await getKeysFromAddress(keyDeriver, network, state, userAddress);

      await snap.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: 'StarkNet Account Private Key',
            textAreaContent: `${userPrivateKey}`,
          },
        ],
      });
    }

    return null;
  } catch (err) {
    console.error(`Problem found: ${err}`);
    throw err;
  }
}
