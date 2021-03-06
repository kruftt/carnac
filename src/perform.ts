/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  getType,
  DeepPartialMutator,
  RootState,
  GenericCollection,
  ArrayMutatorOptions,
  MapMutatorOptions,
  SetMutatorOptions,
  DeepPartialMutatorResult,
  ArrayMutatorResults,
  MapMutatorResults,
  SetMutatorResults,
} from './types'

function isArrayIndexObject(o: RootState): o is DeepPartialMutator<RootState> {
  for (const key in o)
    if (Number.parseInt(key).toString() === 'NaN') return false
  return true
}

function performArrayMutation<T>(
  target: T[],
  mutator: ArrayMutatorOptions<T>
): [ArrayMutatorResults<ArrayMutatorOptions<T>>, ArrayMutatorOptions<T>] {
  if (Object.keys(mutator).length > 1)
    console.warn(`Only 1 mutation allowed per options object: ${mutator}`)
  const inverse = {} as ArrayMutatorOptions<T>
  const result = {} as ArrayMutatorResults<ArrayMutatorOptions<T>>
  let args, temp
  for (const key in mutator) {
    switch (key) {
      case 'push':
        args = mutator[key]!
        inverse['splice'] = [target.length, args.length]
        result[key] = target.push(...args)
        break
      case 'pop':
        temp = result[key] = target.pop()
        if (temp === undefined) inverse['pop'] = []
        else inverse['push'] = [temp]
        break
      case 'splice':
        args = mutator[key]!
        temp = result[key] = target.splice(...args)
        inverse[key] = [args[0], args.slice(2).length, ...temp]
        break
      case 'fill':
        args = mutator[key]!
        temp = args.slice(1) as (number | undefined)[]
        inverse['splice'] = [
          args[1] ? args[1] : 0,
          args[2] ? args[2] - args[1]! : target.length,
          ...target.slice(...temp),
        ]
        result[key] = target.fill(...args)
        break
      case 'sort':
        inverse['splice'] = [0, target.length, ...target.slice()]
        result[key] = target.sort(...mutator[key]!)
        break
      case 'reverse':
        inverse[key] = []
        result[key] = target.reverse(...mutator[key]!)
        break
      case 'shift':
        temp = result[key] = target.shift(...mutator[key]!)
        if (temp === undefined) inverse['shift'] = []
        else inverse['unshift'] = [temp]
        break
      case 'unshift':
        args = mutator[key]!
        result[key] = target.unshift(...args)
        inverse['splice'] = [0, args.length]
        break
      default:
        console.warn(`performArrayMutation called with invalid key: ${key}`)
        break
    }
  }
  return [result, inverse]
}

function performMapMutation<K, V>(
  target: Map<K, V>,
  mutator: MapMutatorOptions<K, V>
): [MapMutatorResults<MapMutatorOptions<K, V>>, MapMutatorOptions<K, V>] {
  if (Object.keys(mutator).length > 1)
    console.warn(`Only 1 mutation allowed per options object: ${mutator}`)
  const inverse = {} as MapMutatorOptions<K, V>
  const result = {} as MapMutatorResults<MapMutatorOptions<K, V>>
  let args, temp
  for (const key in mutator) {
    switch (key) {
      case 'set':
        args = mutator[key]!
        temp = target.get(args[0])
        if (temp === undefined) inverse['delete'] = [args[0]]
        else inverse[key] = [args[0], temp]
        result[key] = target.set(...args)
        break
      case 'delete':
        args = mutator[key]!
        temp = target.get(...args)
        if (temp === undefined) inverse[key] = args
        else inverse['set'] = [args[0], temp]
        result[key] = target.delete(...args)
        break
      case 'clear':
        ;(inverse as any)['_setAll'] = [new Map(target)]
        result[key] = target.clear()
        break
      case '_setAll':
        args = (mutator as any)[key] as [Map<any, any>]
        args[0].forEach((v, k) => target.set(k, v))
        inverse['clear'] = []
        ;(result as any)[key] = target
        break
      default:
        console.warn(`performMapMutation called with invalid key: ${key}`)
        break
    }
  }
  return [result, inverse]
}

function performSetMutation<T>(
  target: Set<T>,
  mutator: SetMutatorOptions<T>
): [SetMutatorResults<SetMutatorOptions<T>>, SetMutatorOptions<T>] {
  if (Object.keys(mutator).length > 1)
    console.warn(`Only 1 mutation allowed per options object: ${mutator}`)
  const inverse = {} as SetMutatorOptions<T>
  const result = {} as SetMutatorResults<SetMutatorOptions<T>>
  let args
  for (const key in mutator) {
    switch (key) {
      case 'add':
        args = mutator[key]!
        target.has(...args) ? (inverse[key] = args) : (inverse['delete'] = args)
        result[key] = target.add(...args)
        break
      case 'delete':
        args = mutator[key]!
        target.has(...args) ? (inverse['add'] = args) : (inverse[key] = args)
        result[key] = target.delete(...args)
        break
      case 'clear':
        ;(inverse as any)['_addAll'] = [new Set(target)]
        result[key] = target.clear()
        break
      case '_addAll':
        args = (mutator as any)[key] as [Set<any>]
        args[0].forEach((e) => target.add(e))
        inverse['clear'] = []
        ;(result as any)[key] = target
        break
      default:
        console.warn(`performSetMutation called with invalid key: ${key}`)
        break
    }
  }
  return [result, inverse]
}

export function performMutation<
  s extends RootState | GenericCollection,
  m extends DeepPartialMutator<RootState | GenericCollection>
>(target: s, mutator: m): [DeepPartialMutatorResult<m>, DeepPartialMutator<s>] {
  if (Array.isArray(mutator)) {
    const results: any[] = []
    const inverses: any[] = []
    mutator.forEach((m) => {
      const [r, i] = performMutation(target, m)
      results.push(r)
      inverses.push(i)
    })
    return [
      results as DeepPartialMutatorResult<m>,
      inverses.reverse() as DeepPartialMutator<s>,
    ]
  }

  switch (getType(target)) {
    case 'Object':
    case 'Array':
      if (getType(target) === 'Object' || isArrayIndexObject(mutator)) {
        const inverse = {} as any
        const result = {} as any
        for (const key in mutator) {
          ;[result[key], inverse[key]] = performMutation(
            target[key as keyof s],
            mutator[key]
          )
        }
        return [result, inverse]
      }

      return performArrayMutation(
        target as unknown[],
        mutator as ArrayMutatorOptions<unknown>
      ) as any

    case 'Map':
    case 'WeakMap':
      return performMapMutation(
        target as Map<unknown, unknown>,
        mutator as MapMutatorOptions<unknown, unknown>
      ) as any
    case 'Set':
    case 'WeakSet':
      return performSetMutation(
        target as Set<unknown>,
        mutator as SetMutatorOptions<unknown>
      ) as any
    default:
      console.warn(`Unhandled collection mutation, target: ${target}`)
      return [{}, {}] as any
  }
}
