# Auth System Quick Reference

## Using Auth in Your Components

### Import the Hook
```typescript
import { useAuth } from '@/contexts/AuthContext'
```

### Access Auth State
```typescript
const { user, isAuthenticated, isLoading, login, logout, signup } = useAuth()
```

### Check if User is Logged In
```typescript
if (isAuthenticated) {
  // User is logged in
}
```

### Get User Information
```typescript
const { user } = useAuth()

// Available user properties:
user.id              // string
user.username        // string
user.email           // string
user.emailVerified   // boolean
user.profileImageUrl // string | undefined
user.reputationScore // number
```

### Show Loading State
```typescript
const { isLoading } = useAuth()

if (isLoading) {
  return <div>Loading...</div>
}
```

## Protecting Routes

### Wrap Page with ProtectedRoute
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to logged-in users</div>
    </ProtectedRoute>
  )
}
```

### Custom Redirect
```typescript
<ProtectedRoute redirectTo="/custom-login">
  <div>Protected content</div>
</ProtectedRoute>
```

## Conditional Rendering

### Show Content Based on Auth State
```typescript
const { isAuthenticated, user } = useAuth()

return (
  <div>
    {isAuthenticated ? (
      <p>Welcome, {user?.username}!</p>
    ) : (
      <p>Please log in</p>
    )}
  </div>
)
```

### Show Different UI for Logged In Users
```typescript
const { isAuthenticated } = useAuth()

return (
  <div>
    {isAuthenticated ? (
      <button onClick={handleSubmit}>Submit Idea</button>
    ) : (
      <Link href="/login">Login to Submit</Link>
    )}
  </div>
)
```

## Making Authenticated API Calls

### The API Client Handles Auth Automatically
```typescript
import { api } from '@/lib/api'

// Token is automatically included in headers
const response = await api.submitIdea(data)
const response = await api.likeIdea(ideaId)
const response = await api.bookmarkIdea(ideaId)
```

### Manual Token Access (if needed)
```typescript
import { api } from '@/lib/api'

const token = api.getToken()
```

## Auth Methods

### Login
```typescript
const { login } = useAuth()

try {
  await login(email, password)
  // Success - user is now logged in
  router.push('/dashboard')
} catch (error) {
  // Handle error
  console.error('Login failed:', error)
}
```

### Signup
```typescript
const { signup } = useAuth()

try {
  await signup(username, email, password)
  // Success - user is now logged in
  router.push('/dashboard')
} catch (error) {
  // Handle error
  console.error('Signup failed:', error)
}
```

### Logout
```typescript
const { logout } = useAuth()

// Logout and redirect to home
logout()
```

### Check Auth Status
```typescript
const { checkAuth } = useAuth()

// Manually re-check authentication
await checkAuth()
```

## Common Patterns

### Redirect After Login
```typescript
const router = useRouter()
const { login } = useAuth()

const handleLogin = async () => {
  try {
    await login(email, password)
    router.push('/dashboard')
  } catch (error) {
    setError(error.message)
  }
}
```

### Show User Avatar
```typescript
const { user } = useAuth()

return (
  <div>
    {user?.profileImageUrl ? (
      <img src={user.profileImageUrl} alt={user.username} />
    ) : (
      <div className="avatar-placeholder">
        {user?.username.charAt(0).toUpperCase()}
      </div>
    )}
  </div>
)
```

### Conditional Navigation
```typescript
const { isAuthenticated } = useAuth()

return (
  <nav>
    <Link href="/">Home</Link>
    <Link href="/ideas">Ideas</Link>
    {isAuthenticated ? (
      <>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/ideas/submit">Submit Idea</Link>
      </>
    ) : (
      <>
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign Up</Link>
      </>
    )}
  </nav>
)
```

### Loading State with Skeleton
```typescript
const { isLoading, user } = useAuth()

if (isLoading) {
  return <div className="skeleton">Loading...</div>
}

return <div>Welcome, {user?.username}!</div>
```

## TypeScript Types

### User Type
```typescript
interface User {
  id: string
  username: string
  email: string
  emailVerified: boolean
  profileImageUrl?: string
  reputationScore: number
}
```

### Auth Context Type
```typescript
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}
```

## API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-token` - Verify token

## Token Storage

Tokens are stored in `localStorage` with key `auth_token`:
- Automatically set on login/signup
- Automatically included in API requests
- Automatically removed on logout
- Persists across page refreshes
- Expires after 7 days

## Best Practices

1. **Always use `useAuth()` hook** - Don't access localStorage directly
2. **Check `isLoading` before rendering** - Prevents flash of wrong content
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Use ProtectedRoute for auth-required pages** - Automatic redirect
5. **Don't store sensitive data in state** - Only store what's needed
6. **Logout on token expiration** - Auth context handles this automatically

## Debugging

### Check Auth State
```typescript
const auth = useAuth()
console.log('Auth State:', {
  isAuthenticated: auth.isAuthenticated,
  isLoading: auth.isLoading,
  user: auth.user,
})
```

### Check Token
```typescript
import { api } from '@/lib/api'
console.log('Token:', api.getToken())
```

### Verify Token
```typescript
const { checkAuth } = useAuth()
await checkAuth()
```

## Need Help?

- See `AUTH_CONTEXT_IMPLEMENTATION.md` for full documentation
- See `BROWSER_TEST_CHECKLIST.md` for testing guide
- Check browser console for errors
- Check Network tab for API responses
