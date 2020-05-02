/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComputedRef, Ref } from 'vue'
import { WritableComputedRef } from '@vue/reactivity/dist/reactivity'

const toString = Object.prototype.toString
export function getType(a: unknown) {
  return toString.call(a).slice(8, -1)
}

export type RootState = Record<string, any>
export function isPlainObject<T = RootState>(o: unknown): o is T {
  return o && getType(o) == 'Object'
}

// export type DeepReadonly<S extends RootState> = {
//   readonly [K in keyof S]: DeepReadonly<S[K]>
// }
export type DeepPartialPatch<S extends RootState> = {
  [K in keyof S]?: DeepPartialPatch<S[K]>
}

export type GenericCollection =
  | Array<any>
  | Set<any>
  | WeakSet<any>
  | Map<any, any>
  | WeakMap<any, any>
// prettier-ignore
type ArrayMutators = 'push' | 'pop' | 'splice' | 'fill' | 'sort' | 'reverse' | 'shift' | 'unshift'
type MapMutators = 'clear' | 'delete' | 'set'
type SetMutators = 'add' | 'clear' | 'delete'

export type ArrayMutatorOptions<T> = {
  [k in ArrayMutators]?: Parameters<Array<T>[k]>
}
export type MapMutatorOptions<K, V> = {
  [k in MapMutators]?: Parameters<Map<K, V>[k]>
}
export type SetMutatorOptions<T> = {
  [k in SetMutators]?: Parameters<Set<T>[k]>
}

export type ArrayMutatorResults<O> = O extends ArrayMutatorOptions<infer T>
  ? {
      [k in keyof O]: k extends ArrayMutators ? ReturnType<Array<T>[k]> : never
    }
  : never
export type MapMutatorResults<O> = O extends MapMutatorOptions<infer K, infer V>
  ? {
      [k in keyof O]: k extends MapMutators ? ReturnType<Map<K, V>[k]> : never
    }
  : never
export type SetMutatorResults<O> = O extends SetMutatorOptions<infer T>
  ? {
      [k in keyof O]: k extends SetMutators ? ReturnType<Set<T>[k]> : never
    }
  : never

export type DeepPartialMutator<S> = S extends Array<infer T>
  ? ArrayMutatorOptions<T> | ArrayMutatorOptions<T>[]
  : S extends Map<infer K, infer V>
  ? MapMutatorOptions<K, V> | MapMutatorOptions<K, V>[]
  : S extends Set<infer T>
  ? SetMutatorOptions<T> | SetMutatorOptions<T>[]
  : { [k in keyof S]?: DeepPartialMutator<S[k]> }

export type DeepPartialMutatorResult<m> = m extends ArrayMutatorOptions<infer T>
  ? ArrayMutatorResults<m>
  : m extends ArrayMutatorOptions<infer T>[]
  ? ArrayMutatorResults<m>[]
  : m extends MapMutatorOptions<infer K, infer V>
  ? MapMutatorResults<m>
  : m extends MapMutatorOptions<infer K, infer V>[]
  ? MapMutatorResults<m>[]
  : m extends SetMutatorOptions<infer T>
  ? SetMutatorResults<m>
  : m extends SetMutatorOptions<infer T>[]
  ? SetMutatorResults<m>[]
  : { [k in keyof m]: DeepPartialMutatorResult<m[k]> }

export type RawStoreComputedGetter<S extends RootState> = {
  (state: S): any
}

export type RawStoreWritableComputed<S extends RootState> = {
  get: RawStoreComputedGetter<S>
  set: (state: S, value: any) => any
}

export type RawStoreComputedProps<S extends RootState> = {
  [getter: string]: RawStoreComputedGetter<S> | RawStoreWritableComputed<S>
}

type BoundStoreComputedProperty<P> = P extends RawStoreComputedGetter<infer S>
  ? ComputedRef<ReturnType<P>>
  : P extends RawStoreWritableComputed<infer S>
  ? WritableComputedRef<ReturnType<P['get']>>
  : never

export type BoundStoreComputed<C> = C extends RawStoreComputedProps<infer S>
  ? {
      [K in keyof C]: BoundStoreComputedProperty<C[K]>
    }
  : never

export type RawStoreActions = {
  [key: string]: (...args: Array<any>) => any
}

export type BoundStoreActions<A extends RawStoreActions> = {
  [k in keyof A]: (...args: Parameters<A[k]>) => ReturnType<A[k]>
}

export interface StoreEvent {
  type: string
}

export interface StoreRawEvent extends StoreEvent {
  type: 'raw'
}

type StorePatchFunction<S extends RootState> = {
  <s extends RootState, p extends DeepPartialPatch<s>>(target: s, patch: p): p
  <p extends DeepPartialPatch<S>>(patch: p): p
}

export type StorePatchEvent = StoreEvent & {
  type: 'patch'
  target: RootState
  patch: RootState
  oldValues: RootState
}

type StorePerform<S extends RootState> = {
  <s extends RootState | GenericCollection, m extends DeepPartialMutator<s>>(
    target: s,
    mutations: m
  ): DeepPartialMutatorResult<m>
  <m extends DeepPartialMutator<S>>(mutations: m): DeepPartialMutatorResult<m>
}

export type StorePerformEvent<s extends RootState> = StoreEvent & {
  type: 'perform'
  target: s
  mutation: DeepPartialMutator<s>
  inverse: DeepPartialMutator<s>
}

export type Store<
  S extends RootState,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
> = {
  id: string
  patch: StorePatchFunction<S>
  perform: StorePerform<S>
  notify: <Evt extends StoreEvent>(evt: Evt) => void
  startBatch: () => void
  finishBatch: <Evt extends StoreEvent>(evt: Evt) => void
  subscribe: (callback: StoreSubscriber<S>) => () => void
  state: S
  computed: BoundStoreComputed<C>
  actions: BoundStoreActions<A>
  bundle: () => { [K in keyof S]: Ref<S[K]> } & {
    patch: StorePatchFunction<S>
  } & BoundStoreComputed<C> &
    BoundStoreActions<A>
}

export type GenericStore = Store<
  any,
  RawStoreComputedProps<any>,
  RawStoreActions
>

export type StoreConfig<
  S,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
> = {
  id: string
  state: () => S
  computed: C & ThisType<BoundStoreComputed<C>>
  actions: A & ThisType<Store<S, C, A>>
}

export type StoreBatchEvent = StoreEvent & {
  events: StoreEvent[]
}

export interface StoreComputedPropertyEvent extends StoreEvent {
  type: 'computed'
  value: any
  oldValue: any
}

export type StoreSubscriber<S extends RootState> = {
  (evt: StoreEvent, state: S): void
}

export interface MutableDepotModels<M> {
  get: (id: string) => M | null
  where: () => MutableDepotModels<M>
  first: (n: number) => MutableDepotModels<M>
  patch: (changes: DeepPartialPatch<M>) => Array<DeepPartialPatch<M>>
  [Symbol.iterator]: IterableIterator<M>
}

export interface ImmutableDepotModels<M> {
  get: (id: string) => Readonly<M> | null
  where: () => ImmutableDepotModels<M>
  first: (n: number) => ImmutableDepotModels<M>
  [Symbol.iterator]: IterableIterator<Readonly<M>>
}

export type RawDepotGetter<M> = {
  [rawComputed: string]: (models: ImmutableDepotModels<M>) => any
}

export type BoundDepotComputed<M, C extends RawDepotGetter<M>> = {
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

export interface BaseDepot<
  M,
  C extends RawDepotGetter<M>,
  A extends RawDepotActions
> {
  getters: BoundDepotComputed<M, C>
  actions: BoundDepotActions<A>
  notify: (evt: DepotEvent<ImmutableDepot<M, C, A>>) => void
}

export type MutableDepot<
  M,
  C extends RawDepotGetter<M>,
  A extends RawDepotActions
> = BaseDepot<M, C, A> & {
  models: MutableDepotModels<M>
}

export type ImmutableDepot<
  M,
  C extends RawDepotGetter<M>,
  A extends RawDepotActions
> = BaseDepot<M, C, A> & {
  models: ImmutableDepotModels<M>
}
