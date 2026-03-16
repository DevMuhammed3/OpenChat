import test from 'node:test'
import assert from 'node:assert/strict'
import { getAvatarUrl } from './getAvatarUrl'

test('getAvatarUrl returns undefined when avatar is not provided', () => {
  const original = process.env.NEXT_PUBLIC_API_URL
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000'

  assert.equal(getAvatarUrl(undefined), undefined)
  assert.equal(getAvatarUrl(null), undefined)
  assert.equal(getAvatarUrl(''), undefined)

  process.env.NEXT_PUBLIC_API_URL = original
})

test('getAvatarUrl builds upload URL when avatar exists', () => {
  const original = process.env.NEXT_PUBLIC_API_URL
  process.env.NEXT_PUBLIC_API_URL = 'https://api.openchat.dev'

  assert.equal(getAvatarUrl('avatar.png'), 'https://api.openchat.dev/uploads/avatar.png')

  process.env.NEXT_PUBLIC_API_URL = original
})
