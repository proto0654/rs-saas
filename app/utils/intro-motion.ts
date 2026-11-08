const clamp = (value: number) => Math.max(0, Math.min(1, value))
const cubicInOut = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2

export function introMotion(progress: number, width: number, height: number) {
  const gap = 28
  const isPortraitMobile = width <= 600 && height > width
  const gridWidth = isPortraitMobile ? width : Math.min(720, width - gap * 2)
  const tile = (gridWidth - gap * 2) / 3
  const naturalHeight = tile * 4 + gap * 3
  const verticalStretch = isPortraitMobile ? Math.max(1, height / naturalHeight) : 1
  const tileHeight = tile * verticalStretch
  const rowGap = gap * verticalStretch
  const gridHeight = tileHeight * 4 + rowGap * 3
  const geometry = { gridWidth, gridHeight, tileWidth: tile, tileHeight, columnGap: gap, rowGap }
  // A unit flight, 0.06 row stagger, and a unit zoom overlapping by 0.6.
  const time = clamp(progress) * 1.58
  const zoomProgress = cubicInOut(clamp(time - .58))
  const scale = 1 + zoomProgress * 1.05
  const spread = clamp((time - 1.08) / .5)
  const horizontalClearance = Math.max(tile * .4, width / (2 * 2.05) - tile / 2)
  // Move each central pair together so the inner row cannot overtake the outer one.
  const verticalClearance = Math.max(tileHeight * .4, height / (2 * 2.05) + rowGap / 2)
  const tiles = Array.from({ length: 12 }, (_, index) => {
    const column = index % 3
    const row = Math.floor(index / 3)
    const fromBottom = column === 1
    const delay = (fromBottom ? row : 3 - row) * .06
    const arrival = clamp(time - delay)
    let y = (fromBottom ? 1 : -1) * (1 - arrival) * (height + Math.round(gridHeight)) / 2
    const x = (column - 1) * horizontalClearance * zoomProgress
    if (fromBottom) {
      y += (row < 2 ? -1 : 1) * verticalClearance * spread
    }
    return { transform: `translate3d(${x}px, ${y}px, 0)`, visibility: progress <= 0 ? 'hidden' as const : 'visible' as const }
  })
  const contentOpacity = cubicInOut(clamp((time - 1.26) / .32))
  return { scale, tiles, contentOpacity, geometry }
}
