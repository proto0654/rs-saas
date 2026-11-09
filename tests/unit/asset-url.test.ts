import { describe, expect, it } from 'vitest'
import { resolveAssetUrl } from '../../shared/asset-url'

describe('resolveAssetUrl', () => {
  it('leaves root-hosted paths unchanged when base is /', () => {
    expect(resolveAssetUrl('/demo/photo-p1.png')).toBe('/demo/photo-p1.png')
    expect(resolveAssetUrl('/demo/photo-p1.png', '/')).toBe('/demo/photo-p1.png')
  })

  it('prefixes GitHub Pages baseURL', () => {
    expect(resolveAssetUrl('/demo/photo-p1.png', '/rs-saas/')).toBe('/rs-saas/demo/photo-p1.png')
    expect(resolveAssetUrl('demo/photo-p1.png', '/rs-saas')).toBe('/rs-saas/demo/photo-p1.png')
  })

  it('passes through absolute and empty values', () => {
    expect(resolveAssetUrl('https://cdn.example/a.png', '/rs-saas/')).toBe('https://cdn.example/a.png')
    expect(resolveAssetUrl('data:image/png;base64,xx', '/rs-saas/')).toBe('data:image/png;base64,xx')
    expect(resolveAssetUrl(null, '/rs-saas/')).toBe('')
    expect(resolveAssetUrl(undefined, '/rs-saas/')).toBe('')
  })
})
