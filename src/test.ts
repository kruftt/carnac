/* eslint-disable @typescript-eslint/no-explicit-any */

// interface Context {

// }

// interface I<S extends Record<string, any>, C extends Context> {
//   state: S
//   computed: C
// }

type F<T> = {
  [K in keyof T]: 'F<T>!!!'
}

type G<T> = {
  [K in keyof T]: T[K] extends () => any ? (this: F<T>) => any : never
}

function f<L extends G<L>>(arg: L) {
  return arg
}

f({
  f() {
    this // F<G<unknown>>
  },
})
