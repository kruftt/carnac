/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ref, ComputedRef, ref } from 'vue'

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }
export type StateTree = Record<string | number | symbol, any>

export type RawStoreGetters<S extends StateTree> = {
  [key: string]: (state: DeepReadonly<S>) => any
}

// export type ComputedStoreGetters<S extends StateTree, G extends RawStoreGetters<S>> = {
//   [K in keyof G]: ComputedRef<ReturnType<G[K]>>
// }
export type ComputedStoreGetters<S extends StateTree, G extends RawStoreGetters<S>> = {
  [K in keyof G]: ComputedRef<ReturnType<G[K]>>
}

export type RawStoreActions<S extends StateTree, G extends RawStoreGetters<S>> = {
  [key: string]: (
    this: MutableStore<S, G, RawStoreActions<S, G>>,
    ...args: Array<any>
  ) => any
}

export type BoundStoreActions<
  S extends StateTree,
  G extends RawStoreGetters<S>,
  A extends RawStoreActions<S, G>
> = {
  [K in keyof A]: (...args: Parameters<A[K]>) => ReturnType<A[K]>
}

export interface StoreEvent<_Store> {
  type: string
  store: _Store extends ImmutableStore<infer S, infer G, infer A>
    ? ImmutableStore<S, G, A>
    : never
}

interface BaseStore<
  S extends StateTree,
  G extends RawStoreGetters<S>,
  A extends RawStoreActions<S, G>
> {
  getters: ComputedStoreGetters<S, G>
  actions: BoundStoreActions<S, G, A>
  patch: (changes: DeepPartial<S>) => DeepPartial<S>
  notify: (evt: StoreEvent<ImmutableStore<S, G, A>>) => void
}

export interface MutableStore<
  S extends StateTree,
  G extends RawStoreGetters<S>,
  A extends RawStoreActions<S, G>
> extends BaseStore<S, G, A> {
  state: Ref<S>
}

export interface ImmutableStore<
  S extends StateTree,
  G extends RawStoreGetters<S>,
  A extends RawStoreActions<S, G>
> extends BaseStore<S, G, A> {
  state: Ref<DeepReadonly<S>>
}

export type MutableDepotModels<T> = {
  get: (id: string) => T | null
  where: () => MutableDepotModels<T>
  first: (n: number) => MutableDepotModels<T>
  patch: (changes: DeepPartial<T>) => Array<DeepPartial<T>>
  [Symbol.iterator]: IterableIterator<T>
}

export type ImmutableDepotModels<T> = {
  get: (id: string) => Readonly<T> | null
  where: () => ImmutableDepotModels<T>
  first: (n: number) => ImmutableDepotModels<T>
  patch: (changes: DeepPartial<T>) => Array<DeepPartial<T>>
  [Symbol.iterator]: IterableIterator<Readonly<T>>
}

export type RawDepotGetter<T> = {
  (models: ImmutableDepotModels<T>, getters: RawDepotGetters<T>): any
}

export type RawDepotGetters<T> = {
  [key: string]: RawDepotGetter<T>
}

export type ComputedDepotGetters<T, G extends RawDepotGetters<T>> = {
  [K in keyof G]: ComputedRef<ReturnType<G[K]>>
}

export type RawDepotAction<T, G extends RawDepotGetters<T>> = {
  (this: MutableDepot<T, G, RawDepotActions<T, G>>, ...args: Array<any>): any
}

export type RawDepotActions<T, G extends RawDepotGetters<T>> = {
  [key: string]: RawDepotAction<T, G>
}

export type BoundDepotActions<
  T,
  G extends RawDepotGetters<T>,
  A extends RawDepotActions<T, G>
> = {
  [K in keyof A]: (...args: Parameters<A[K]>) => ReturnType<A[K]>
}

export interface DepotEvent<_Depot> {
  type: string
  store: _Depot extends ImmutableDepot<infer T, infer G, infer A>
    ? ImmutableDepot<T, G, A>
    : never
}

interface BaseDepot<T, G extends RawDepotGetters<T>, A extends RawDepotActions<T, G>> {
  getters: ComputedDepotGetters<T, G>
  actions: BoundDepotActions<T, G, A>
  notify: (evt: DepotEvent<ImmutableDepot<T, G, A>>) => void
}

export interface MutableDepot<
  T,
  G extends RawDepotGetters<T>,
  A extends RawDepotActions<T, G>
> extends BaseDepot<T, G, A> {
  models: MutableDepotModels<T>
}

export interface ImmutableDepot<
  T,
  G extends RawDepotGetters<T>,
  A extends RawDepotActions<T, G>
> extends BaseDepot<T, G, A> {
  models: ImmutableDepotModels<T>
}

/*
type _S = { foo: string }
type _G = {
  hello: () => string
}
type _A = {
  addFive: (a: number) => number
}

type MyStore = Store<_S, _G, _A>

const store: MyStore = {
  state: { foo: 'bar' },
  getters: {
    hello: ref('world'),
  },
  actions: {
    addFive: (a: number) => a + 5,
  },
}
*/
