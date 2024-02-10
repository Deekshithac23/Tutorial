const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'todoapplication.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at https://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const hasPriorityAndStatus = requestQuery => {
  return requestQuery.priority != undefined && requestQuery.status != undefined
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority != undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status != undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', status, priority} = request.query
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority= '${priority}' AND status= '${status}'; `
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority= '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status= '${status}';`
      break
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = `SELECT * FROM todo WHERE id=${todoId}; `
  const todo = await db.get(getTodosQuery)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const getTodosQuery = `INSERT INTO todo(id,todo,priority,status) VALUES('${id}','${todo}','${priority}','${status}');`
  await db.run(getTodosQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatecolumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status != undefined:
      updatecolumn = 'Status'
      break
    case requestBody.priority != undefined:
      updatecolumn = 'Priority'
      break
    case requestBody.todo != undefined:
      updatecolumn = 'Todo'
      break
  }
  const previousQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const previousTodo = await db.get(previousQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  const updateTodoQuery = `UPDATE todo SET todo='${todo}', priority='${priority}',status='${status}' WHERE id=${todoId};`
  await db.run(updateTodoQuery)
  response.send(`${updatecolumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
