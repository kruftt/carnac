/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isPlainObject,
  DeepPartialPatch,
  RootState,
  DeepPartialPatchResult,
} from './types'

export function applyPatch<s extends RootState, p extends DeepPartialPatch<s>>(
  target: s,
  patch: p
): DeepPartialPatchResult<p> {
  const oldValues: any = {}
  for (const key in patch) {
    const targetValue = target[key]
    const newValue = patch[key]
    if (isPlainObject(newValue) && isPlainObject(targetValue)) {
      oldValues[key] = applyPatch(targetValue, newValue)
    } else {
      oldValues[key] = targetValue
      target[key] = newValue as any
    }
  }
  return oldValues
}
