
import {
  createTodo,
  isValidTodo
} from '../../businessLogic/todos.js'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('createTodo')

export async function handler(event) {
  const requestId = event.requestContext?.requestId
  const userId = event.requestContext?.authorizer?.principalId

  if (!userId) {
    logger.warn('Unauthorized TODO creation attempt', {
      requestId
    })

    return response(401, { error: 'Unauthorized' })
  }

  let newTodo

  try {
    newTodo = JSON.parse(event.body ?? '')
  } catch {
    logger.warn('Invalid JSON in TODO creation request', {
      requestId
    })

    return response(400, { error: 'Invalid JSON body' })
  }

  if (!isValidTodo(newTodo)) {
    logger.warn('TODO creation validation failed', {
      requestId,
      userId
    })

    return response(400, {
      error: 'Valid name and dueDate (YYYY-MM-DD) are required'
    })
  }

  logger.info('Creating TODO', {
    requestId,
    userId
  })

  try {
    const item = await createTodo(userId, newTodo)

    logger.info('TODO created successfully', {
      requestId,
      userId,
      todoId: item.todoId
    })

    return response(201, { item })
  } catch (error) {
    logger.error('Failed to create TODO', {
      requestId,
      userId,
      error: error.message,
      stack: error.stack
    })

    return response(500, {
      error: 'Internal server error'
    })
  }
}

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