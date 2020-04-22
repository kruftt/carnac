import { ref, computed } from 'vue'
import {
  StateTree,
  RawStoreActions,
  RawStoreGetters,
  ImmutableStore,
  ComputedStoreGetters,
  BoundStoreActions,
  MutableStore,
} from './types'

export default function buildStore<
  S extends StateTree,
  G extends RawStoreGetters<S>,
  A extends RawStoreActions<S, G>
>(
  buildState: () => S = () => ({} as S),
  // getters: G = {} as G,
  // getters: G & ThisType<ImmutableStore<S, G, A>> = {} as G,
  getters: G & ThisType<ComputedStoreGetters<S, G>> = {} as G,
  actions: A = {} as A,
  initialState?: S
): () => ImmutableStore<S, G, A> {
  const store: ImmutableStore<S, G, A> = {} as ImmutableStore<S, G, A>

  // transform state to ref
  const state = ref(initialState || buildState())

  // computed getters
  const computedGetters: ComputedStoreGetters<S, G> = {} as ComputedStoreGetters<S, G>
  for (const name in getters) {
    computedGetters[name] = computed(() =>
      getters[name].call(computedGetters, state.value as Readonly<S>)
    )
  }

  // bind actions to this context
  const boundActions: BoundStoreActions<S, G, A> = {} as BoundStoreActions<S, G, A>
  for (const name in actions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boundActions[name] = function (...args: Array<any>) {
      return actions[name].apply(store as MutableStore<S, G, A>, args)
    }
  }

  // create store object
  store.getters = computedGetters
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
      return state.first + ' ' + state.last
    },
    greeting(state): string {
      return 'greetings ' + this.fullName.value // string
    },
    nisha(): 'Nisha!' {
      this.fullName.value
      this.greeting.value
      return 'Nisha!'
    },
  },
  {
    myAction() {
      this.getters // :string
    },
    otherAction() {
      // this.actions.myAction // (args: any[]) => any
      return 5
    },
  }
)

const myStore = useMyStore()

const o = {
  methods() {
    this.methods
  },
}
