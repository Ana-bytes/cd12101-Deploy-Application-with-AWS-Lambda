
import { deleteTodo } from '../../businessLogic/todos.js'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('deleteTodo')

export async function handler(event) {
  const requestId = event.requestContext?.requestId
  const userId = event.requestContext?.authorizer?.principalId
  const todoId = event.pathParameters?.todoId

  if (!userId) {
    logger.warn('Unauthorized TODO deletion attempt', {
      requestId
    })

    return response(401, { error: 'Unauthorized' })
  }

  if (!todoId) {
    logger.warn('Missing TODO ID in deletion request', {
      requestId,
      userId
    })

    return response(400, { error: 'Missing TODO ID' })
  }

  logger.info('Deleting TODO', {
    requestId,
    userId,
    todoId
  })

  try {
    await deleteTodo(userId, todoId)

    logger.info('TODO deleted successfully', {
      requestId,
      userId,
      todoId
    })

    return response(200, {
      message: 'TODO deleted successfully'
    })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('TODO not found during deletion', {
        requestId,
        userId,
        todoId
      })

      return response(404, {
        error: 'TODO not found'
      })
    }

    logger.error('Failed to delete TODO', {
      requestId,
      userId,
      todoId,
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