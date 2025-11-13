# API Setup Guide

## Configuration

The authentication API is configured in `src/lib/api.ts`. Update the `API_BASE_URL` constant or set the `NEXT_PUBLIC_API_URL` environment variable.

## Expected API Endpoints

### POST /auth/login
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

**Error Response (400/401):**
```json
{
  "message": "Invalid credentials",
  "errors": {
    "email": ["Email is required"]
  }
}
```

### POST /auth/signup
**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "message": "Email already exists",
  "errors": {
    "email": ["Email is already registered"]
  }
}
```

## Environment Variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Testing with Mock API

For development/testing, you can use tools like:
- [JSON Server](https://github.com/typicode/json-server)
- [Mock Service Worker](https://mswjs.io/)
- [Postman Mock Server](https://learning.postman.com/docs/designing-and-developing-your-api/mocking-data/)

## Backend Integration Examples

### Supabase
```typescript
// Update API_BASE_URL to: https://your-project.supabase.co/rest/v1
```

### Firebase
```typescript
// Update API_BASE_URL to: https://your-project.firebaseapp.com/api
```

### Custom Node.js/Express API
```typescript
// Update API_BASE_URL to: http://localhost:3001/api
```

