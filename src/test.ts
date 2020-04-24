/* eslint-disable @typescript-eslint/no-explicit-any */
export function sayHello(): void {
  console.log('hello world')
}

export function sum(a: number, b: number, c: number): number {
  return a + b + c
}

type A = any
type B<T> = T

function g<T extends A>(a: T) {
  return function b<U extends B<T>>(b: U) {
    return [a, b]
  }
}

const g1 = g(4)
g1(5)
