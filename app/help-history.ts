/** Original history: 00425140/180/1c0/1e0, allocated as 64 integers by
 * 0045d870. This browser version bounds the complete list (including current)
 * to 64 entries rather than reproducing the native index-64 write at capacity.
 * Duplicate visits are intentional; branching discards forward history. */
export function createHelpHistory(initial = 984) {
  validateHelpTopic(initial)
  const entries = [initial]
  let position = 0
  return {
    get topic() {
      return entries[position]
    },
    get canBack() {
      return position > 0
    },
    get canForward() {
      return position + 1 < entries.length
    },
    visit(topic: number) {
      validateHelpTopic(topic)
      entries.splice(position + 1)
      entries.push(topic)
      if (entries.length > 64) entries.shift()
      position = entries.length - 1
      return topic
    },
    back() {
      return position > 0 ? entries[--position] : null
    },
    forward() {
      return position + 1 < entries.length ? entries[++position] : null
    },
  }
}

export function validateHelpTopic(topic: number) {
  if (!Number.isInteger(topic) || topic < 983 || topic > 1070)
    throw new RangeError('Unimported Encyclopaedia topic')
}
