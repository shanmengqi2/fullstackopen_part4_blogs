const dummy = (blogs) => {
  // ...
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((total, blog) => total + blog.likes, 0)
}

const favoriteBlog = (blogList) => {
  let index_max = 0
  let max = 0
  blogList.forEach((element, index) => {
    if (element.likes >= max) {
      index_max = index
      console.log('index', index)
      max = element.likes
    }
  })
  console.log('print result', blogList[index_max])
  return blogList[index_max]
}

const mostBlogs = (blogList) => {
  const author_blogs_list = []
  blogList.forEach(item => {
    const find_index = author_blogs_list.findIndex(element => element.author === item.author)
    if (find_index === -1) {
      author_blogs_list.push({ author: item.author, blogs: 1 })
    } else {
      author_blogs_list[find_index].blogs += 1
    }
  })
  console.log('author_blogs_list:', author_blogs_list)

  let index_max = 0
  let max = 0
  author_blogs_list.forEach((item, index) => {
    if (item.blogs >= max) {
      index_max = index
      max = item.blogs
    }
  })
  return author_blogs_list[index_max]
}

const mostLikes = (blogList) => {
  const author_likes_list = []
  blogList.forEach((item, index) => {
    const find_index = author_likes_list.findIndex(element => element.author === item.author)
    if (find_index === -1) {
      author_likes_list.push({ author: item.author, likes: item.likes })
    } else {
      author_likes_list[find_index].likes += item.likes
    }
  })

  console.log('author_likes_list:', author_likes_list)

  let index_max = 0
  let max = 0
  author_likes_list.forEach((item, index) => {
    if (item.likes >= max) {
      index_max = index
      max = item.likes
    }
  })

  return author_likes_list[index_max]
}



module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}