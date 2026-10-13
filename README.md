# Serverless TODO Application

A serverless TODO management application developed as part of the
**Udacity Cloud Developer – Deploy Application with AWS Lambda** project.

The application uses AWS Lambda, API Gateway, DynamoDB, Amazon S3,
Auth0, React, and the Serverless Framework.

## 1. Project Overview

This application allows authenticated users to create, retrieve,
update, and delete TODO items.

Each TODO can have an image attachment, and users can only access
TODO items belonging to their authenticated accounts.

### Features

- Create TODO items with a name and due date
- Retrieve TODO items for the authenticated user
- Update TODO details and completion status
- Delete TODO items
- Upload and display image attachments
- Authenticate users through Auth0
- Restrict access to each user's own TODO items
- Validate incoming requests and return appropriate HTTP errors
- Monitor AWS Lambda using CloudWatch and AWS X-Ray

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Authentication | Auth0, JWT |
| API | Amazon API Gateway |
| Backend | AWS Lambda, Node.js 22.x |
| Database | Amazon DynamoDB |
| File Storage | Amazon S3 |
| Infrastructure | Serverless Framework v4 |
| Monitoring | Amazon CloudWatch, AWS X-Ray |
| AWS Region | us-east-1 |

## 3. Application Architecture

The backend follows a layered architecture that separates HTTP request
handling, business logic, and data access.

```text
React Frontend
      |
      v
Auth0 Authentication
      |
      v
Amazon API Gateway
      |
      +----> Auth Lambda (Custom Authorizer)
      |
      v
HTTP Lambda Handlers
      |
      v
Business Logic Layer
      |
      v
Data Access Layer
      |
      +----> Amazon DynamoDB
      |
      +----> Amazon S3
```

### Backend Structure

```text
starter/
├── backend/
│   ├── serverless.yml
│   └── src/
│       ├── lambda/
│       │   ├── auth/
│       │   └── http/
│       │       ├── getTodos.js
│       │       ├── createTodo.js
│       │       ├── updateTodo.js
│       │       ├── deleteTodo.js
│       │       └── generateUploadUrl.js
│       ├── businessLogic/
│       │   └── todos.js
│       └── dataLayer/
│           ├── todosAccess.js
│           └── attachmentUtils.js
└── client/
    └── src/
```

### HTTP Lambda Handlers

The HTTP Lambda handlers are responsible for:

- Receiving API Gateway events
- Extracting authenticated user information
- Parsing and validating request data
- Calling the business logic layer
- Returning appropriate HTTP responses

### Business Logic Layer

File: `src/businessLogic/todos.js`

Responsible for:

- Creating TODO items
- Retrieving user TODOs
- Updating TODO items
- Deleting TODO items
- Validating TODO data
- Generating attachment upload URLs

### Data Access Layer

Files:

- `src/dataLayer/todosAccess.js`
- `src/dataLayer/attachmentUtils.js`

Responsible for:

- DynamoDB CRUD operations
- Querying TODOs by authenticated user
- S3 presigned PUT URL generation
- S3 presigned GET URL generation

AWS SDK operations use asynchronous JavaScript with `async/await`.

## 4. AWS Resources

### AWS Lambda

The application deploys six Lambda functions:

| Function | Description |
|---|---|
| Auth | Validates Auth0 JWT tokens |
| GetTodos | Retrieves TODOs belonging to the current user |
| CreateTodo | Creates a new TODO |
| UpdateTodo | Updates an existing TODO |
| DeleteTodo | Deletes an existing TODO |
| GenerateUploadUrl | Generates an S3 presigned upload URL |

### Amazon DynamoDB

Table:

`serverless-todos-dev`

The table uses a composite primary key:

- Partition key: `userId`
- Sort key: `todoId`

Local secondary index:

`userId-createdAt-index`

The application uses DynamoDB `QueryCommand` instead of scanning
the entire table.

### Amazon S3

Attachments are stored in a private S3 bucket.

The application generates:

- Presigned PUT URLs for image uploads
- Presigned GET URLs for displaying uploaded images

Presigned URLs expire after 300 seconds.

### IAM Permissions

IAM permissions are configured per Lambda function in
`serverless.yml`.

Each function receives permissions appropriate to its required
DynamoDB or S3 operations.

## 5. API Endpoints

Deployed API:

`https://dg1kag8xl0.execute-api.us-east-1.amazonaws.com/dev`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/todos` | Retrieve TODO items |
| POST | `/todos` | Create a TODO |
| PATCH | `/todos/{todoId}` | Update a TODO |
| DELETE | `/todos/{todoId}` | Delete a TODO |
| POST | `/todos/{todoId}/attachment` | Generate upload URL |

All protected endpoints require a valid Auth0 JWT.

Authorization header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Create TODO

```http
POST /todos
```

Request body:

```json
{
  "name": "Complete Udacity Project",
  "dueDate": "2026-10-20"
}
```

### Update TODO

```http
PATCH /todos/{todoId}
```

Request body:

```json
{
  "name": "Complete Udacity Project",
  "dueDate": "2026-10-20",
  "done": true
}
```

### Delete TODO

```http
DELETE /todos/{todoId}
```

### Get TODOs

```http
GET /todos
```

### Generate Attachment Upload URL

```http
POST /todos/{todoId}/attachment
```

Example response:

```json
{
  "uploadUrl": "<PRESIGNED_S3_UPLOAD_URL>"
}
```

The client uploads the image using an HTTP PUT request to the
returned presigned URL.

## 6. Backend Deployment

### Prerequisites

- Node.js and npm
- AWS CLI
- AWS credentials configured locally
- Serverless Framework
- Auth0 application and API

### Install Dependencies

From the repository root:

```bash
cd starter/backend
npm install
```

### Validate Configuration

```bash
npx serverless print --stage dev --aws-profile udacity
```

### Package Application

```bash
npx serverless package --stage dev --aws-profile udacity
```

### Deploy Application

```bash
npx serverless deploy --stage dev --aws-profile udacity
```

The deployment provisions the configured AWS resources and
API Gateway endpoints.

The AWS CLI profile `udacity` is the profile used in the
development environment. Other users should substitute their
own configured AWS profile.

## 7. Frontend Setup

From the repository root:

```bash
cd starter/client
npm install
```

Create a `.env` file in `starter/client/`:

```dotenv
REACT_APP_AUTH0_DOMAIN=<YOUR_AUTH0_DOMAIN>
REACT_APP_AUTH0_CLIENT_ID=<YOUR_AUTH0_CLIENT_ID>
REACT_APP_AUTH0_AUDIENCE=<YOUR_AUTH0_API_AUDIENCE>
REACT_APP_API_ENDPOINT=<YOUR_API_GATEWAY_URL>
```

Start the frontend:

```bash
npm start
```

Open:

`http://localhost:3000`

The React application authenticates through Auth0 and communicates
with the deployed API Gateway endpoints.

## 8. Monitoring and Logging

### Amazon CloudWatch Logs

CloudWatch log groups were verified for all six Lambda functions.

Actual Lambda execution logs were retrieved, including:

- START events
- END events
- REPORT events
- Execution duration
- Memory usage

### Amazon CloudWatch Metrics

The AWS Lambda `Invocations` metric was verified for the
deployed GetTodos function.

### AWS X-Ray

X-Ray tracing was enabled and verified.

Five trace summaries were retrieved successfully, with no
reported errors or faults in those summaries.

### Request Validation

Lambda handlers validate incoming requests and return
appropriate HTTP status codes.

| HTTP Status | Description |
|---|---|
| 200 | Successful request |
| 201 | TODO created |
| 400 | Invalid request |
| 401 | Unauthorized |
| 404 | TODO not found |
| 500 | Internal server error |

Request validation is implemented in the Lambda application.
API Gateway request validators are not configured.

## 9. Testing Results

The deployed application was tested through the React frontend
and AWS CLI.

| Test Case | Result |
|---|---|
| Auth0 login | Passed |
| Create TODO | Passed |
| Retrieve TODOs | Passed |
| Update TODO | Passed |
| Delete TODO | Passed |
| Upload attachment | Passed |
| Display attachment | Passed |
| User isolation | Passed |
| Unauthorized API request | Passed |
| Invalid request handling | Passed |
| CloudWatch execution logs | Passed |
| CloudWatch invocation metric discovery | Passed |
| AWS X-Ray trace retrieval | Passed |

Two separate authenticated user sessions were used to verify
that each user could only retrieve their own TODO items.

## 10. Screenshots and Submission Evidence

The following screenshots document the implementation,
deployment, and testing of the application.

### 10.1 Local Frontend Build

The React application running locally and connecting to the
deployed backend.

Local Frontend Build: screenshots/local_build.png

### 10.2 Create TODO

A TODO item successfully created through the React frontend.

This screenshot was captured before the code refactoring.

Create TODO: screenshots/pre-refactor_add-todo.png

### 10.3 Update TODO

A TODO item updated through the frontend.

This screenshot was captured before the code refactoring.

Update TODO: screenshots/pre-refactor_edit-todo.png

### 10.4 Delete TODO

Evidence collected during TODO deletion testing.

This screenshot was captured before the code refactoring.

Delete TODO: screenshots/pre-refactor_delete-todo.png

### 10.5 AWS Deployment

Successful deployment of the Serverless TODO application
using the Serverless Framework.

This screenshot was captured before the code refactoring.

AWS Deployment: screenshots/pre-refactor_deployment.png

### 10.6 User Isolation

Two authenticated users with separate TODO items.

This screenshot was captured before the code refactoring.

User Isolation: screenshots/pre-refactor_user-isolation.png

### 10.7 Unauthorized Request

An API request without valid authorization returning
HTTP 401 Unauthorized.

Unauthorized Request: screenshots/pre-refactor_user-unauthorized-test.png

### 10.8 Post-Refactoring Functionality

The deployed application after refactoring the backend into
HTTP handlers, business logic, and data access layers.

The screenshot demonstrates successful TODO operations and
attachment display after the refactoring.

Post-Refactoring TODO Application: screenshots/refactor-todos.png

### 10.9 AWS Monitoring

Evidence of CloudWatch logging, metrics, and AWS X-Ray
verification.

AWS Monitoring: screenshots/AWS%20monitoring.png

## 11. Security Considerations

The application implements the following security measures:

- Auth0 JWT authentication
- API Gateway custom Lambda authorizer
- User-specific DynamoDB access
- Private S3 attachment storage
- Time-limited presigned S3 URLs
- Per-function IAM permissions
- Input validation and HTTP error handling

AWS credentials and private secrets must not be committed
to the repository.

## 12. Project Completion Status

The Serverless TODO application has been:

- Implemented
- Deployed to AWS
- Tested end-to-end
- Refactored into separate architectural layers
- Verified using CloudWatch and AWS X-Ray
- Documented with functionality and deployment screenshots

The project demonstrates serverless application development,
authentication, DynamoDB data modeling, S3 integration,
least-privilege IAM configuration, and AWS monitoring.
