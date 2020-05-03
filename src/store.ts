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
  store.reset = function () {
    stateRef.value = stateParam()
  }

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

  let activeBatch: StoreEvent[] | null = null
  const batchStack: StoreEvent[][] = []
  store.notify = function (evt) {
    activeBatch
      ? activeBatch.push(evt)
      : subscribers.forEach((callback) => callback(evt, stateRef.value))
  }
  const notify = store.notify

  store.batch = function (callback: () => void | StoreEvent) {
    if (activeBatch) batchStack.push(activeBatch)
    activeBatch = []
    const cbEvt = callback()
    const evt: StoreBatchEvent = {
      type: 'batch',
      _isBatch: true,
      events: activeBatch,
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    activeBatch = batchStack.length ? batchStack.pop()! : null
    notify({ ...evt, ...cbEvt })
  }

  let activeMutation = false
  watch(
    () => stateRef.value,
    () => {
      if (!activeMutation) notify({ type: 'raw' })
      // if (!activeBatch && !activeMutation) notify({ type: 'raw' })
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
    if (arg1 === undefined) {
      arg1 = arg0 as m
      arg0 = stateRef.value as s
    }

    activeMutation = true
    const [rvalue, inverseMutation] = performMutation(arg0 as s, arg1)

    const evt: StorePerformEvent<s> = {
      type: 'perform',
      target: arg0 as s,
      mutation: arg1,
      inverse: inverseMutation,
    }

    notify(evt)
    activeMutation = false

    return {
      returnValues: rvalue,
      inverse: inverseMutation as any,
    }
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
            name,
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
    boundActions[name] = function (...args: Array<any>) {
      const result = rawActions[name].apply(store, args)
      return result
    }
  }

  let _bundle: any = null
  store.bundle = function () {
    return _bundle
      ? _bundle
      : (_bundle = {
          ...toRefs(stateRef.value),
          ...(boundComputed as BoundStoreComputed<C>),
          ...boundActions,
          patch: store.patch,
          perform: store.perform,
        })
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
export function buildStore<
  S,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
>(arg: StoreConfig<S, C, A>): () => Store<S, C, A>
// prettier-ignore
export function buildStore(arg: string):
  <S>(stateParam?: () => S) =>
  <C extends RawStoreComputedProps<S>>(rawComputed?: C & ThisType<BoundStoreComputed<C>>) =>
  <A extends RawStoreActions>(rawActions?: A & ThisType<Store<S, C, A>>) =>
  () => Store<S, C, A>
// prettier-ignore
export function buildStore <
  S,
  C extends RawStoreComputedProps<S>,
  A extends RawStoreActions
> (arg: StoreConfig<S, C, A> | string)
{
  return (typeof arg === 'string') ? bindId(arg) : _buildStore(arg.id, arg.state, arg.computed, arg.actions)
}
