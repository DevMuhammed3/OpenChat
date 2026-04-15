import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { resolveAssetUrl } from './resolveAssetUrl.js'

describe('resolveAssetUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  it('should return null if path is null or undefined', () => {
    expect(resolveAssetUrl(null)).toBe(null)
    expect(resolveAssetUrl(undefined)).toBe(null)
  })

  it('should return the path as is if it is an absolute URL', () => {
    const absoluteUrl = 'https://example.com/image.png'
    expect(resolveAssetUrl(absoluteUrl)).toBe(absoluteUrl)
  })

  it('should resolve local path with BASE_URL', () => {
    process.env.BASE_URL = 'http://localhost:4000'
    const localPath = 'avatar.png'
    expect(resolveAssetUrl(localPath)).toBe('http://localhost:4000/uploads/avatar.png')
  })

  it('should handle leading slash in path', () => {
    process.env.BASE_URL = 'http://localhost:4000'
    const localPath = '/custom-path.png'
    expect(resolveAssetUrl(localPath)).toBe('http://localhost:4000/custom-path.png')
  })

  it('should return path as is if BASE_URL is not set', () => {
    delete process.env.BASE_URL
    const localPath = 'avatar.png'
    expect(resolveAssetUrl(localPath)).toBe('avatar.png')
  })
})
