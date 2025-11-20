# Browser Testing Checklist for Auth System

## Prerequisites
- ✅ API running on http://localhost:3000
- ✅ Frontend running on http://localhost:3002
- ✅ PostgreSQL and Redis running in Docker

## Test Checklist

### ✅ Test 1: Initial State (Logged Out)
- [ ] Open http://localhost:3002
- [ ] Header shows "Sign In" button
- [ ] Header shows "Get Started" button
- [ ] No user dropdown visible

### ✅ Test 2: Signup Flow
- [ ] Click "Get Started" or navigate to /signup
- [ ] Fill in form:
  - Username: `testuser` + random number
  - Email: `test@example.com`
  - Password: `password123`
- [ ] Click "Create account"
- [ ] Should redirect to /ideas
- [ ] Header should show username
- [ ] Header should show user avatar/initial
- [ ] Header should show dropdown arrow

### ✅ Test 3: Session Persistence After Signup
- [ ] Press F5 or Cmd+R to refresh page
- [ ] Should STAY logged in
- [ ] Header still shows username
- [ ] User dropdown still available

### ✅ Test 4: User Dropdown Menu
- [ ] Click on username in header
- [ ] Dropdown should appear with:
  - [ ] Username displayed
  - [ ] Email displayed
  - [ ] Reputation score displayed
  - [ ] "Profile" link
  - [ ] "Dashboard" link
  - [ ] "Earnings" link
  - [ ] "Logout" button (in red)
- [ ] Click outside dropdown
- [ ] Dropdown should close

### ✅ Test 5: Logout
- [ ] Click username to open dropdown
- [ ] Click "Logout" button
- [ ] Should redirect to home page (/)
- [ ] Header should show "Sign In" and "Get Started" buttons
- [ ] No user dropdown visible
- [ ] Refresh page
- [ ] Should STAY logged out

### ✅ Test 6: Login Flow
- [ ] Click "Sign In" or navigate to /login
- [ ] Fill in form:
  - Email: (use email from signup)
  - Password: `password123`
- [ ] Click "Sign in"
- [ ] Should redirect to /ideas
- [ ] Header should show username
- [ ] User dropdown available

### ✅ Test 7: Session Persistence After Login
- [ ] Refresh page multiple times
- [ ] Should STAY logged in each time
- [ ] Open new tab to http://localhost:3002
- [ ] Should be logged in there too
- [ ] Close and reopen browser
- [ ] Navigate to http://localhost:3002
- [ ] Should STILL be logged in (token persists)

### ✅ Test 8: Protected Routes (Logged Out)
- [ ] Logout if logged in
- [ ] Navigate directly to /ideas/submit
- [ ] Should redirect to /login
- [ ] Should see login form

### ✅ Test 9: Protected Routes (Logged In)
- [ ] Login with valid credentials
- [ ] Navigate to /ideas/submit
- [ ] Should show idea submission form
- [ ] Should NOT redirect to login

### ✅ Test 10: Already Authenticated Redirect
- [ ] While logged in, navigate to /login
- [ ] Should redirect to /ideas
- [ ] While logged in, navigate to /signup
- [ ] Should redirect to /ideas

### ✅ Test 11: Invalid Credentials
- [ ] Logout if logged in
- [ ] Go to /login
- [ ] Enter invalid email/password
- [ ] Click "Sign in"
- [ ] Should show error message
- [ ] Should NOT redirect
- [ ] Should stay on login page

### ✅ Test 12: Token Expiration Simulation
- [ ] Login successfully
- [ ] Open DevTools (F12)
- [ ] Go to Application > Local Storage
- [ ] Find `auth_token` key
- [ ] Delete the token
- [ ] Refresh page
- [ ] Should be logged out
- [ ] Header should show "Sign In" and "Get Started"

### ✅ Test 13: Multiple Browser Tabs
- [ ] Login in first tab
- [ ] Open second tab to http://localhost:3002
- [ ] Should be logged in there too
- [ ] Logout in first tab
- [ ] Refresh second tab
- [ ] Should be logged out (token removed)

### ✅ Test 14: Navigation While Logged In
- [ ] Login successfully
- [ ] Click "Browse Ideas" in nav
- [ ] Header should still show user info
- [ ] Click "Trending" in nav
- [ ] Header should still show user info
- [ ] Click "Builds" in nav
- [ ] Header should still show user info
- [ ] User should stay logged in throughout

### ✅ Test 15: Responsive Design
- [ ] Login successfully
- [ ] Resize browser to mobile width
- [ ] User dropdown should still work
- [ ] Username might be hidden on small screens
- [ ] Avatar/initial should still be visible
- [ ] Dropdown menu should be accessible

## Expected Results Summary

✅ **Session Persistence**: User stays logged in after page refresh
✅ **Header Updates**: Shows user info when logged in, login buttons when logged out
✅ **User Dropdown**: Shows user details and action links
✅ **Logout**: Properly clears session and redirects
✅ **Protected Routes**: Redirects to login when not authenticated
✅ **Auth Redirects**: Logged-in users can't access login/signup pages
✅ **Error Handling**: Shows appropriate error messages
✅ **Token Management**: Properly stores and validates JWT tokens

## Common Issues & Solutions

### Issue: User gets logged out on refresh
**Check**: 
- Browser console for errors
- Network tab for failed API calls
- Verify `/api/auth/verify-token` endpoint is working

### Issue: Dropdown doesn't appear
**Check**:
- Click directly on username/avatar
- Check browser console for JavaScript errors
- Verify z-index and positioning in DevTools

### Issue: Protected routes don't redirect
**Check**:
- Verify `ProtectedRoute` component is wrapping the page
- Check auth context is initialized
- Look for errors in browser console

### Issue: Login/Signup doesn't work
**Check**:
- Network tab for API response
- Verify API is running on port 3000
- Check credentials are correct
- Look for validation errors

## Testing Complete! 🎉

If all tests pass, the Auth Context & User Session Management system is working perfectly!

## Next: Manual Browser Testing

1. Open http://localhost:3002 in your browser
2. Go through each test in this checklist
3. Check off each item as you complete it
4. Report any issues found

Happy testing! 🚀
