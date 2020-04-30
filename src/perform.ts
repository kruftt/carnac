import { DeepPartialMutator, RootState, isPlainObject } from './types'

export function performMutations<S extends RootState>(
  target: S,
  mutators: DeepPartialMutator<S>
) {
  const inverse = {} as DeepPartialMutator<S>
  for (const key in mutators) {
    const targetValue = target[key]
    const sourceValue = mutators[key]
    if (
      isPlainObject<RootState>(sourceValue) &&
      isPlainObject<RootState>(targetValue)
    ) {
      // inverse[key] = performMutations(target[key], mutators[key])
      // inverse[key] = performMutations(targetValue, sourceValue)
    } else {
      // oldValues[key] = targetValue
      // target[key] = newValue
    }
  }
  return inverse
}
