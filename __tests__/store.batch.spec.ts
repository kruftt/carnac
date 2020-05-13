import { testConfig1, TestStore1 } from './utils'
import { buildStore } from 'carnac'

describe('store.batch', () => {
  let store: TestStore1
  let fn: jest.Mock
  let unsub: () => void

  beforeEach(() => {
    store = buildStore(testConfig1)()
    fn = jest.fn()
  })

  it('batches raw state mutation notifications', () => {
    unsub = store.subscribe(fn)
    store.batch(() => {
      store.state.a = 'changed'
      store.state.b = 42
      store.state.foo.bar = 'changed'
    })
    expect(fn.mock.calls.length).toBe(1)
    const rawEvt = { type: 'raw' }
    expect(fn).toHaveBeenCalledWith(
      { type: 'batch', _isBatch: true, events: [rawEvt, rawEvt, rawEvt] },
      store
    )
    unsub()
  })

  it('batches events of various types', () => {
    const patch = {
      foo: {
        bar: 'changed',
      },
    }
    const oldPatch = {
      foo: {
        bar: 'baz',
      },
    }
    const mutation = {
      arr: { push: [1, 2, 3] },
    }
    const inverse = {
      arr: { splice: [0, 3] },
    }

    unsub = store.subscribe(fn)
    store.batch(() => {
      store.state.a = 'changed'
      store.computed.getterSetter.value = 42
      store.patch(patch)
      store.perform(mutation)
    })
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith(
      {
        type: 'batch',
        _isBatch: true,
        events: [
          { type: 'raw' },
          { type: 'computed', name: 'getterSetter', value: 42, oldValue: 0 },
          { type: 'patch', target: store.state, patch, oldPatch },
          {
            type: 'perform',
            target: store.state,
            mutation,
            inverse,
          },
        ],
      },
      store
    )
  })

  it('supports nested batches of events', () => {
    unsub = store.subscribe(fn)
    store.batch(() => {
      store.state.a = 'changed'
      store.batch(() => {
        store.computed.getterSetter.value = 42
        store.state.foo.bar = 'changed'
      })
    })
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith(
      {
        type: 'batch',
        _isBatch: true,
        events: [
          { type: 'raw' },
          {
            type: 'batch',
            _isBatch: true,
            events: [
              {
                type: 'computed',
                name: 'getterSetter',
                value: 42,
                oldValue: 0,
              },
              { type: 'raw' },
            ],
          },
        ],
      },
      store
    )
  })

  it('allows custom batch events to be returned', () => {
    unsub = store.subscribe(fn)
    store.batch(() => {
      store.state.a = 'changed'
      store.computed.getterSetter.value = 42
      return {
        type: 'testEvent',
        data: 'custom',
      }
    })
    expect(fn.mock.calls.length).toBe(1)
    expect(fn).toHaveBeenCalledWith(
      {
        type: 'testEvent',
        _isBatch: true,
        data: 'custom',
        events: [
          { type: 'raw' },
          { type: 'computed', name: 'getterSetter', value: 42, oldValue: 0 },
        ],
      },
      store
    )
  })
})
