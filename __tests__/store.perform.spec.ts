import { testConfig1 } from './utils'
import { buildStore } from 'carnac'

describe('store.perform', () => {
  const useTestStore = buildStore(testConfig1)
  const store = useTestStore()

  afterEach(() => {
    store.reset()
  })

  it('performs basic collection operations', () => {
    store.perform({
      arr: { push: [1, 2] },
      map: { set: ['one', 1] },
      set: { add: [1] },
    })
    expect(store.state.arr).toEqual([1, 2])
    expect(store.state.map).toEqual(new Map([['one', 1]]))
    expect(store.state.set).toEqual(new Set([1]))
  })

  it('performs sequences of operations', () => {
    store.perform({
      arr: [{ push: [1] }, { push: [2] }],
      map: [{ set: ['one', 1] }, { set: ['two', 2] }],
      set: [{ add: [1] }, { add: [2] }],
    })
    expect(store.state.arr).toEqual([1, 2])
    expect(store.state.map).toEqual(
      new Map([
        ['one', 1],
        ['two', 2],
      ])
    )
    expect(store.state.set).toEqual(new Set([1, 2]))
  })
})
