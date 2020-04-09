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

interface LibBytesImplInterface extends Interface {
  functions: {
    popLastByte: TypedFunctionDescription<{
      encode([_data]: [Arrayish]): string;
    }>;

    readUint8Uint16: TypedFunctionDescription<{
      encode([_data, _index]: [Arrayish, BigNumberish]): string;
    }>;

    readUint8Uint8: TypedFunctionDescription<{
      encode([_data, _index]: [Arrayish, BigNumberish]): string;
    }>;

    readAddress: TypedFunctionDescription<{
      encode([_data, _index]: [Arrayish, BigNumberish]): string;
    }>;

    readBytes66: TypedFunctionDescription<{
      encode([_data, _index]: [Arrayish, BigNumberish]): string;
    }>;

    readBytes32: TypedFunctionDescription<{
      encode([_data, _index]: [Arrayish, BigNumberish]): string;
    }>;

    writeUint16: TypedFunctionDescription<{
      encode([_dest, _index, _a]: [
        Arrayish,
        BigNumberish,
        BigNumberish
      ]): string;
    }>;

    writeUint8Address: TypedFunctionDescription<{
      encode([_dest, _index, _a, _b]: [
        Arrayish,
        BigNumberish,
        BigNumberish,
        string
      ]): string;
    }>;
  };

  events: {};
}

export class LibBytesImpl extends Contract {
  connect(signerOrProvider: Signer | Provider | string): LibBytesImpl;
  attach(addressOrName: string): LibBytesImpl;
  deployed(): Promise<LibBytesImpl>;

  on(event: EventFilter | string, listener: Listener): LibBytesImpl;
  once(event: EventFilter | string, listener: Listener): LibBytesImpl;
  addListener(
    eventName: EventFilter | string,
    listener: Listener
  ): LibBytesImpl;
  removeAllListeners(eventName: EventFilter | string): LibBytesImpl;
  removeListener(eventName: any, listener: Listener): LibBytesImpl;

  interface: LibBytesImplInterface;

  functions: {
    popLastByte(
      _data: Arrayish
    ): Promise<{
      0: string;
      1: string;
    }>;

    readUint8Uint16(
      _data: Arrayish,
      _index: BigNumberish
    ): Promise<{
      0: number;
      1: number;
      2: BigNumber;
    }>;

    readUint8Uint8(
      _data: Arrayish,
      _index: BigNumberish
    ): Promise<{
      0: number;
      1: number;
      2: BigNumber;
    }>;

    readAddress(
      _data: Arrayish,
      _index: BigNumberish
    ): Promise<{
      0: string;
      1: BigNumber;
    }>;

    readBytes66(
      _data: Arrayish,
      _index: BigNumberish
    ): Promise<{
      0: string;
      1: BigNumber;
    }>;

    readBytes32(_data: Arrayish, _index: BigNumberish): Promise<string>;

    writeUint16(
      _dest: Arrayish,
      _index: BigNumberish,
      _a: BigNumberish
    ): Promise<{
      0: string;
      1: BigNumber;
    }>;

    writeUint8Address(
      _dest: Arrayish,
      _index: BigNumberish,
      _a: BigNumberish,
      _b: string
    ): Promise<{
      0: string;
      1: BigNumber;
    }>;
  };

  popLastByte(
    _data: Arrayish
  ): Promise<{
    0: string;
    1: string;
  }>;

  readUint8Uint16(
    _data: Arrayish,
    _index: BigNumberish
  ): Promise<{
    0: number;
    1: number;
    2: BigNumber;
  }>;

  readUint8Uint8(
    _data: Arrayish,
    _index: BigNumberish
  ): Promise<{
    0: number;
    1: number;
    2: BigNumber;
  }>;

  readAddress(
    _data: Arrayish,
    _index: BigNumberish
  ): Promise<{
    0: string;
    1: BigNumber;
  }>;

  readBytes66(
    _data: Arrayish,
    _index: BigNumberish
  ): Promise<{
    0: string;
    1: BigNumber;
  }>;

  readBytes32(_data: Arrayish, _index: BigNumberish): Promise<string>;

  writeUint16(
    _dest: Arrayish,
    _index: BigNumberish,
    _a: BigNumberish
  ): Promise<{
    0: string;
    1: BigNumber;
  }>;

  writeUint8Address(
    _dest: Arrayish,
    _index: BigNumberish,
    _a: BigNumberish,
    _b: string
  ): Promise<{
    0: string;
    1: BigNumber;
  }>;

  filters: {};

  estimate: {
    popLastByte(_data: Arrayish): Promise<BigNumber>;

    readUint8Uint16(_data: Arrayish, _index: BigNumberish): Promise<BigNumber>;

    readUint8Uint8(_data: Arrayish, _index: BigNumberish): Promise<BigNumber>;

    readAddress(_data: Arrayish, _index: BigNumberish): Promise<BigNumber>;

    readBytes66(_data: Arrayish, _index: BigNumberish): Promise<BigNumber>;

    readBytes32(_data: Arrayish, _index: BigNumberish): Promise<BigNumber>;

    writeUint16(
      _dest: Arrayish,
      _index: BigNumberish,
      _a: BigNumberish
    ): Promise<BigNumber>;

    writeUint8Address(
      _dest: Arrayish,
      _index: BigNumberish,
      _a: BigNumberish,
      _b: string
    ): Promise<BigNumber>;
  };
}