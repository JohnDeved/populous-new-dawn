type Point = { x: number; y: number }
const short = (n: number) => (n << 16) >> 16

// 0x435339–0x43536a: sign-extend each coordinate before subtracting; unlike
// direction calculations, proximity does not wrap the resulting difference.
export function withinVehicleTransferRange(person: Point, target: Point) {
  return (
    Math.abs(short(target.x) - short(person.x)) < 568 &&
    Math.abs(short(target.y) - short(person.y)) < 568
  )
}
