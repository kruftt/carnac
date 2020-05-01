/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-fallthrough */
import {
  getType,
  DeepPartialMutator,
  RootState,
  GenericCollection,
  CollectionMutatorOptions,
  ArrayMutatorOptions,
  MapMutatorOptions,
  SetMutatorOptions,
} from './types'

function isArrayIndexObject(o: RootState): o is DeepPartialMutator<RootState> {
  for (const key in o)
    if (Number.parseInt(key).toString() === 'NaN') return false
  return true
}

function performArrayMutation(
  target: any[],
  mutator: ArrayMutatorOptions<any>
): [any, ArrayMutatorOptions<any>] {
  if (Object.keys(mutator).length > 1)
    console.warn(`Only 1 mutation allowed per options object: ${mutator}`)
  const inverse = {} as ArrayMutatorOptions<any>
  let args, result
  for (const key in mutator) {
    switch (key) {
      case 'push':
        args = mutator[key]!
        inverse['splice'] = [target.length, args.length]
        result = target.push(...args)
        break
      case 'pop':
        result = target.pop()
        inverse['push'] = [result]
        break
      case 'splice':
        args = mutator[key]!
        result = target.splice(...args)
        inverse[key] = [args[0], args[2].length, ...result]
        break
      case 'fill':
        args = mutator[key]!
        inverse['splice'] = [
          args[1] ? args[1] : 0,
          args[2] ? args[2] - args[1]! : target.length,
          ...target.slice(...args.slice(1)),
        ]
        result = target.fill(...args)
        break
      case 'sort':
        inverse['splice'] = [0, target.length, target.slice()]
        result = target.sort(...mutator[key]!)
        break
      case 'reverse':
        inverse[key] = []
        result = target.reverse(...mutator[key]!)
        break
      case 'shift':
        result = target.shift(...mutator[key]!)
        inverse['unshift'] = [result]
        break
      case 'unshift':
        args = mutator[key]!
        result = target.unshift(...args)
        inverse['splice'] = [0, args.length]
        break
      default:
        console.warn(`performArrayMutation called with invalid key: ${key}`)
        break
    }
  }
  return [result, inverse]
}

function performMapMutation(
  target: Map<any, any>,
  mutator: MapMutatorOptions<any, any>
): [any, MapMutatorOptions<any, any>] {
  if (Object.keys(mutator).length > 1)
    console.warn(`Only 1 mutation allowed per options object: ${mutator}`)
  const inverse = {} as MapMutatorOptions<any, any>
  let args, result
  for (const key in mutator) {
    switch (key) {
      case 'set':
        args = mutator[key]!
        result = target.get(args[0])
        if (result === undefined) inverse['delete'] = [args[0]]
        else inverse[key] = result
        result = target.set(...args)
        break
      case 'delete':
        args = mutator[key]!
        result = target.get(...args)
        if (result === undefined) inverse[key] = args
        else inverse['set'] = [args[0], result]
        result = target.delete(...args)
        break
      case 'clear':
        ;(inverse as any)['_setAll'] = [new Map(target)]
        result = target.clear()
        break
      case '_setAll':
        args = (mutator as any)[key] as [Map<any, any>]
        args[0].forEach((v, k) => target.set(k, v))
        inverse['clear'] = []
        result = target
        break
      default:
        console.warn(`performMapMutation called with invalid key: ${key}`)
        break
    }
  }
  return [result, inverse]
}

function performSetMutation(
  target: Set<any>,
  mutator: SetMutatorOptions<any>
): [any, SetMutatorOptions<any>] {
  if (Object.keys(mutator).length > 1)
    console.warn(`Only 1 mutation allowed per options object: ${mutator}`)
  const inverse = {} as SetMutatorOptions<any>
  let args, result
  for (const key in mutator) {
    switch (key) {
      case 'add':
        args = mutator[key]!
        target.has(...args) ? (inverse[key] = args) : (inverse['delete'] = args)
        result = target.add(...args)
        break
      case 'delete':
        args = mutator[key]!
        target.has(...args) ? (inverse['add'] = args) : (inverse[key] = args)
        result = target.delete(...args)
        break
      case 'clear':
        ;(inverse as any)['_addAll'] = [new Set(target)]
        result = target.clear()
        break
      case '_addAll':
        args = (mutator as any)[key] as [Set<any>]
        args[0].forEach((e) => target.add(e))
        inverse['clear'] = []
        result = target
        break
      default:
        console.warn(`performSetMutation called with invalid key: ${key}`)
        break
    }
  }
  return [result, inverse]
}

export function performMutation<S extends RootState>(
  target: S,
  mutators: DeepPartialMutator<S>
): [any, DeepPartialMutator<S>] {
  const inverse: DeepPartialMutator<any> = {}
  let result
  for (const key in mutators) {
    const targetValue = target[key] as RootState | GenericCollection
    const mutatorValue = mutators[key] as
      | DeepPartialMutator<any>
      | CollectionMutatorOptions

    switch (getType(targetValue)) {
      case 'Object':
        ;[result, inverse[key]] = performMutation(
          targetValue,
          mutatorValue as DeepPartialMutator<unknown>
        )
        break
      case 'Array':
        if (isArrayIndexObject(mutatorValue)) {
          ;[result, inverse[key]] = performMutation(targetValue, mutatorValue)
        } else {
          ;[result, inverse[key]] = performArrayMutation(
            targetValue as unknown[],
            mutatorValue as ArrayMutatorOptions<unknown>
          )
        }
        break
      case 'Map':
      case 'WeakMap':
        ;[result, inverse[key]] = performMapMutation(
          targetValue as Map<unknown, unknown>,
          mutatorValue as MapMutatorOptions<unknown, unknown>
        )
        break
      case 'Set':
      case 'WeakSet':
        ;[result, inverse[key]] = performSetMutation(
          targetValue as Set<unknown>,
          mutatorValue as SetMutatorOptions<unknown>
        )
      default:
        console.warn(`Unhandled collection mutation, target: ${target}`)
    }
    // case: target is collection and source is (config) object
    // case: target is array and source is object with 'n' index key
    // case: target is array and source is config object
    // case: target is collection and source is array of mutation objects
  }

  return [result, inverse as DeepPartialMutator<S>]
}
