/** Prefix a public/ path with Nuxt app.baseURL (needed on GitHub Pages). */
export function resolveAssetUrl(path: string | null | undefined, baseURL = '/') {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  const base = baseURL.endsWith('/') ? baseURL : `${baseURL}/`
  return `${base}${path.replace(/^\//, '')}`
}
