import {} from './provider'
import {
  BoundStoreActions,
  BoundStoreComputed,
  DeepReadonly,
  ImmutableStore,
  MutableStore,
  RawStoreActions,
  RawStoreComputed,
  RootState,
  isRootState,
  StoreConfig,
} from './types'
import { Ref, ref, computed } from 'vue'

function _buildStore<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(
  id: string = Math.random().toString(),
  stateParam: S | (() => S) = () => ({} as S),
  rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C,
  rawActions: A & ThisType<MutableStore<S, C, A>> = {} as A
): () => ImmutableStore<S, C, A> {
  const store: ImmutableStore<S, C, A> = {} as ImmutableStore<S, C, A>
  const stateRef: Ref<S> = isRootState<S>(stateParam)
    ? ref(stateParam)
    : ref(stateParam())

  Object.defineProperty(store, 'state', {
    get() {
      return stateRef.value
    },
    set(value) {
      return (stateRef.value = value)
    },
  })

  Object.defineProperty(store, 'id', {
    get() {
      return id
    },
  })

  const computedGetters = {} as BoundStoreComputed<RawStoreComputed<RootState>>
  for (const name in rawComputed) {
    computedGetters[name] = computed(() =>
      rawComputed[name].call(computedGetters, stateRef.value as DeepReadonly<S>)
    )
  }

  const boundActions = {} as BoundStoreActions<A>
  for (const name in rawActions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boundActions[name] = function (...args: Array<any>) {
      return rawActions[name].apply(store as MutableStore<S, C, A>, args)
    }
  }

  store.computed = computedGetters as BoundStoreComputed<C>
  store.actions = boundActions as BoundStoreActions<A>

  function useStore() {
    return store
  }

  return useStore
}

function bindId(id: string) {
  return function bindState<S extends RootState>(
    stateParam: (() => S) | S = () => ({} as S)
  ) {
    return function bindComputed<C extends RawStoreComputed<S>>(
      rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C
    ) {
      return function bindActions<A extends RawStoreActions>(
        rawActions: A & ThisType<MutableStore<S, C, A>> = {} as A
      ) {
        return _buildStore(id, stateParam, rawComputed, rawActions)
      }
    }
  }
}

function buildStore(
  arg: string
): <S extends RootState>(
  stateParam?: S | (() => S)
) => <C extends RawStoreComputed<S>>(
  rawComputed?: C & ThisType<DeepReadonly<BoundStoreComputed<C>>>
) => <A extends RawStoreActions>(
  rawActions?: A & ThisType<MutableStore<S, C, A>>
) => () => ImmutableStore<S, C, A>
function buildStore<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(arg: StoreConfig<S, C, A>): () => ImmutableStore<S, C, A>
function buildStore<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(arg: StoreConfig<S, C, A> | string) {
  return typeof arg === 'string'
    ? bindId(arg)
    : _buildStore(arg.id, arg.state, arg.computed, arg.actions)
}

// _buildStore({
//   id: 'test',
//   state: { foo: 'bar' },
//   computed: {
//     fooBar(): string {
//       return 'foo'
//     },
//     hello() {
//       this.fooBar.value
//       return 'Hello ' + this.fooBar.value + '!'
//     },
//     f: function (): string {
//       return 'ban'
//     },
//   },
//   actions: {
//     myAction() {
//       this.computed.hello.value
//     },
//   },
// })

const buildS = buildStore('dave store')

const buildComputed = buildS({ dave: 'patel', counter: 1 })

const buildActions = buildComputed({
  doubleCounter(state) {
    this.quadrupleCounter.value
    state.dave
    return state.counter * 2
  },
  quadrupleCounter(): number {
    const quad = this.doubleCounter.value * 2
    return quad
  },
})

const useCurriedStore = buildActions({
  myAction(): number {
    return this.computed.doubleCounter.value
  },
  myOtherAction(): number {
    this.state.counter
    this.computed.doubleCounter.value
    return this.actions.myAction()
  },
})

const daveStore = useCurriedStore()
daveStore.computed.doubleCounter.value
daveStore.actions.myAction()

const useMyStore = buildStore({
  id: 'my store',
  state: () => ({
    first: 'super',
    last: 'man',
    foo: { bar: 'baz' },
  }),
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
})

const myStore = useMyStore()
myStore
