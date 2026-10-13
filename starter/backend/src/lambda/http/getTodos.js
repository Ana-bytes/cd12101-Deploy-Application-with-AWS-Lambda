
import { getTodos } from '../../businessLogic/todos.js'

export async function handler(event) {
  // Get the authenticated user's ID
  const userId = event.requestContext?.authorizer?.principalId

  if (!userId) {
    return response(401, { error: 'Unauthorized' })
  }

  try {
    // Retrieve TODOs through the business-logic layer
    const items = await getTodos(userId)

    return response(200, { items })
  } catch (error) {
    console.error('Failed to retrieve TODOs', error)

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