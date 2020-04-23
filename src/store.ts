import { ref, computed } from 'vue'
import {
  BoundStoreActions,
  BoundStoreComputed,
  DeepReadonly,
  ImmutableStore,
  MutableStore,
  RawStoreActions,
  RawStoreComputed,
  StateTree,
} from './types'

export default function buildStore<
  S extends StateTree,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(
  buildState: () => S = () => ({} as S),
  rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C,
  rawActions: A & ThisType<MutableStore<S, C, A>> = {} as A,
  initialState?: S
): () => ImmutableStore<S, C, A> {
  const store: ImmutableStore<S, C, A> = {} as ImmutableStore<S, C, A>

  // transform state to ref
  const state = ref(initialState || buildState())

  // computed getters
  const computedGetters = {} as BoundStoreComputed<RawStoreComputed<StateTree>>
  for (const fn in rawComputed) {
    computedGetters[fn] = computed(() =>
      rawComputed[fn].call(computedGetters, state.value as Readonly<S>)
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
  store.actions = boundActions

  // wrap in use function
  function useStore() {
    return store
  }

  // return
  return useStore
}

const useMyStore = buildStore(
  () => ({ first: 'super', last: 'man', foo: { bar: 'baz' } }),
  {
    fullName(state): string {
      this.nisha.value
      this.fullName.value
      return state.first + ' ' + state.last
    },
    greeting(): string {
      return 'greetings ' + this.fullName.value
    },
    nisha(): 'Nisha!' {
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
