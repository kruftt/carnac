import { testConfig1 } from './utils'
import { buildStore } from 'carnac'

describe('store.perform', () => {
  const useTestStore = buildStore(testConfig1)
  const store = useTestStore()

  afterEach(() => {
    store.reset()
  })

  it('performs basic collection operations', () => {
    const result = store.perform({
      arr: { push: [1, 2] },
      map: { set: ['one', 1] },
      set: { add: [1] },
    })
    result
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

  it('returns values from the operations', () => {
    const result = store.perform({
      arr: [{ push: [1] }, { pop: [] }],
      map: [{ set: ['one', 1] }, { set: ['one', 2] }],
      set: [{ add: [1] }, { add: [2] }, { delete: [1] }],
    })

    const resultMap = new Map([['one', 2]])
    const resultSet = new Set([2])
    expect(result.returnValues).toEqual({
      arr: [{ push: 1 }, { pop: 1 }],
      map: [{ set: resultMap }, { set: resultMap }],
      set: [{ add: resultSet }, { add: resultSet }, { delete: true }],
    })
  })

  it('returns basic inverse operations', () => {
    const result = store.perform({
      arr: [{ push: [1] }, { push: [2] }],
      map: [{ set: ['one', 1] }, { set: ['two', 2] }],
      set: [{ add: [1] }, { add: [2] }],
    })
    store.perform(result.inverse)
    expect(store.state.arr).toEqual([])
    expect(store.state.map).toEqual(new Map())
    expect(store.state.set).toEqual(new Set())
  })

  it('returns inverse operations for clear', () => {
    store.perform({
      map: [{ set: ['one', 1] }, { set: ['two', 2] }],
      set: [{ add: [1] }, { add: [2] }],
    })
    const result = store.perform({
      map: { clear: [] },
      set: { clear: [] },
    })
    store.perform(result.inverse)
    expect(store.state.map).toEqual(
      new Map([
        ['one', 1],
        ['two', 2],
      ])
    )
    expect(store.state.set).toEqual(new Set([1, 2]))
  })
})
