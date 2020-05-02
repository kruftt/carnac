/* eslint-disable @typescript-eslint/no-explicit-any */
/*
import { ArrayMutatorOptions, RootState, DeepPartialMutator } from './types'

const toString = Object.prototype.toString
export function getType(a: unknown) {
  return toString.call(a).slice(8, -1)
}
export function isPlainObject<T>(a: unknown): a is T {
  return a && getType(a) == 'Object'
}
// return a && typeof a === 'object' && a !== null

function makeMap(vals: string) {
  const arr = vals.split(',')
  const map: Record<string, true> = {}
  for (const val of arr) map[val] = true
  return (v: string) => !!map[v]
}

const isArrayMutatorKey = makeMap(
  'push,pop,splice,fill,sort,reverse,shift,unshift'
)
// const isMapMutatorKey = makeMap('delete,set,clear')
// const isSetMutatorKey = makeMap('delete,add,clear')
// const isCollectionMutatorKey = makeMap(
//   'delete,set,add,clear' + 'push,pop,splice,fill,sort,reverse,shift,unshift'
// )

// export function isArrayIndexObject(
//   o: RootState
// ): o is DeepPartialMutator<RootState> {
//   for (const key in o)
//     if (Number.parseInt(key).toString() === 'NaN') return false
//   return true
// }

export function isArrayMutatorOptions(
  o: Record<string, any>
): o is ArrayMutatorOptions<any> {
  for (const key in o) if (!isArrayMutatorKey(key)) return false
  return Object.keys(o).length == 1
}
*/
