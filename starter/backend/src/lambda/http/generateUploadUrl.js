
import {
  generateUploadUrl
} from '../../businessLogic/todos.js'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('generateUploadUrl')

export async function handler(event) {
  const requestId = event.requestContext?.requestId
  const userId = event.requestContext?.authorizer?.principalId
  const todoId = event.pathParameters?.todoId

  if (!userId) {
    logger.warn('Unauthorized attachment upload request', {
      requestId
    })

    return response(401, { error: 'Unauthorized' })
  }

  if (!todoId) {
    logger.warn('Missing TODO ID in attachment upload request', {
      requestId,
      userId
    })

    return response(400, { error: 'Missing TODO ID' })
  }

  logger.info('Generating attachment upload URL', {
    requestId,
    userId,
    todoId
  })

  try {
    const uploadUrl = await generateUploadUrl(userId, todoId)

    if (!uploadUrl) {
      logger.warn('TODO not found for attachment upload', {
        requestId,
        userId,
        todoId
      })

      return response(404, {
        error: 'TODO not found'
      })
    }

    logger.info('Attachment upload URL generated successfully', {
      requestId,
      userId,
      todoId
    })

    return response(200, { uploadUrl })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('TODO not found during attachment update', {
        requestId,
        userId,
        todoId
      })

      return response(404, {
        error: 'TODO not found'
      })
    }

    logger.error('Failed to generate attachment upload URL', {
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