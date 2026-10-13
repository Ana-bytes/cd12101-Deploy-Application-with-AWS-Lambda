import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand
} from '@aws-sdk/lib-dynamodb'
import {
  S3Client,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({})

const todosTable = process.env.TODOS_TABLE
const attachmentsBucket = process.env.ATTACHMENTS_BUCKET

export async function handler(event) {
  const userId = event.requestContext?.authorizer?.principalId

  if (!userId) {
    return response(401, { error: 'Unauthorized' })
  }

  try {
    const result = await dynamoDB.send(
      new QueryCommand({
        TableName: todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
    )

    const items = await Promise.all(
      (result.Items ?? []).map(async (todo) => {
        const { attachmentKey, ...publicTodo } = todo

        if (!attachmentKey) {
          return publicTodo
        }

        const attachmentUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: attachmentsBucket,
            Key: attachmentKey
          }),
          { expiresIn: 300 }
        )

        return {
          ...publicTodo,
          attachmentUrl
        }
      })
    )

    return response(200, { items })
  } catch (error) {
    console.error('Failed to retrieve TODOs', error)

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