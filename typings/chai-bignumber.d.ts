/// <reference types="chai" />

declare module 'chai-bignumber' {
  function chaiBignumber(bignumber: any): (chai: any, utils: any) => void

  namespace chaiBignumber {}

  export = chaiBignumber
}

declare namespace Chai {
  // For BDD API
  interface Assertion extends LanguageChains, NumericComparison, TypeComparison {
    bignumber: Assertion
  }
}
