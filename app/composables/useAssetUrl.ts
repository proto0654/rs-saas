import { resolveAssetUrl } from '#shared/asset-url'

export function useAssetUrl() {
  const baseURL = useRuntimeConfig().app.baseURL || '/'
  return (path?: string | null) => resolveAssetUrl(path, baseURL)
}
