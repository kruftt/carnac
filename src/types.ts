/* eslint-disable @typescript-eslint/no-explicit-any */
import { Ref, ComputedRef } from 'vue'
import { isFunction } from 'util'

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }
export type StateValue =
  | boolean
  | string
  | number
  | bigint
  | Array<any>
  | Map<any, any>
  | Set<any>
  | WeakMap<any, any>
  | WeakSet<any>
  | { [index: string]: StateValue }

// TODO: Change to whitelist
export function isStateValue(a: unknown): a is StateValue {
  return !isFunction(a)
}

export type RawStoreComputed<S extends StateValue> = {
  [getter: string]: (state: DeepReadonly<S>) => any
}

// using extends/infer prevents the type signature from containing the state object twice
export type BoundStoreComputed<C> = C extends RawStoreComputed<infer S>
  ? { [k in keyof C]: ComputedRef<ReturnType<C[k]>> }
  : never

export type RawStoreActions = {
  [key: string]: (...args: Array<any>) => any
}

// Copying over the properties in this way gets 'this' to update in the 'rawActions' parameter
export type BoundStoreActions<A extends RawStoreActions> = {
  [k in keyof A]: (...args: Parameters<A[k]>) => ReturnType<A[k]>
}

export interface StoreEvent<store> {
  type: string
  store: store extends ImmutableStore<infer S, infer C, infer A>
    ? ImmutableStore<S, C, A>
    : never
}

type BaseStore<
  S extends StateValue,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = {
  actions: BoundStoreActions<A>
  patch: (changes: DeepPartial<S>) => DeepPartial<S>
  notify: (evt: StoreEvent<ImmutableStore<S, C, A>>) => void
}

export type MutableStore<
  S extends StateValue,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = BaseStore<S, C, A> & {
  state: S
  computed: BoundStoreComputed<C>
}

export type ImmutableStore<
  S extends StateValue,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = BaseStore<S, C, A> & {
  state: DeepReadonly<S>
  computed: DeepReadonly<BoundStoreComputed<C>>
}

export type MutableDepotModels<M> = {
  get: (id: string) => M | null
  where: () => MutableDepotModels<M>
  first: (n: number) => MutableDepotModels<M>
  patch: (changes: DeepPartial<M>) => Array<DeepPartial<M>>
  [Symbol.iterator]: IterableIterator<M>
}

export type ImmutableDepotModels<M> = {
  get: (id: string) => Readonly<M> | null
  where: () => ImmutableDepotModels<M>
  first: (n: number) => ImmutableDepotModels<M>
  patch: (changes: DeepPartial<M>) => Array<DeepPartial<M>>
  [Symbol.iterator]: IterableIterator<Readonly<M>>
}

export type RawDepotComputed<M> = {
  [rawComputed: string]: (models: ImmutableDepotModels<M>) => any
}

export type ComputedDepotGetters<M, C extends RawDepotComputed<M>> = {
  [k in keyof C]: ComputedRef<ReturnType<C[k]>>
}

export type RawDepotActions = {
  [key: string]: (...args: Array<any>) => any
}

export type BoundDepotActions<A extends RawDepotActions> = {
  [k in keyof A]: (...args: Parameters<A[k]>) => ReturnType<A[k]>
}

export interface DepotEvent<_Depot> {
  type: string
  store: _Depot extends ImmutableDepot<infer T, infer C, infer A>
    ? ImmutableDepot<T, C, A>
    : never
}

export type BaseDepot<M, C extends RawDepotComputed<M>, A extends RawDepotActions> = {
  getters: ComputedDepotGetters<M, C>
  actions: BoundDepotActions<A>
  notify: (evt: DepotEvent<ImmutableDepot<M, C, A>>) => void
}

export type MutableDepot<
  M,
  C extends RawDepotComputed<M>,
  A extends RawDepotActions
> = BaseDepot<M, C, A> & {
  models: MutableDepotModels<M>
}

export type ImmutableDepot<
  M,
  C extends RawDepotComputed<M>,
  A extends RawDepotActions
> = BaseDepot<M, C, A> & {
  models: ImmutableDepotModels<M>
}
