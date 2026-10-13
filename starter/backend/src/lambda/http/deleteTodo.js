import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'

const dynamoDB = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
)

const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  const userId = event.requestContext?.authorizer?.principalId
  const todoId = event.pathParameters?.todoId

  if (!userId) {
    return response(401, { error: 'Unauthorized' })
  }

  if (!todoId) {
    return response(400, { error: 'Missing TODO ID' })
  }

  try {
    await dynamoDB.send(
      new DeleteCommand({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        },
        ConditionExpression:
          'attribute_exists(userId) AND attribute_exists(todoId)'
      })
    )

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