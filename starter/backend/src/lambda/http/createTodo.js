import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const dynamoDB = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
)

const todosTable = process.env.TODOS_TABLE

export async function handler(event) {
  const userId = event.requestContext?.authorizer?.principalId

  if (!userId) {
    return response(401, { error: 'Unauthorized' })
  }

  let newTodo

  try {
    newTodo = JSON.parse(event.body ?? '')
  } catch {
    return response(400, { error: 'Invalid JSON body' })
  }

  if (
    !newTodo ||
    typeof newTodo.name !== 'string' ||
    !newTodo.name.trim() ||
    typeof newTodo.dueDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(newTodo.dueDate) ||
    !Number.isFinite(Date.parse(newTodo.dueDate)) ||
    new Date(newTodo.dueDate).toISOString().slice(0, 10) !== newTodo.dueDate
  ) {
    return response(400, {
      error: 'Valid name and dueDate (YYYY-MM-DD) are required'
    })
  }

  const item = {
    userId,
    todoId: uuidv4(),
    createdAt: new Date().toISOString(),
    name: newTodo.name.trim(),
    dueDate: newTodo.dueDate,
    done: false
  }

  try {
    await dynamoDB.send(
      new PutCommand({
        TableName: todosTable,
        Item: item
      })
    )

    return response(201, { item })
  } catch (error) {
    console.error('Failed to create TODO', error)

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