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
