const clamp = (value: number) => Math.max(0, Math.min(1, value))
const cubicInOut = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2

export function introMotion(progress: number, width: number, height: number) {
  const gap = 28
  const gridWidth = Math.min(720, width - gap * 2)
  const tile = (gridWidth - gap * 2) / 3
  const gridHeight = Math.round(tile * 4 + gap * 3)
  // A unit flight, 0.06 row stagger, and a unit zoom overlapping by 0.6.
  const time = clamp(progress) * 1.58
  const zoomProgress = cubicInOut(clamp(time - .58))
  const scale = 1 + zoomProgress * 1.05
  const spread = clamp((time - 1.08) / .5)
  const horizontalClearance = Math.max(tile * .4, width / (2 * 2.05) - tile / 2)
  const tiles = Array.from({ length: 12 }, (_, index) => {
    const column = index % 3
    const row = Math.floor(index / 3)
    const fromBottom = column === 1
    const delay = (fromBottom ? row : 3 - row) * .06
    const arrival = clamp(time - delay)
    let y = (fromBottom ? 1 : -1) * (1 - arrival) * (height + gridHeight) / 2
    const x = (column - 1) * horizontalClearance * zoomProgress
    if (fromBottom) {
      const inner = row === 1 || row === 2
      const clearance = inner ? Math.max(tile * .4, height / (2 * 2.05) - gap / 2 + gap) : tile * .4
      y += (row < 2 ? -1 : 1) * clearance * spread
    }
    return { transform: `translate3d(${x}px, ${y}px, 0)`, visibility: progress <= 0 ? 'hidden' as const : 'visible' as const }
  })
  const contentOpacity = cubicInOut(clamp((time - 1.26) / .32))
  return { scale, tiles, contentOpacity }
}
