import { testConfig1, TestStore1 } from './utils'
import { buildStore } from 'carnac'

describe('store.subscribe', () => {
  let store: TestStore1
  let fn: jest.Mock
  let unsub: () => void

  beforeEach(() => {
    store = buildStore(testConfig1)()
    fn = jest.fn()
  })

  it('notifies subscribers of raw state mutations', () => {
    unsub = store.subscribe(fn)
    store.state.a = 'changed'
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith({ type: 'raw' }, store.state)
  })

  it('allows subscribers to unsubscribe', () => {
    unsub = store.subscribe(fn)
    store.state.a = 'changed'
    expect(fn.mock.calls.length).toBe(1)
    unsub()
    store.state.a = 'changed again'
    expect(fn.mock.calls.length).toBe(1)
  })

  it('notifies subscribers of computed state mutations', () => {
    unsub = store.subscribe(fn)
    store.computed.getterSetter.value = 42
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith(
      { type: 'computed', name: 'getterSetter', value: 42, oldValue: 0 },
      store.state
    )
  })

  it('notifies subscribers of patch events', () => {
    unsub = store.subscribe(fn)
    store.patch({
      a: 'changed',
      b: 42,
    })
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith(
      {
        type: 'patch',
        target: store.state,
        patch: {
          a: 'changed',
          b: 42,
        },
        oldValues: {
          a: 'string',
          b: 0,
        },
      },
      store.state
    )
  })

  it('notifies subscribers of perform events', () => {
    unsub = store.subscribe(fn)
    const mutation = { arr: { push: [4, 5, 6] } }
    store.perform(mutation)
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith(
      {
        type: 'perform',
        target: store.state,
        mutation,
        inverse: { arr: { splice: [0, 3] } },
      },
      store.state
    )
  })

  it('notifies subscribers of custom events', () => {
    unsub = store.subscribe(fn)
    store.notify({ type: 'test' })
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith({ type: 'test' }, store.state)
  })
})
