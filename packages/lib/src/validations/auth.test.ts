import test from 'node:test'
import assert from 'node:assert/strict'
import { loginSchema, signupSchema } from './auth'

test('signupSchema accepts valid payload', () => {
  const result = signupSchema.safeParse({
    name: 'Ahmed',
    username: 'ahmed1',
    email: 'ahmed@example.com',
    password: '123456',
    confirmPassword: '123456',
  })

  assert.equal(result.success, true)
})

test('signupSchema rejects password mismatch', () => {
  const result = signupSchema.safeParse({
    name: 'Ahmed',
    username: 'ahmed1',
    email: 'ahmed@example.com',
    password: '123456',
    confirmPassword: '654321',
  })

  assert.equal(result.success, false)
  if (!result.success) {
    assert.equal(result.error.issues[0]?.message, 'Passwords do not match')
  }
})

test('loginSchema rejects short password', () => {
  const result = loginSchema.safeParse({
    email: 'ahmed@example.com',
    password: '123',
  })

  assert.equal(result.success, false)
})
