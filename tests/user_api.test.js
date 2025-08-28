const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const User = require('../models/user')
const assert = require('node:assert')
const helper = require('./test_help')

const api = supertest(app)

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const user = new User({ username: 'root', password: 'sekret' })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    result = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const userAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtStart.length + 1, userAtEnd.length)

    const usernames = userAtEnd.map(u => u.username)

    assert(usernames.includes(newUser.username), 'newUser.username')
  })

  test('creation fails with proper status code if password is less than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'sa123',
      name: 'Superuser',
      password: 'sa',
    }
    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('password must be at least 3 characters long'))
    assert.strictEqual(usersAtEnd.length, usersAtStart.length, 'usersAtEnd.length')
  })


})

after(() => {
  mongoose.connection.close()
})