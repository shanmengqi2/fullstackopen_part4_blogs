const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const userExtractor = require('../utils/middleware').userExtractor
// blogRouter.get('/', (request, response) => {
//   Blog.find({}).then((blogs) => {
//     response.json(blogs)
//   })
// })

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

// const getTokenFrom = request => {
//   const authorization = request.get('authorization')
//   if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
//     return authorization.replace('Bearer ', '')
//   }
//   return null
// }

blogRouter.post('/', userExtractor, async (request, response) => {
  // const decodedToken = jwt.verify(request.token, process.env.SECRET)
  // if (!decodedToken) {
  //   return response.status(401).json({ error: 'token missing or invalid' })
  // }
  const user = request.user

  console.log(user)
  if (!user) {
    return response.status(400).json({ error: 'invalid user' })
  }
  const blog = new Blog({
    ...request.body,
    user: user._id
  })

  if (!blog.title || !blog.url) {
    response.status(400).end()
    return
  }

  const res = await blog.save()
  user.blogs = user.blogs.concat(res._id)
  await user.save()

  response.status(201).json(res)
})

// deleting a single blog post
blogRouter.delete('/:id', userExtractor, async (request, response) => {
  const deletedId = request.params.id
  const blog = await Blog.findById(deletedId)
  const blogUserId = blog.user.toString()

  // const decodedToken = jwt.verify(request.token, process.env.SECRET)
  // const loginId = decodedToken.id
  const loginId = request.user.id.toString()
  if (blogUserId.toString() !== loginId.toString()) {
    return response.status(401).json({ error: 'unauthorized' })
  }

  await Blog.findByIdAndDelete(deletedId)
  response.status(204).end()
})

// updating a blog's info
blogRouter.put('/:id', async (request, response) => {
  const updatedId = request.params.id
  // find the blog to be updated
  const blog = await Blog.findById(updatedId)
  if (!blog) {
    return response.status(404).end()
  }
  // just update likes for example
  blog.likes = request.body.likes

  const updatedBlog = await blog.save()
  response.json(updatedBlog)
})

module.exports = blogRouter