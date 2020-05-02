import { buildStore } from 'carnac'

describe('buildStore', () => {
  const id = 'test'

  it('accepts minimal config object', () => {
    const useTestStore = buildStore({ id })
    const testStore = useTestStore()
    expect(testStore.id).toBe(id)
  })

  it('accepts curried call with only an id', () => {
    const bindState = buildStore(id)
    const bindComputed = bindState()
    const bindActions = bindComputed()
    const useTestStore = bindActions()
    const testStore = useTestStore()
    expect(testStore.id).toBe(id)
  })

  describe('options', () => {
    it('properly initializes options arguments', () => {
      const useTestStore = buildStore({
        id,
        state: () => {
          return {
            a: 'string',
            b: 0,
            foo: {
              bar: 'baz',
            },
          }
        },
        computed: {
          computedA(state) {
            return state.a
          },
          getterSetter: {
            get(state) {
              return state.b
            },
            set(state, val) {
              return (state.b = val)
            },
          },
        },
        actions: {
          resetB() {
            this.state.b = 0
          },
        },
      })
      const store = useTestStore()
      expect(store.computed.computedA.value).toBe('string')
      expect(store.computed.getterSetter.value).toBe(0)
      store.computed.getterSetter.value = 1
      expect(store.computed.getterSetter.value).toBe(1)
      store.actions.resetB()
      expect(store.computed.getterSetter.value).toBe(0)
    })
  })
})
