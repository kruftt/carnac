import { Ref, ref, computed, toRefs, watch } from 'vue'
import { stores } from './manager'
import { applyPatch } from './patch'
import { performMutation } from './perform'
import {
  BoundStoreActions,
  BoundStoreComputed,
  Store,
  RawStoreActions,
  RawStoreComputedGetter,
  RawStoreComputedProps,
  RootState,
  StoreConfig,
  StoreSubscriber,
  StorePatchEvent,
  isPlainObject,
  RawStoreWritableComputed,
  StoreComputedPropertyEvent,
  StoreRawEvent,
  StoreEvent,
  DeepPartialPatch,
  StoreBatchEvent,
  DeepPartialMutator,
  StorePerformEvent,
  GenericCollection,
} from './types'

function _buildStore<
  S extends RootState,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
>(
  id: string,
  stateParam: () => S = () => ({} as S),
  rawComputed: C & ThisType<BoundStoreComputed<C>> = {} as C,
  rawActions: A & ThisType<Store<S, C, A>> = {} as A
): () => Store<S, C, A> {
  const store = {} as Store<S, C, A>

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

  const subscribers: StoreSubscriber<S>[] = []
  store.subscribe = function (callback: StoreSubscriber<S>) {
    subscribers.push(callback)
    return function unsubscribe() {
      subscribers.splice(subscribers.indexOf(callback), 1)
    }
  }

  let currentBatch: StoreEvent[] | null = null
  const batchStack: StoreEvent[][] = []
  store.notify = function (evt) {
    currentBatch
      ? currentBatch.push(evt)
      : subscribers.forEach((callback) => callback(evt, stateRef.value))
  }
  const notify = store.notify

  store.startBatch = function () {
    if (currentBatch) batchStack.push(currentBatch)
    currentBatch = []
  }

  store.finishBatch = function <Evt extends StoreEvent>(evt: Evt) {
    if (currentBatch === null) {
      console.warn('Called finishBatch with no active batch.')
      return
    }
    const batchEvent: StoreBatchEvent = {
      ...evt,
      type: evt ? evt.type : 'batch',
      events: currentBatch,
    }
    currentBatch = batchStack.length ? (batchStack.pop() as StoreEvent[]) : null
    notify(batchEvent)
  }

  let activeMutation = false
  watch(
    () => stateRef.value,
    () => {
      if (!currentBatch && !activeMutation) {
        const evt: StoreRawEvent = {
          type: 'raw',
        }
        notify(evt)
      }
    },
    {
      deep: true,
      flush: 'sync',
    }
  )

  store.patch = function <s extends RootState, p extends DeepPartialPatch<s>>(
    arg0: s | p,
    arg1?: p
  ) {
    if (arg1 === undefined) {
      arg1 = arg0 as p
      arg0 = stateRef.value as s
    }

    activeMutation = true
    const oldValues = applyPatch(arg0 as s, arg1)
    const evt: StorePatchEvent = {
      type: 'patch',
      target: arg0 as s,
      patch: arg1,
      oldValues,
    }
    notify(evt)
    activeMutation = false
    return oldValues
  }

  store.perform = function <
    s extends RootState | GenericCollection,
    m extends DeepPartialMutator<s>
  >(arg0: s | m, arg1?: m) {
    activeMutation = true

    if (arg1 === undefined) {
      arg1 = arg0 as m
      arg0 = stateRef.value as s
    }

    const [rvalue, inverseMutation] = performMutation(arg0 as s, arg1)

    // const [rvalue, inverseMutation] = performMutation(target, mutation)
    const evt: StorePerformEvent<s> = {
      type: 'perform',
      target: arg0 as s,
      mutation: arg1,
      inverse: inverseMutation,
    }
    notify(evt)
    activeMutation = false
    // return { value: rvalue, inverse: inverseMutation }
    return rvalue
  }

  const boundComputed = {} as BoundStoreComputed<RawStoreComputedProps<S>>
  for (const name in rawComputed) {
    const rawProp = rawComputed[name] as
      | RawStoreComputedGetter<S>
      | RawStoreWritableComputed<S>
    if (isPlainObject<RawStoreWritableComputed<S>>(rawProp)) {
      const { get, set } = rawProp
      boundComputed[name] = computed({
        get: () => get.call(boundComputed, stateRef.value),
        set: function (val) {
          activeMutation = true
          const oldValue = get.call(boundComputed, stateRef.value)
          const result = set.call(boundComputed, stateRef.value, val)
          const evt: StoreComputedPropertyEvent = {
            type: 'computed',
            value: val,
            oldValue,
          }
          notify(evt)
          activeMutation = false
          return result
        },
      })
    } else {
      boundComputed[name] = computed(() =>
        rawProp.call(boundComputed, stateRef.value)
      )
    }
  }
  store.computed = boundComputed as BoundStoreComputed<C>

  const boundActions = (store.actions = {} as BoundStoreActions<A>)
  for (const name in rawActions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boundActions[name] = function (...args: Array<any>) {
      const result = rawActions[name].apply(store, args)
      return result
    }
  }

  store.bundle = function () {
    return {
      ...toRefs(stateRef.value),
      ...(boundComputed as BoundStoreComputed<C>),
      ...boundActions,
      patch: store.patch,
      // perform: store.perform
    }
  }

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
    return function bindComputed<C extends RawStoreComputedProps<S>>(
      rawComputed: C & ThisType<BoundStoreComputed<C>> = {} as C
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
export function buildStore(arg: string):
  <S>(stateParam?: () => S) =>
  <C extends RawStoreComputedProps<S>>(rawComputed?: C & ThisType<BoundStoreComputed<C>>) =>
  <A extends RawStoreActions>(rawActions?: A & ThisType<Store<S, C, A>>) =>
  () => Store<S, C, A>
// prettier-ignore
export function buildStore<
  S,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
>(arg: StoreConfig<S, C, A>): () => Store<S, C, A>
// prettier-ignore
export function buildStore <
  S,
  C extends RawStoreComputedProps<S>,
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
        // state.foo = 'test'
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
