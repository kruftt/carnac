import { isPlainObject, DeepPartial, RootState } from './types'

export function applyPatch<S extends RootState>(
  target: S,
  patch: DeepPartial<S>
): DeepPartial<S> {
  const oldValues: DeepPartial<S> = {}
  for (const key in patch) {
    const targetValue = target[key]
    const newValue = patch[key]
    if (isPlainObject(newValue) && isPlainObject(targetValue)) {
      oldValues[key] = applyPatch(targetValue, newValue)
    } else {
      oldValues[key] = targetValue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target[key] = newValue as any
    }
  }
  return oldValues
}
