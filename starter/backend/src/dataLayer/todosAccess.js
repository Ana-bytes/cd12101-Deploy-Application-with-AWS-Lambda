
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb'

// Initialize DynamoDB client
const dynamoDB = DynamoDBDocumentClient.from(
  new DynamoDBClient({})
)

const todosTable = process.env.TODOS_TABLE

// Create a new TODO in DynamoDB
export async function createTodo(item) {
  await dynamoDB.send(
    new PutCommand({
      TableName: todosTable,
      Item: item
    })
  )

  return item
}

// Retrieve all TODOs belonging to a specific user
export async function getTodos(userId) {
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
  )

  return result.Items ?? []
}

// Update an existing TODO belonging to a specific user
export async function updateTodo(userId, todoId, updatedTodo) {
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
        ':name': updatedTodo.name,
        ':dueDate': updatedTodo.dueDate,
        ':done': updatedTodo.done
      },
      ReturnValues: 'ALL_NEW'
    })
  )

  return result.Attributes
}

// Delete an existing TODO belonging to a specific user
export async function deleteTodo(userId, todoId) {
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
}

// Retrieve a single TODO belonging to a specific user
export async function getTodo(userId, todoId) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      }
    })
  )

  return result.Item
}

// Save an attachment key to an existing TODO
export async function updateTodoAttachment(
  userId,
  todoId,
  attachmentKey
) {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: todosTable,
      Key: {
        userId,
        todoId
      },
      UpdateExpression: 'SET attachmentKey = :key',
      ConditionExpression:
        'attribute_exists(userId) AND attribute_exists(todoId)',
      ExpressionAttributeValues: {
        ':key': attachmentKey
      }
    })
  )
}