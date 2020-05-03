import { Store, StoreConfig } from 'src/types'

type TestId1 = 'test'
export const testId1: TestId1 = 'test'

type TestState1 = {
  a: string
  b: number
  foo: {
    bar: string
  }
  arr: number[]
  map: Map<string, number>
  set: Set<number>
}

type TestComputed1 = {
  computedA: (s: TestState1) => string
  getterSetter: {
    get: (s: TestState1) => number
    set: (s: TestState1, v: number) => number
  }
}

type TestActions1 = {
  resetB: () => void
}

export type TestStore1 = Store<TestState1, TestComputed1, TestActions1>

export const testStateBuilder1: () => TestState1 = () => ({
  a: 'string',
  b: 0,
  foo: {
    bar: 'baz',
  },
  arr: [],
  map: new Map(),
  set: new Set(),
})

export const testComputed1: TestComputed1 = {
  computedA(state: TestState1) {
    return state.a
  },
  getterSetter: {
    get(state: TestState1) {
      return state.b
    },
    set(state: TestState1, val: number) {
      return (state.b = val)
    },
  },
}

export const testActions1: TestActions1 & ThisType<TestStore1> = {
  resetB() {
    this.state.b = 0
  },
}

export const testConfig1: StoreConfig<
  TestState1,
  TestComputed1,
  TestActions1
> = {
  id: testId1,
  state: testStateBuilder1,
  computed: testComputed1,
  actions: testActions1,
}
