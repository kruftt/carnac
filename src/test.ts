/* eslint-disable @typescript-eslint/no-explicit-any */

// interface Context {

// }

// interface I<S extends Record<string, any>, C extends Context> {
//   state: S
//   computed: C
// }

// type F<T> = {
//   [K in keyof T]: 'F<T>!!!'
// }

// type G<T> = {
//   [K in keyof T]: T[K] extends () => any ? (this: F<T>) => any : never
// }

// function f<L extends G<L>>(arg: L) {
//   return arg
// }

// f({
//   f() {
//     this // F<G<unknown>>
//   },
// })

// function myFunc<A extends Record<string, number>>(a: A): A {
//   for (const key in a) {
//     a[key] = 42 // Type '42' not assignable to type 'A[Extract<keyof A, string>]'
//   }
//   return a
// }

// type R2 = { answer: 42 }
// type R3 = R1 & R2
// type R1 = Record<string, number>
// type K1 = keyof R1 // string
// type K2 = keyof R2
// type K3 = keyof R3

const vue = require('vue')

const state = { a: 42, foo: { bar: 'baz' } }
const reactiveState = vue.reactive(state)

vue.watch(
  () => reactiveState,
  (a, b, c) => {
    console.log('event', a, b, c)
  },
  {
    deep: true,
  }
)

const handler = {
  set(obj, prop, value) {
    console.log('handler fired')
    return (obj[prop] = value)
  },
}

const proxyState = new Proxy(reactiveState, handler)

const handler2 = {
  set(obj, prop, value) {
    console.log('handler fired')
    return Reflect.set(...arguments)
  },
}

const proxyState2 = new Proxy(reactiveState, handler)
const rp2 = vue.reactive(proxyState2)

const pstate2 = new Proxy(state, handler2)
const rstate2 = vue.reactive(pstate2)
vue.watch(
  () => rstate2,
  (a, b, c) => {
    console.log('rstate 2 event', a)
  },
  {
    deep: true,
  }
)
const rpstate2 = vue.reactive(rstate2)
