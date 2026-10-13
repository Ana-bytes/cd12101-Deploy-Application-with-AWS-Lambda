import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  UpdateCommand
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

  let updatedTodo

  try {
    updatedTodo = JSON.parse(event.body ?? '')
  } catch {
    return response(400, { error: 'Invalid JSON body' })
  }

  if (
    !updatedTodo ||
    typeof updatedTodo.name !== 'string' ||
    !updatedTodo.name.trim() ||
    typeof updatedTodo.dueDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(updatedTodo.dueDate) ||
    !Number.isFinite(Date.parse(updatedTodo.dueDate)) ||
    new Date(updatedTodo.dueDate).toISOString().slice(0, 10) !== updatedTodo.dueDate ||
    typeof updatedTodo.done !== 'boolean'
  ) {
    return response(400, {
      error: 'Valid name, dueDate and done fields are required'
    })
  }

  try {
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression:
          'SET #name = :name, dueDate = :dueDate, done = :done',
        ConditionExpression:
          'attribute_exists(userId) AND attribute_exists(todoId)',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': updatedTodo.name.trim(),
          ':dueDate': updatedTodo.dueDate,
          ':done': updatedTodo.done
        },
        ReturnValues: 'ALL_NEW'
      })
    )

    return response(200, {
      item: result.Attributes
    })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, {
        error: 'TODO not found'
      })
    }

    console.error('Failed to update TODO', error)

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