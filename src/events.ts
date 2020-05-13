import { GenericStore } from './types'

export type StoreSubscriber<store extends GenericStore> = {
  (evt: StoreEvent, store: store): void
}

export interface StoreEvent {
  type: string
}

export type StoreBatchEvent = StoreEvent & {
  _isBatch: true
  events: StoreEvent[]
}

export function useEvents<store extends GenericStore>(store: store) {
  const subscribers: StoreSubscriber<store>[] = []

  function subscribe(callback: StoreSubscriber<store>) {
    subscribers.push(callback)
    return function unsubscribe() {
      const i = subscribers.indexOf(callback)
      if (i > -1) subscribers.splice(i, 1)
    }
  }

  let activeBatch: StoreEvent[] | undefined
  const batchStack: StoreEvent[][] = []
  function notify<Evt extends StoreEvent>(evt: Evt) {
    activeBatch
      ? activeBatch.push(evt)
      : subscribers.forEach((callback) => callback(evt, store))
  }

  function batch(callback: <Evt extends StoreEvent>() => void | Evt) {
    if (activeBatch) batchStack.push(activeBatch)
    activeBatch = []
    const cbEvt = callback()
    const evt: StoreBatchEvent = {
      type: 'batch',
      _isBatch: true,
      events: activeBatch,
    }

    activeBatch = batchStack.pop()
    notify({ ...evt, ...cbEvt })
  }

  return {
    subscribe,
    notify,
    batch,
  }
}
