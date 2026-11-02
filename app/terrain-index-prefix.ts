const nativeEvery = Uint32Array.prototype.every
const typedArrayLength = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint32Array.prototype),
  'length'
)!.get!
const noArguments: [] = []

// The caller retains subarray construction/coercion/species. Only replace the
// native nonempty typed-array scan; custom methods and empty/detached views
// still enter the original every operation and its validation.
export function terrainIndicesBelowCount(submitted: Uint32Array, position: { count: number }) {
  const every = submitted.every
  if (every === nativeEvery) {
    let length = 0
    try {
      // Internal length, not a potentially overridden public .length property.
      length = Reflect.apply(typedArrayLength, submitted, noArguments)
    } catch {
      // Preserve the original native-every validation for incompatible receivers.
    }
    if (length > 0) {
      for (let i = 0; i < length; i++) {
        if (!(submitted[i] < position.count)) return false
      }
      return true
    }
  }
  return Reflect.apply(every, submitted, [(id: number) => id < position.count])
}
