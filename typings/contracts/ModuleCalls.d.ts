/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription
} from ".";

interface ModuleCallsInterface extends Interface {
  functions: {
    nonce: TypedFunctionDescription<{ encode([]: []): string }>;

    execute: TypedFunctionDescription<{
      encode([_txs, _nonce, _signature]: [
        {
          delegateCall: boolean;
          revertOnError: boolean;
          gasLimit: BigNumberish;
          target: string;
          value: BigNumberish;
          data: Arrayish;
        }[],
        BigNumberish,
        Arrayish
      ]): string;
    }>;
  };

  events: {
    NonceChange: TypedEventDescription<{
      encodeTopics([newNonce]: [null]): string[];
    }>;

    TxFailed: TypedEventDescription<{
      encodeTopics([_index, _reason]: [null, null]): string[];
    }>;
  };
}

export class ModuleCalls extends Contract {
  connect(signerOrProvider: Signer | Provider | string): ModuleCalls;
  attach(addressOrName: string): ModuleCalls;
  deployed(): Promise<ModuleCalls>;

  on(event: EventFilter | string, listener: Listener): ModuleCalls;
  once(event: EventFilter | string, listener: Listener): ModuleCalls;
  addListener(eventName: EventFilter | string, listener: Listener): ModuleCalls;
  removeAllListeners(eventName: EventFilter | string): ModuleCalls;
  removeListener(eventName: any, listener: Listener): ModuleCalls;

  interface: ModuleCallsInterface;

  functions: {
    nonce(): Promise<BigNumber>;

    execute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: Arrayish;
      }[],
      _nonce: BigNumberish,
      _signature: Arrayish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;
  };

  nonce(): Promise<BigNumber>;

  execute(
    _txs: {
      delegateCall: boolean;
      revertOnError: boolean;
      gasLimit: BigNumberish;
      target: string;
      value: BigNumberish;
      data: Arrayish;
    }[],
    _nonce: BigNumberish,
    _signature: Arrayish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  filters: {
    NonceChange(newNonce: null): EventFilter;

    TxFailed(_index: null, _reason: null): EventFilter;
  };

  estimate: {
    nonce(): Promise<BigNumber>;

    execute(
      _txs: {
        delegateCall: boolean;
        revertOnError: boolean;
        gasLimit: BigNumberish;
        target: string;
        value: BigNumberish;
        data: Arrayish;
      }[],
      _nonce: BigNumberish,
      _signature: Arrayish
    ): Promise<BigNumber>;
  };
}
