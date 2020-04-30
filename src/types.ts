/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComputedRef, Ref } from 'vue'
import { WritableComputedRef } from '@vue/reactivity/dist/reactivity'

export type RootState = Record<string, any>
export type DeepReadonly<S extends RootState> = {
  readonly [K in keyof S]: DeepReadonly<S[K]>
}
export type DeepPartial<S extends RootState> = {
  [K in keyof S]?: DeepPartial<S[K]>
}
// prettier-ignore
type ArrayMutators = 'push' | 'pop' | 'splice' | 'fill' | 'sort' | 'reverse' | 'shift' | 'unshift'
type MapMutators = 'clear' | 'delete' | 'set'
type SetMutators = 'add' | 'clear' | 'delete'
export type DeepPartialMutator<S> = {
  [k in keyof S]?: S[k] extends Array<infer T>
    ? { [k in ArrayMutators]?: Parameters<Array<T>[k]> }
    : S[k] extends Map<infer K, infer V>
    ? { [k in MapMutators]?: Parameters<Map<K, V>[k]> }
    : S[k] extends Set<infer T>
    ? { [k in SetMutators]?: Parameters<Set<T>[k]> }
    : DeepPartialMutator<S[k]>
}
export function isPlainObject<T>(a: unknown): a is T {
  return a && typeof a === 'object' && a !== null
}

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

type StorePatch<S extends RootState> = {
  <s extends RootState, p extends DeepPartial<s>>(target: s, patch: p): p
  <p extends S>(patch: p): p
}

export type Store<
  S extends RootState,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
> = {
  id: string
  patch: StorePatch<S>
  notify: <Evt extends StoreEvent>(evt: Evt) => void
  startBatch: () => void
  finishBatch: <Evt extends StoreEvent>(evt: Evt) => void
  subscribe: (callback: StoreSubscriber<S>) => () => void
  state: S
  computed: BoundStoreComputed<C>
  actions: BoundStoreActions<A>
  bundle: () => { [K in keyof S]: Ref<S[K]> } & {
    patch: (patch: DeepPartial<S>) => DeepPartial<S>
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

export interface StoreEvent {
  type: string
}

export interface StoreAssignmentEvent extends StoreEvent {
  type: 'assignment'
}

export type StorePatchEvent = StoreEvent & {
  type: 'patch'
  target: RootState
  patch: RootState
  oldValues: RootState
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
  patch: (changes: DeepPartial<M>) => Array<DeepPartial<M>>
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
