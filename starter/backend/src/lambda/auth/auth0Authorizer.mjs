import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

const auth0Domain = process.env.AUTH0_DOMAIN
const auth0Audience = process.env.AUTH0_AUDIENCE

if (!auth0Domain || !auth0Audience) {
  throw new Error('Missing Auth0 configuration')
}

const issuer = `https://${auth0Domain}/`
const jwksUrl = `${issuer}.well-known/jwks.json`

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: event.methodArn
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)

  const decoded = jsonwebtoken.decode(token, { complete: true })

  if (!decoded || decoded.header.alg !== 'RS256' || !decoded.header.kid) {
    throw new Error('Invalid JWT header')
  }

   // Retrieve Auth0's public signing keys
  const response = await Axios.get(jwksUrl, {
    timeout: 5000
  })

  const signingKey = response.data.keys.find(
    key =>
      key.kid === decoded.header.kid &&
      key.kty === 'RSA' &&
      key.use === 'sig'
  )

  if (!signingKey) {
    throw new Error('Signing key not found')
  }
  
  const publicKey = signingKey.x5c?.[0]
    ? `-----BEGIN CERTIFICATE-----\n${signingKey.x5c[0]}\n-----END CERTIFICATE-----`
    : undefined

  if (!publicKey) {
    throw new Error('Signing certificate not found')
  }

  // Verify signature, issuer, audience and expiration
  const verified = jsonwebtoken.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer,
    audience: auth0Audience
  })

  if (typeof verified !== 'object' || !verified.sub) {
    throw new Error('Invalid token subject')
  }

  return verified
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  const match = authHeader.match(/^Bearer\s+(\S+)$/i)

  if (!match) {
    throw new Error('Invalid authentication header')
  }

  return match[1]
}
