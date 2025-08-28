const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')
const assert = require('node:assert')
const helper = require('./test_help')

const api = supertest(app)

// 全局变量存储token和用户信息
let token
let user

describe('Blog API tests', () => {
  beforeEach(async () => {
    // 清理数据库
    await Blog.deleteMany({})
    await User.deleteMany({})

    // 创建用户并获取token
    const userAndToken = await helper.createUserAndGetToken()
    token = userAndToken.token
    user = userAndToken.user

    // 使用token创建初始博客数据
    const blogObjects = helper.initialBlogs.map(blog => {
      return new Blog({
        ...blog,
        user: user._id // 关联博客到用户
      })
    })

    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  describe('when there are initially some blogs saved', () => {
    test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    }, 10000)

    test('all blogs are returned', async () => {
      const response = await api.get('/api/blogs')
      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('a specific blog is within the returned blogs', async () => {
      const response = await api.get('/api/blogs')
      const titles = response.body.map(r => r.title)
      assert(titles.includes('Go To Statement Considered Harmful'))
    })

    test('blog posts have id property instead of _id', async () => {
      const response = await api.get('/api/blogs')
      const blogs = response.body

      blogs.forEach(blog => {
        assert(blog.id)
        assert(!blog._id)
      })
    })
  })

  describe('deletion of a blog', () => {
    test('succeeds with status 204 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      const titles = blogsAtEnd.map(n => n.title)
      assert(!titles.includes(blogToDelete.title))

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
    })
  })

  describe('updating a blog', () => {
    test('succeeds with status 200 if id is valid', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToBeUpdated = blogsAtStart[0]
      const updatedId = blogToBeUpdated.id
      const likes = { "likes": 27 }

      const updatedBlog = await api
        .put(`/api/blogs/${updatedId}`)
        .send(likes)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(updatedBlog.body.likes, likes.likes)
    })
  })
  describe('addition of a new blog', () => {
    test('succeeds with valid data and token', async () => {
      const newBlog = {
        title: 'Test Blog Post',
        author: 'Test Author',
        url: 'http://testblog.com',
        likes: 5
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const response = await api.get('/api/blogs')
      assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

      const titles = response.body.map(r => r.title)
      assert(titles.includes('Test Blog Post'))

      // 验证博客已关联到正确的用户
      const addedBlog = response.body.find(blog => blog.title === 'Test Blog Post')
      assert(addedBlog.user)
    })

    test('fails with status code 401 Unauthorized if token is not provided', async () => {
      const newBlog = {
        title: 'Test Blog Post Without Token',
        author: 'Test Author',
        url: 'http://testblog.com',
        likes: 5
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)

      const response = await api.get('/api/blogs')
      assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('blog without likes property defaults to 0 likes', async () => {
      const newBlog = {
        title: 'Blog Without Likes',
        author: 'Test Author',
        url: 'http://testblog.com'
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.likes, 0)
    })

    test('blog without title or url results in 400 Bad Request', async () => {
      // blog without title
      const newBlog1 = {
        author: 'Test Author',
        url: 'http://test.com',
        likes: 7
      }

      // blog without url
      const newBlog2 = {
        title: 'Test Title',
        author: 'Test Author',
        likes: 7
      }

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog1)
        .expect(400)

      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog2)
        .expect(400)
    })
  })
})



after(async () => {
  await mongoose.connection.close()
})