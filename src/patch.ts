import { isPlainObject, DeepPartial, RootState } from './types'

export function applyPatch<S extends RootState>(
  target: DeepPartial<S>,
  patch: DeepPartial<S>
): DeepPartial<S> {
  const oldValues: DeepPartial<S> = {}
  for (const key in patch) {
    const targetValue = target[key]
    const newValue = patch[key]
    if (
      isPlainObject<RootState>(newValue) &&
      isPlainObject<RootState>(targetValue)
    ) {
      oldValues[key] = applyPatch(targetValue, newValue)
    } else {
      oldValues[key] = targetValue
      target[key] = newValue
    }
  }
  return oldValues
}
