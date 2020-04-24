import { Ref, ref, computed } from 'vue'
import {
  BoundStoreActions,
  BoundStoreComputed,
  DeepReadonly,
  ImmutableStore,
  MutableStore,
  RawStoreActions,
  RawStoreComputed,
  StateValue,
  isStateValue,
} from './types'

export default function buildStore<
  S extends StateValue,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(
  stateParam: S | (() => S) = () => ({} as S),
  rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C,
  rawActions: A & ThisType<MutableStore<S, C, A>> = {} as A
): () => ImmutableStore<S, C, A> {
  const store: ImmutableStore<S, C, A> = {} as ImmutableStore<S, C, A>

  let stateRef: Ref<StateValue>
  // transform state to ref
  if (isStateValue(stateParam)) {
    stateRef = ref(stateParam)
  } else {
    stateRef = ref(stateParam())
  }
  // const state = ref(initialState || buildState())
  Object.defineProperty(store, 'state', {
    get() {
      return stateRef.value
    },
    set(value) {
      return (stateRef.value = value)
    },
  })

  // computed getters
  const computedGetters = {} as BoundStoreComputed<RawStoreComputed<StateValue>>
  for (const fn in rawComputed) {
    computedGetters[fn] = computed(() =>
      rawComputed[fn].call(computedGetters, stateRef.value as DeepReadonly<S>)
    )
  }

  // bind actions to this context
  const boundActions = {} as BoundStoreActions<A>
  for (const name in rawActions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boundActions[name] = function (...args: Array<any>) {
      return rawActions[name].apply(store as MutableStore<S, C, A>, args)
    }
  }

  // create store object
  store.computed = computedGetters as BoundStoreComputed<C>
  store.actions = boundActions as BoundStoreActions<A>

  // wrap in use function
  function useStore() {
    return store
  }

  // return
  return useStore
}

function buildState<S extends StateValue>(stateParam: (() => S) | S = () => ({} as S)) {
  return function buildComputed<C extends RawStoreComputed<S>>(
    rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C
  ) {
    return function buildActions<A extends RawStoreActions>(
      rawActions: A & ThisType<MutableStore<S, C, A>> = {} as A
    ) {
      return buildStore(stateParam, rawComputed, rawActions)
    }
  }
}

const buildComputed = buildState({ dave: 'patel', counter: 1 })

const buildActions = buildComputed({
  doubleCounter(state): number {
    state.dave
    return state.counter * 2
  },
  quadrupleCounter(): number {
    const quad = this.doubleCounter.value * 2
    return quad
  },
})

const useDaveStore = buildActions({
  myAction(): number {
    return this.computed.doubleCounter.value
  },
  myOtherAction(): number {
    this.state.counter
    this.computed.doubleCounter.value
    return this.actions.myAction()
  },
})

const daveStore = useDaveStore()
daveStore.computed.doubleCounter.value

const useMyStore = buildStore(
  () => ({ first: 'super', last: 'man', foo: { bar: 'baz' } }),
  {
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
  {
    myAction() {
      this.computed.nisha.value
      this.actions.otherAction()
      return 4
    },
    otherAction() {
      this.actions.myAction
      return 5
    },
  }
)

const myStore = useMyStore()
myStore
