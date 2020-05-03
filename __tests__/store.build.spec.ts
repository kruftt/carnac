import { buildStore } from 'carnac'
import { testId1, testConfig1, testStateBuilder1 } from './utils'

describe('buildStore', () => {
  it('accepts minimal config objects', () => {
    const store = buildStore({ id: testId1 })()
    expect(store.id).toBe(testId1)
  })

  it('accepts curried calls with only an id', () => {
    const store = buildStore(testId1)()()()()
    expect(store.id).toBe(testId1)
  })

  it('initializes computed properties', () => {
    const store = buildStore(testConfig1)()
    expect(store.computed.computedA.value).toBe('string')
    expect(store.computed.getterSetter.value).toBe(0)
    store.computed.getterSetter.value = 1
    expect(store.computed.getterSetter.value).toBe(1)
  })

  it('initializes actions object', () => {
    const store = buildStore(testConfig1)()
    store.state.b = 42
    store.actions.resetB()
    expect(store.state.b).toBe(0)
  })

  it('resets the state', () => {
    const store = buildStore(testConfig1)()
    store.state.a = 'changed'
    store.state.b = 42
    store.state.foo.bar = 'changed'
    store.reset()
    expect(store.state).toEqual(testStateBuilder1())
  })
})
