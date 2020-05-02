/* eslint-disable @typescript-eslint/no-explicit-any */
import { isPlainObject, DeepPartialPatch, RootState } from './types'

export function applyPatch<s extends RootState, p extends DeepPartialPatch<s>>(
  target: s,
  patch: p
): p {
  const oldValues = {} as p
  for (const key in patch) {
    const targetValue = target[key]
    const newValue = patch[key]
    if (isPlainObject(newValue) && isPlainObject(targetValue)) {
      oldValues[key] = applyPatch(targetValue, newValue) as any
    } else {
      oldValues[key] = targetValue as any
      target[key] = newValue as any
    }
  }
  return oldValues
}
