import { describe, expect, it } from 'vitest'
import { introMotion } from '../../app/utils/intro-motion'

const coordinates = (style: { transform: string }) => style.transform.match(/-?\d+(?:\.\d+)?/g)!.slice(1).map(Number)
const viewports = [[360, 800], [390, 844], [430, 932], [600, 960], [768, 1024], [911, 620], [1440, 900], [844, 390]] as const

function tileBounds(frame: ReturnType<typeof introMotion>) {
  const { tileWidth, tileHeight, columnGap, rowGap, gridHeight, gridWidth } = frame.geometry
  return frame.tiles.map((style, index) => {
    const [x, y] = coordinates(style)
    const left = (-gridWidth / 2 + (index % 3) * (tileWidth + columnGap) + x!) * frame.scale
    const top = (-gridHeight / 2 + Math.floor(index / 3) * (tileHeight + rowGap) + y!) * frame.scale
    return { left, top, right: left + tileWidth * frame.scale, bottom: top + tileHeight * frame.scale }
  })
}

describe('responsive intro geometry', () => {
  it.each([[360, 800], [390, 844], [430, 932]])('aligns mobile side columns with the viewport edges during vertical entry at %i × %i', (width, height) => {
    const frame = introMotion(.2, width, height)
    const bounds = tileBounds(frame)
    expect(frame.scale).toBe(1)
    expect(bounds[0]!.left).toBeCloseTo(-width / 2)
    expect(bounds[2]!.right).toBeCloseTo(width / 2)
    expect(bounds[1]!.left).toBeGreaterThan(-width / 2)
    expect(bounds[1]!.right).toBeLessThan(width / 2)
  })

  it.each(viewports)('keeps all tiles apart throughout the animation at %i × %i', (width, height) => {
    for (let step = 0; step <= 100; step++) {
      const bounds = tileBounds(introMotion(step / 100, width, height))
      bounds.forEach((tile, index) => {
        for (const other of bounds.slice(index + 1)) {
          const overlapWidth = Math.min(tile.right, other.right) - Math.max(tile.left, other.left)
          const overlapHeight = Math.min(tile.bottom, other.bottom) - Math.max(tile.top, other.top)
          expect(overlapWidth > 0 && overlapHeight > 0, `overlapping tiles at progress ${step / 100}`).toBe(false)
        }
      })
    }
  })

  it.each(viewports)('moves every tile completely outside the final frame at %i × %i', (width, height) => {
    const bounds = tileBounds(introMotion(1, width, height))
    for (const tile of bounds) {
      expect(tile.right <= -width / 2 || tile.left >= width / 2 || tile.bottom <= -height / 2 || tile.top >= height / 2).toBe(true)
    }
  })

  it('stretches mobile tiles and vertical gaps by the same factor to fill the screen', () => {
    const { geometry } = introMotion(.5, 390, 844)
    expect(geometry.gridHeight).toBeCloseTo(844)
    expect(geometry.tileHeight).toBeGreaterThan(geometry.tileWidth)
    expect(geometry.tileHeight / geometry.tileWidth).toBeCloseTo(geometry.rowGap / geometry.columnGap)
  })

  it.each([[911, 620], [844, 390], [390, 300]])('preserves square tiles on desktop and short screens at %i × %i', (width, height) => {
    const { geometry } = introMotion(.5, width, height)
    expect(geometry.tileHeight).toBe(geometry.tileWidth)
    expect(geometry.rowGap).toBe(geometry.columnGap)
  })
})

describe('intro geometry against measured reference frames', () => {
  it('keeps the central rows apart during the final spread', () => {
    const frame = introMotion(.95, 911, 620)
    const upperGap = 28 + coordinates(frame.tiles[4]!)[1]! - coordinates(frame.tiles[1]!)[1]!
    const lowerGap = 28 + coordinates(frame.tiles[10]!)[1]! - coordinates(frame.tiles[7]!)[1]!
    expect(upperGap).toBeGreaterThanOrEqual(0)
    expect(lowerGap).toBeGreaterThanOrEqual(0)
  })
  it('fades search in during the final spread and completes before normal scrolling', () => {
    expect(introMotion(.75, 911, 620).contentOpacity).toBe(0)
    expect(introMotion(.9, 911, 620).contentOpacity).toBeGreaterThan(0)
    expect(introMotion(.9, 911, 620).contentOpacity).toBeLessThan(1)
    expect(introMotion(1, 911, 620).contentOpacity).toBe(1)
  })
  it('matches row delays and flight distance at 360px of 1860px scroll', () => {
    const frame = introMotion(360 / 1860, 911, 620)
    expect(frame.scale).toBe(1)
    expect(coordinates(frame.tiles[0]!)[1]).toBeCloseTo(-694.55, 1)
    expect(coordinates(frame.tiles[1]!)[1]).toBeCloseTo(551.54, 1)
    expect(coordinates(frame.tiles[9]!)[1]).toBeCloseTo(-551.54, 1)
  })
  it('matches the shared zoom and horizontal spread at 1080px', () => {
    const frame = introMotion(1080 / 1860, 911, 620)
    expect(frame.scale).toBeCloseTo(1.16135, 4)
    expect(coordinates(frame.tiles[0]!)[0]).toBeCloseTo(-17.14, 1)
    expect(coordinates(frame.tiles[0]!)[1]).toBeCloseTo(-208.62, 1)
  })
  it('clears the stage at the measured final scale and offsets', () => {
    const frame = introMotion(1, 911, 620)
    expect(frame.scale).toBe(2.05)
    expect(coordinates(frame.tiles[0]!)[0]).toBeCloseTo(-111.53, 1)
    expect(coordinates(frame.tiles[1]!)[1]).toBeCloseTo(-165.22, 1)
    expect(coordinates(frame.tiles[4]!)[1]).toBeCloseTo(-165.22, 1)
  })
})
