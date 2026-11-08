import { describe, expect, it } from 'vitest'
import { introMotion } from '../../app/utils/intro-motion'

const coordinates = (style: { transform: string }) => style.transform.match(/-?\d+(?:\.\d+)?/g)!.slice(1).map(Number)

describe('intro geometry against measured reference frames', () => {
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
    expect(coordinates(frame.tiles[1]!)[1]).toBeCloseTo(-88.53, 1)
    expect(coordinates(frame.tiles[4]!)[1]).toBeCloseTo(-165.22, 1)
  })
})
