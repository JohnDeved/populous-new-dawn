// Shared layered charge display in 0x49daf0 and 0x504bc0.
// Keep the native bands but use wide arithmetic: the old training bar wraps
// signed 32-bit products at high stored mana and can run backwards.
export function chargeFills(progress: number, cost: number, width: number, color = 222) {
  const fills: { palette: number; width: number }[] = []
  let divisor = Math.trunc(cost / width),
    shade = 240
  for (let next = divisor; next > width; next = Math.trunc(next / width)) {
    divisor = next
    shade--
  }
  for (; divisor > 0 && divisor < cost; divisor *= width) {
    shade = Math.min(239, shade)
    fills.push({
      palette: shade++,
      width: Math.min(width, Math.trunc(((progress % divisor) * width) / divisor)),
    })
  }
  fills.push({
    palette: color,
    width: cost > 0 ? Math.min(width, Math.trunc((width * progress) / cost)) : width,
  })
  return fills
}
