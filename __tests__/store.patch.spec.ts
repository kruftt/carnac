import { testConfig1, testStateBuilder1 } from './utils'
import { buildStore } from 'carnac'

describe('patch', () => {
  const useTestStore = buildStore(testConfig1)
  const store = useTestStore()

  afterEach(() => {
    store.reset()
  })

  it('assigns multiple, nested values', () => {
    const patch = {
      a: 'a changed',
      b: 42,
      foo: {
        bar: 'bar changed',
      },
    }
    store.patch(patch)
    expect(store.state).toEqual({
      ...testStateBuilder1(),
      ...patch,
    })
  })

  it('returns an inverse patch of old values', () => {
    const inverse = store.patch({
      a: 'a changed',
      b: 42,
      foo: {
        bar: 'bar changed',
      },
    })
    store.patch(inverse)
    expect(store.state).toEqual(testStateBuilder1())
  })

  it('accepts a target object', () => {
    const patch = { bar: 'bar changed' }
    const foo = store.state.foo
    store.patch(foo, patch)
    expect(store.state).toEqual({
      ...testStateBuilder1(),
      foo: patch,
    })
  })
})
