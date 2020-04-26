import { GenericStore } from './types'
type StoreRecord = Record<string, GenericStore>

export const stores = {} as StoreRecord

/*
const providers: WeakMap<object, StoreRecord> = new WeakMap()

let _providerKey: object = {}
export function getProviderKey(): object {
  return _providerKey
}
export function setProviderKey(key: object) {
  _providerKey = key
}

export function setStore(store: GenericStore, providerKey?: object) {
  if (providerKey) setProviderKey(providerKey)
  else providerKey = getProviderKey()

  let record = providers.get(_providerKey)
  if (!record) {
    record = {} as StoreRecord
    providers.set(providerKey, record)
  }
  record[store.id] = store
}

export function getStore(id: string, providerKey?: object): GenericStore {
  providerKey && setProviderKey(providerKey)
  providerKey = getProviderKey()
  const record = providers.get(providerKey)
  if (!record) throw new Error('Invalid store provider key')
  const store = record[id]
  if (!store) throw new Error('Invalid store id')
  return store
}
*/
