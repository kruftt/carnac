import { sum } from 'src/test'
import { sayHello } from 'carnac'

test('adds 1 + 2 to equal 3', () => {
  sayHello()
  expect(sum(1, 2)).toBe(3)
})
