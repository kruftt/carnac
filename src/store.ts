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
  getters: G = {} as G,
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
      getters[name](state.value as Readonly<S>, computedGetters)
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
    fullName(state, getters) {
      return state.first + ' ' + state.last
    },
    greeting(state, getters) {
      return 'greetings ' + getters.fullName.value
    },
  },
  {
    myAction() {
      this.getters.greeting.value // string
    },
  }
)

const myStore = useMyStore()
