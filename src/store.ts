import { Ref, ref, computed, toRefs } from 'vue'
import { stores } from './manager'
import { applyPatch } from './patch'
import {
  BoundStoreActions,
  BoundStoreComputed,
  DeepReadonly,
  Store,
  RawStoreActions,
  RawStoreGetter,
  RawStoreComputed,
  RootState,
  StoreConfig,
  StoreEvent,
  StoreSubscriber,
  StorePatchEvent,
  MutableStore,
  isPlainObject,
  RawStorePropertyAccessors,
  StoreComputedPropertyEvent,
} from './types'

function _buildStore<
  S extends RootState,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(
  id: string,
  stateParam: () => S = () => ({} as S),
  rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C,
  rawActions: A & ThisType<MutableStore<S, C, A>> = {} as A
): () => Store<S, C, A> {
  type UserStore = Store<S, C, A>
  const store = {} as UserStore

  Object.defineProperty(store, 'id', {
    get() {
      return id
    },
  })

  const stateRef = ref(stateParam()) as Ref<S>

  Object.defineProperty(store, 'state', {
    get() {
      return stateRef.value
    },
    set(value) {
      return (stateRef.value = value)
    },
  })

  store.patch = function (patch) {
    const oldValues = applyPatch<S>(stateRef.value, patch)
    const evt: StorePatchEvent<S> = {
      type: 'patch',
      patch,
      oldValues,
    }
    store.notify(evt)
  }

  const boundComputed = {} as BoundStoreComputed<RawStoreComputed<S>>
  for (const name in rawComputed) {
    const rawProp = rawComputed[name] as
      | RawStoreGetter<S>
      | RawStorePropertyAccessors<S>
    if (isPlainObject<RawStorePropertyAccessors<S>>(rawProp)) {
      const { get, set } = rawProp
      boundComputed[name] = computed({
        get: () => get.call(boundComputed, stateRef.value),
        set: function (val) {
          const oldValue = get.call(boundComputed, stateRef.value)
          const result = set.call(boundComputed, stateRef.value, val)
          const evt: StoreComputedPropertyEvent = {
            type: 'computed',
            value: val,
            oldValue,
          }
          store.notify(evt)
          return result
        },
      })
    } else {
      boundComputed[name] = computed(() =>
        rawProp.call(boundComputed, stateRef.value as DeepReadonly<S>)
      )
    }
  }

  const boundActions = {} as BoundStoreActions<A>
  for (const name in rawActions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boundActions[name] = function (...args: Array<any>) {
      return rawActions[name].apply(store, args)
    }
  }

  const subscribers: StoreSubscriber<S>[] = []
  store.subscribe = function (callback: StoreSubscriber<S>) {
    subscribers.push(callback)
    return function unsubscribe() {
      subscribers.splice(subscribers.indexOf(callback), 1)
    }
  }

  store.notify = function (evt: StoreEvent) {
    subscribers.forEach((callback) =>
      callback(evt, stateRef.value as DeepReadonly<S>)
    )
  }

  Object.defineProperty(store, 'bundle', {
    get() {
      return {
        ...toRefs(stateRef.value),
        ...boundComputed,
        ...boundActions,
      }
    },
  })

  store.computed = boundComputed as BoundStoreComputed<C>
  store.actions = boundActions

  stores[id] = store
  return () => store
}

// prettier-ignore
function bindId(
  id: string
) {
  return function bindState<S>(
    stateParam: () => S = () => ({} as S)
  ) {
    return function bindComputed<C extends RawStoreComputed<S>>(
      rawComputed: C & ThisType<DeepReadonly<BoundStoreComputed<C>>> = {} as C
    ) {
      return function bindActions<A extends RawStoreActions>(
        rawActions: A & ThisType<Store<S, C, A>> = {} as A
      ) {
        return _buildStore(id, stateParam, rawComputed, rawActions)
      }
    }
  }
}

// prettier-ignore
function buildStore(arg: string):
  <S>(stateParam?: () => S) =>
  <C extends RawStoreComputed<S>>(rawComputed?: C & ThisType<DeepReadonly<BoundStoreComputed<C>>>) =>
  <A extends RawStoreActions>(rawActions?: A & ThisType<Store<S, C, A>>) =>
  () => Store<S, C, A>
// prettier-ignore
function buildStore<
  S,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
>(arg: StoreConfig<S, C, A>): () => Store<S, C, A>
// prettier-ignore
function buildStore <
  S,
  C extends RawStoreComputed<S>,
  A extends RawStoreActions
> (arg: StoreConfig<S, C, A> | string)
{
  return (typeof arg === 'string') ? bindId(arg) : _buildStore(arg.id, arg.state, arg.computed, arg.actions)
}

type _S = {
  foo: string
  bar: {
    (): boolean
    a: string
  }
}

function _bar() {
  return true
}
_bar.a = 'bar prop'

function _bs(): _S {
  return {
    foo: 'bar',
    bar: _bar,
  }
}

buildStore({
  id: 'test',
  state: _bs,
  computed: {
    getSet: {
      get() {
        // state.foo = 'test'  // Readonly!
        this.fooBar.value
        return 5
      },
      set(state) {
        this
        state.foo = 'test'
        return 5
      },
    },
    fooBar(state): string {
      this.hello.value
      this.getSet.value
      state.bar.a
      return 'foo'
    },
    hello(): string {
      this.fooBar.value
      return 'Hello ' + this.fooBar.value + '!'
    },
    f: function (): string {
      return 'ban'
    },
  },
  actions: {
    myAction() {
      this.computed.hello.value
      return 45
    },
    other() {
      this.actions.myAction()
    },
  },
})

// const buildS = buildStore('dave store')

// const buildComputed = buildS({ dave: 'patel', counter: 1 })

// const buildActions = buildComputed({
//   doubleCounter(state) {
//     this.quadrupleCounter.value
//     state.dave
//     return state.counter * 2
//   },
//   quadrupleCounter(): number {
//     const quad = this.doubleCounter.value * 2
//     return quad
//   },
// })

// const useCurriedStore = buildActions({
//   myAction(): number {
//     return this.computed.doubleCounter.value
//   },
//   myOtherAction(): number {
//     this.state.counter
//     this.computed.doubleCounter.value
//     return this.actions.myAction()
//   },
// })

// const daveStore = useCurriedStore()
// daveStore.computed.doubleCounter.value
// daveStore.actions.myAction()

// const useMyStore = buildStore({
//   id: 'my store',
//   state: () => ({
//     first: 'super',
//     last: 'man',
//     foo: { bar: 'baz' },
//   }),
//   computed: {
//     fullName(state) {
//       this.nisha.value
//       this.fullName.value
//       return state.first + ' ' + state.last
//     },
//     greeting() {
//       return 'greetings ' + this.fullName.value
//     },
//     nisha() {
//       this.fullName.value
//       this.greeting.value
//       return 'Nisha!'
//     },
//     test: (state) => {
//       state.first
//     },
//   },
//   actions: {
//     myAction() {
//       this.computed.nisha.value
//       this.actions.otherAction()
//       return 4
//     },
//     otherAction() {
//       this.actions.myAction
//       return 5
//     },
//   },
// })

// const myStore = useMyStore()
// myStore
