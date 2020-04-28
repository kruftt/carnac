/* eslint-disable @typescript-eslint/no-explicit-any */

// interface Context {

// }

// interface I<S extends Record<string, any>, C extends Context> {
//   state: S
//   computed: C
// }

type Z<T, U> = {
  [K in keyof T]: 'replaced'
} &
  {
    [K in keyof U]: 'replaced'
  }

function f<S, A extends Z<A, S>>(s: S, a: A) {}

f({ s: 'fo' }, { test: 'replaced', s: 'other' })
