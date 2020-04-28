/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComputedRef } from 'vue'

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

export type RawStoreGetter<S extends RootState> = {
  (state: DeepReadonly<S>): any
}

export type RawStorePropertyAccessors<S extends RootState> = {
  get: RawStoreGetter<S>
  set: (state: S, value: any) => any
}

export type RawStoreComputed<S extends RootState> = {
  [getter: string]: RawStoreGetter<S> | RawStorePropertyAccessors<S>
}

type BoundStoreComputedProperty<P> = P extends RawStoreGetter<infer S>
  ? ComputedRef<ReturnType<P>>
  : P extends RawStorePropertyAccessors<infer S>
  ? ComputedRef<ReturnType<P['get']>>
  : never

export type BoundStoreComputed<C> = C extends RawStoreComputed<infer S>
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

interface BaseStore<S extends RootState> {
  id: string
  patch: (changes: DeepPartial<S>) => void
  notify: (evt: StoreEvent) => void
  subscribe: (callback: StoreSubscriber<S>) => () => void
  // bundle: () =>
}

export type MutableStore<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = BaseStore<S> & {
  state: S
  computed: BoundStoreComputed<C>
  actions: BoundStoreActions<A>
}

export type Store<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = BaseStore<S> & {
  readonly state: DeepReadonly<S>
  computed: Readonly<BoundStoreComputed<C>>
  actions: BoundStoreActions<A>
}

export type GenericStore = Store<any, RawStoreComputed<any>, RawStoreActions>

export type StoreConfig<
  S,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = {
  id: string
  state: () => S
  computed: C & ThisType<Readonly<BoundStoreComputed<C>>>
  actions: A & ThisType<MutableStore<S, C, A>>
}

export interface StoreEvent {
  type: string
}

export interface StorePatchEvent<S extends RootState> extends StoreEvent {
  type: 'patch'
  patch: DeepPartial<S>
  oldValues: DeepPartial<S>
}

export interface StoreComputedPropertyEvent extends StoreEvent {
  type: 'computed'
  value: any
  oldValue: any
}

export type StoreSubscriber<S extends RootState> = {
  (evt: StoreEvent, state: DeepReadonly<S>): void
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

/*
const myStoreObject: StoreConfig<S, C, A> = {
  id: 'mystore',
  state: { first: 'super', last: 'man', foo: { bar: 'baz' } },
  computed: {
    fullName(state) {
      this.nisha.value
      this.fullName.value
      return state.first + ' ' + state.last
    },
    greeting() {
      return 'greetings ' + this.fullName.value
    },
    nisha() {
      this.fullName.value
      this.greeting.value
      return 'Nisha!'
    },
    test: (state) => {
      state.first
    },
  },
  actions: {
    myAction() {
      this.computed.nisha.value
      this.actions.otherAction()
      return 4
    },
    otherAction() {
      this.actions.myAction
      return 5
    },
  },
}
*/
