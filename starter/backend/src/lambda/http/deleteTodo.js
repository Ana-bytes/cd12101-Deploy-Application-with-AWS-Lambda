
import { deleteTodo } from '../../businessLogic/todos.js'

export async function handler(event) {
  // Get authenticated user ID and TODO ID
  const userId = event.requestContext?.authorizer?.principalId
  const todoId = event.pathParameters?.todoId

  if (!userId) {
    return response(401, { error: 'Unauthorized' })
  }

  if (!todoId) {
    return response(400, { error: 'Missing TODO ID' })
  }

  try {
    // Delete through the business-logic layer
    await deleteTodo(userId, todoId)

    return response(200, {
      message: 'TODO deleted successfully'
    })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, {
        error: 'TODO not found'
      })
    }

    console.error('Failed to delete TODO', error)

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