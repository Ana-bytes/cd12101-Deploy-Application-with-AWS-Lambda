
import {
  updateTodo,
  isValidUpdatedTodo
} from '../../businessLogic/todos.js'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('updateTodo')

export async function handler(event) {
  const requestId = event.requestContext?.requestId
  const userId = event.requestContext?.authorizer?.principalId
  const todoId = event.pathParameters?.todoId

  if (!userId) {
    logger.warn('Unauthorized TODO update attempt', {
      requestId
    })

    return response(401, { error: 'Unauthorized' })
  }

  if (!todoId) {
    logger.warn('Missing TODO ID in update request', {
      requestId,
      userId
    })

    return response(400, { error: 'Missing TODO ID' })
  }

  let updatedTodo

  try {
    updatedTodo = JSON.parse(event.body ?? '')
  } catch {
    logger.warn('Invalid JSON in TODO update request', {
      requestId,
      userId,
      todoId
    })

    return response(400, { error: 'Invalid JSON body' })
  }

  if (!isValidUpdatedTodo(updatedTodo)) {
    logger.warn('TODO update validation failed', {
      requestId,
      userId,
      todoId
    })

    return response(400, {
      error: 'Valid name, dueDate and done fields are required'
    })
  }

  logger.info('Updating TODO', {
    requestId,
    userId,
    todoId,
    done: updatedTodo.done
  })

  try {
    const item = await updateTodo(
      userId,
      todoId,
      updatedTodo
    )

    logger.info('TODO updated successfully', {
      requestId,
      userId,
      todoId,
      done: item.done
    })

    return response(200, { item })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('TODO not found during update', {
        requestId,
        userId,
        todoId
      })

      return response(404, {
        error: 'TODO not found'
      })
    }

    logger.error('Failed to update TODO', {
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