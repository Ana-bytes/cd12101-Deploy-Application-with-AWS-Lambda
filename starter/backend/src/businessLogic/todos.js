
import { v4 as uuidv4 } from 'uuid'

import {
  createTodo as saveTodo,
  getTodos as fetchTodos,
  updateTodo as saveUpdatedTodo,
  deleteTodo as removeTodo,
  getTodo,
  updateTodoAttachment
} from '../dataLayer/todosAccess.js'

import {
  getAttachmentUrl,
  getUploadUrl
} from '../dataLayer/attachmentUtils.js'

// Validate the TODO name and due date
export function isValidTodo(todo) {
  return (
    todo &&
    typeof todo.name === 'string' &&
    Boolean(todo.name.trim()) &&
    typeof todo.dueDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(todo.dueDate) &&
    Number.isFinite(Date.parse(todo.dueDate)) &&
    new Date(todo.dueDate).toISOString().slice(0, 10) === todo.dueDate
  )
}

// Create and save a new TODO
export async function createTodo(userId, newTodo) {
  const item = {
    userId,
    todoId: uuidv4(),
    createdAt: new Date().toISOString(),
    name: newTodo.name.trim(),
    dueDate: newTodo.dueDate,
    done: false
  }

  return await saveTodo(item)
}

// Retrieve TODOs and generate attachment URLs
export async function getTodos(userId) {
  const todos = await fetchTodos(userId)

  return await Promise.all(
    todos.map(async (todo) => {
      const { attachmentKey, ...publicTodo } = todo

      // TODOs without attachments don't need an S3 URL
      if (!attachmentKey) {
        return publicTodo
      }

      // Generate a temporary URL for the attachment
      const attachmentUrl = await getAttachmentUrl(attachmentKey)

      return {
        ...publicTodo,
        attachmentUrl
      }
    })
  )
}

// Validate fields required when updating a TODO
export function isValidUpdatedTodo(todo) {
  return (
    isValidTodo(todo) &&
    typeof todo.done === 'boolean'
  )
}

// Update an existing TODO
export async function updateTodo(userId, todoId, updatedTodo) {
  const normalizedTodo = {
    name: updatedTodo.name.trim(),
    dueDate: updatedTodo.dueDate,
    done: updatedTodo.done
  }

  return await saveUpdatedTodo(
    userId,
    todoId,
    normalizedTodo
  )
}

// Delete an existing TODO
export async function deleteTodo(userId, todoId) {
  await removeTodo(userId, todoId)
}

// Generate an upload URL for a TODO attachment
export async function generateUploadUrl(userId, todoId) {
  // Confirm the TODO belongs to the authenticated user
  const todo = await getTodo(userId, todoId)

  if (!todo) {
    return null
  }

  // Generate a unique S3 object key
  const attachmentKey = `${userId}/${todoId}/${uuidv4()}`

  // Generate a presigned S3 upload URL
  const uploadUrl = await getUploadUrl(attachmentKey)

  // Associate the attachment with the TODO
  await updateTodoAttachment(
    userId,
    todoId,
    attachmentKey
  )

  return uploadUrl
}