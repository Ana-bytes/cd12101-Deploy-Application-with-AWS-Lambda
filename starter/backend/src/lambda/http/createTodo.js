
import {
  createTodo,
  isValidTodo
} from '../../businessLogic/todos.js'

export async function handler(event) {
  // Get the authenticated user's ID from API Gateway
  const userId = event.requestContext?.authorizer?.principalId

  if (!userId) {
    return response(401, { error: 'Unauthorized' })
  }

  // Parse the incoming request body
  let newTodo

  try {
    newTodo = JSON.parse(event.body ?? '')
  } catch {
    return response(400, { error: 'Invalid JSON body' })
  }

  // Validate the TODO request
  if (!isValidTodo(newTodo)) {
    return response(400, {
      error: 'Valid name and dueDate (YYYY-MM-DD) are required'
    })
  }

  // Create and save the TODO through the business-logic layer
  try {
    const item = await createTodo(userId, newTodo)

    return response(201, { item })
  } catch (error) {
    console.error('Failed to create TODO', error)

    return response(500, {
      error: 'Internal server error'
    })
  }
}

// Build a consistent HTTP response
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}