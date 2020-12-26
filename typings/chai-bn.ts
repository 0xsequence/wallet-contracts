/* eslint-disable */
/// <reference types="chai" />

declare module 'chai-bn' {
  function chaiBN(bignumber: any): (chai: any, utils: any) => void

  namespace chaiBN {}

  export = chaiBN
}

declare namespace Chai {
  interface Equal {
    BN: any
  }
  interface NumberComparer {
    BN: any
  }
}
