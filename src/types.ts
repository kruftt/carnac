import { Ref, ref } from 'vue'

export type DeepReadonly<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> }
export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }

export type RawStoreGetter<S, RG extends RawStoreGetters<S>> = {
  (state?: DeepReadonly<S>, getters?: ComputedStoreGetters<S, RG>): unknown
}

export type RawStoreGetters<S> = {
  [key: string]: RawStoreGetter<S, RawStoreGetters<S>>
}

export type ComputedStoreGetters<S, RG extends RawStoreGetters<S>> = {
  [K in keyof RG]: Ref<ReturnType<RG[K]>>
}

export type RawStoreAction<S, RG extends RawStoreGetters<S>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this: Store<S, RG, RawStoreActions<S, RG>>, ...args: Array<any>): any
}

export type RawStoreActions<S, RG extends RawStoreGetters<S>> = {
  [key: string]: RawStoreAction<S, RG>
}

export type BoundStoreActions<
  S,
  RG extends RawStoreGetters<S>,
  RSA extends RawStoreActions<S, RG>
> = {
  [K in keyof RSA]: (
    ...args: RSA[K] extends (...args: infer _Args) => unknown ? _Args : never
  ) => ReturnType<RSA[K]>
}

export type Store<
  S,
  RG extends RawStoreGetters<S>,
  RSA extends RawStoreActions<S, RG>
> = {
  state: DeepReadonly<S>
  getters: ComputedStoreGetters<S, RG>
  actions: BoundStoreActions<S, RG, RSA>
  patch: (changes: DeepPartial<S>) => DeepPartial<S>
}

export type DepotModels<T> = {
  get: (id: string) => T | null
  where: () => DepotModels<T>
  first: (n: number) => DepotModels<T>
  patch: (changes: DeepPartial<T>) => Array<DeepPartial<T>>
  [Symbol.iterator]: Iterable<T>
}

export type RawDepotGetter<T> = {
  (models?: DepotModels<T>, getters?: RawDepotGetters<T>): unknown
}

export type RawDepotGetters<T> = {
  [key: string]: RawDepotGetter<T>
}

export type ComputedDepotGetters<T, RDG extends RawDepotGetters<T>> = {
  [K in keyof RDG]: Ref<ReturnType<RDG[K]>>
}

export type RawDepotAction<T, RDG extends RawDepotGetters<T>> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (this: Depot<T, RDG, RawDepotActions<T, RDG>>, ...args: Array<any>): any
}

export type RawDepotActions<T, RDG extends RawDepotGetters<T>> = {
  [key: string]: RawDepotAction<T, RDG>
}

export type BoundDepotActions<
  T,
  RDG extends RawDepotGetters<T>,
  RDA extends RawDepotActions<T, RDG>
> = {
  [K in keyof RDA]: (
    ...args: RDA[K] extends (...args: infer _Args) => unknown ? _Args : never
  ) => ReturnType<RDA[K]>
}

export type Depot<
  T,
  RDG extends RawDepotGetters<T>,
  RDA extends RawDepotActions<T, RDG>
> = {
  models: DepotModels<T>
  getters: ComputedDepotGetters<T, RDG>
  actions: BoundDepotActions<T, RDG, RDA>
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
