import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({})

const todosTable = process.env.TODOS_TABLE
const attachmentsBucket = process.env.ATTACHMENTS_BUCKET

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
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: todosTable,
        Key: { userId, todoId }
      })
    )

    if (!result.Item) {
      return response(404, { error: 'TODO not found' })
    }

    const objectKey = `${userId}/${todoId}/${uuidv4()}`

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: attachmentsBucket,
        Key: objectKey
      }),
      { expiresIn: 300 }
    )

    await dynamoDB.send(
      new UpdateCommand({
        TableName: todosTable,
        Key: { userId, todoId },
        UpdateExpression: 'SET attachmentKey = :key',
        ConditionExpression:
          'attribute_exists(userId) AND attribute_exists(todoId)',
        ExpressionAttributeValues: {
          ':key': objectKey
        }
      })
    )

    return response(200, { uploadUrl })
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return response(404, { error: 'TODO not found' })
    }

    console.error('Failed to generate upload URL', error)

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