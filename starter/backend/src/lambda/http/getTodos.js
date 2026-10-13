
import { getTodos } from '../../businessLogic/todos.js'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('getTodos')

export async function handler(event) {
  const requestId = event.requestContext?.requestId
  const userId = event.requestContext?.authorizer?.principalId

  if (!userId) {
    logger.warn('Unauthorized TODO retrieval attempt', {
      requestId
    })

    return response(401, { error: 'Unauthorized' })
  }

  logger.info('Retrieving TODOs', {
    requestId,
    userId
  })

  try {
    const items = await getTodos(userId)

    logger.info('TODOs retrieved successfully', {
      requestId,
      userId,
      todoCount: items.length
    })

    return response(200, { items })
  } catch (error) {
    logger.error('Failed to retrieve TODOs', {
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