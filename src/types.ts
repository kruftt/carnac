/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComputedRef } from 'vue'

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }
export type RootState = Record<string | number | symbol, any>
type ArrayMutators =
  | 'push'
  | 'pop'
  | 'splice'
  | 'fill'
  | 'sort'
  | 'reverse'
  | 'shift'
  | 'unshift'
type MapMutators = 'clear' | 'delete' | 'set'
type SetMutators = 'add' | 'clear' | 'delete'

export type DeepPartialMutator<S> = {
  [k in keyof S]?: S[k] extends Array<infer T>
    ? { [k in ArrayMutators]?: Parameters<Array<T>[k]> }
    : S[k] extends Map<infer K, infer V>
    ? { [k in MapMutators]?: Parameters<Map<K, V>[k]> }
    : S[k] extends Set<infer T>
    ? { [k in SetMutators]?: Parameters<Set<T>[k]> }
    : never
}

// Uses: discriminate between state generator and state
//       discriminate between value and nested state
export function isRootState<R extends RootState>(a: unknown): a is R {
  return a && typeof a === 'object' && a !== null
}

export type RawStoreComputed<S extends RootState> = {
  [getter: string]: (state: DeepReadonly<S>) => any
}

// using extends/infer prevents the type signature from containing the state object twice
export type BoundStoreComputed<C> = C extends RawStoreComputed<infer S>
  ? { [k in keyof C]: ComputedRef<ReturnType<C[k]>> }
  : never

export type RawStoreActions = {
  [key: string]: (...args: Array<any>) => any
}

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
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = {
  id: string
  actions: BoundStoreActions<A>
  patch: (changes: DeepPartial<S>) => DeepPartial<S>
  notify: (evt: StoreEvent<ImmutableStore<S, C, A>>) => void
}

export type GenericStore = BaseStore<
  RootState,
  RawStoreComputed<RootState>,
  RawStoreActions
>

export type MutableStore<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = BaseStore<S, C, A> & {
  state: S
  computed: BoundStoreComputed<C>
}

export type ImmutableStore<
  S extends RootState,
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

export type BaseDepot<
  M,
  C extends RawDepotComputed<M>,
  A extends RawDepotActions
> = {
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

export type StoreConfig<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> = {
  id: string
  state: S | (() => S)
  computed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>>
  actions: A & ThisType<MutableStore<S, C, A>>
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
