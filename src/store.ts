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
  A extends RawStoreActions
>(
  buildState: () => S = () => ({} as S),
  // getters: G = {} as G,
  // getters: G & ThisType<ImmutableStore<S, G, A>> = {} as G,
  getters: G & ThisType<ComputedStoreGetters<G>> = {} as G,
  actions: A & ThisType<MutableStore<S, G, A>> = {} as A,
  initialState?: S
): () => ImmutableStore<S, G, A> {
  const store: ImmutableStore<S, G, A> = {} as ImmutableStore<S, G, A>

  // transform state to ref
  const state = ref(initialState || buildState())

  // computed getters
  // const computedGetters = {} as { [index: string]: Ref<any> }
  // const computedGetters = {} as ComputedStoreGetters<G>
  const computedGetters = {} as ComputedStoreGetters<RawStoreGetters<StateTree>>
  for (const name in getters) {
    computedGetters[name] = computed(() =>
      getters[name].call(computedGetters, state.value as Readonly<S>)
    )
  }

  // bind actions to this context
  const boundActions = {} as BoundStoreActions<A>
  for (const name in actions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boundActions[name] = function (...args: Array<any>) {
      return actions[name].apply(store as MutableStore<S, G, A>, args)
    }
  }

  // create store object
  store.getters = computedGetters as ComputedStoreGetters<G>
  store.actions = boundActions

  // wrap in use function
  function useStore() {
    return store
  }

  // return
  return useStore
}

// type mystate = { first: string; last: string; foo: { bar: string } }
// type A = {
//   [index: string]: (arg: number) => any
// }

// type B<_A extends A> = {
//   [K in keyof _A]: ReturnType<_A[K]>
// }
// type B<_A extends A> = {
//   [K in keyof _A]: ReturnType<_A[K]>
// }

// function f<_A extends A>(a: _A & ThisType<B<_A>>) {
//   return null
// }

// f({
//   one: () => 1,
//   two() {
//     this.one
//   },
// })

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
      this.getters.nisha.value // :string
      const a = this.actions.otherAction()
    },
    otherAction() {
      // this.actions.myAction // (args: any[]) => any
      return 5
    },
  }
)

const myStore = useMyStore()

type ObjectDescriptor<D, M> = {
  data?: D
  methods?: M & ThisType<D & M> // Type of 'this' in methods is D & M
}

function makeObject<D, M>(desc: ObjectDescriptor<D, M>): D & M {
  const data: object = desc.data || {}
  const methods: object = desc.methods || {}
  return { ...data, ...methods } as D & M
}

const obj = makeObject({
  data: { x: 0, y: 0 },
  methods: {
    moveBy(dx: number, dy: number) {
      this.x += dx // Strongly typed this
      this.y += dy // Strongly typed this
    },
  },
})
