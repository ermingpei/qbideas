# Interaction Features - Quick Start Guide

## 🚀 Getting Started

### 1. Start the Services
```bash
# Start API (from services/api directory)
npm run dev

# Start Frontend (from frontend directory)
npm run dev
```

### 2. Test the Features
```bash
# Run the interaction test script
./test-interactions.sh
```

## 📱 User Actions

### Like an Idea ❤️
1. Navigate to any idea detail page
2. Click the "Like" button (heart icon)
3. Button turns red and shows "Liked"
4. Like count increments by 1
5. Click again to unlike

**Requirements**: Must be logged in

### Bookmark an Idea 🔖
1. Navigate to any idea detail page
2. Click the "Bookmark" button
3. Button turns blue and shows "Bookmarked"
4. Bookmark count increments by 1
5. Click again to remove bookmark

**Requirements**: Must be logged in

### Comment on an Idea 💬
1. Navigate to any idea detail page
2. Scroll to comments section
3. Type your comment in the text area
4. Click "Post Comment"
5. Your comment appears immediately
6. Comment count increments by 1

**Requirements**: Must be logged in

### Reply to a Comment
1. Find a comment you want to reply to
2. Click the "Reply" button
3. Type your reply
4. Click "Reply" to post
5. Your reply appears nested under the original comment

**Requirements**: Must be logged in

### Edit Your Comment
1. Find your own comment
2. Click the edit icon (pencil)
3. Modify the text
4. Click "Save"
5. Comment shows "(edited)" indicator

**Requirements**: Must be the comment author

### Delete Your Comment
1. Find your own comment
2. Click the delete icon (trash)
3. Confirm deletion
4. Comment is removed
5. Comment count decrements by 1

**Requirements**: Must be the comment author

### Share an Idea 🔗
1. Navigate to any idea detail page
2. Click the "Share" button
3. On mobile: Native share dialog opens
4. On desktop: Link copied to clipboard
5. Success message appears

**Requirements**: None (anyone can share)

## 🎨 Visual Indicators

### Like Status
- **Not Liked**: Empty heart outline, gray color
- **Liked**: Filled heart, red color, "Liked" text

### Bookmark Status
- **Not Bookmarked**: Empty bookmark outline, gray color
- **Bookmarked**: Filled bookmark, blue color, "Bookmarked" text

### Comment Status
- **Regular**: Normal text
- **Edited**: Shows "(edited)" next to timestamp
- **Your Comment**: Edit and delete buttons visible

## 📊 Live Statistics

All these stats update in real-time:

| Stat | Icon | Description |
|------|------|-------------|
| Views | 👁️ | Number of times idea was viewed |
| Likes | ❤️ | Number of users who liked |
| Comments | 💬 | Number of comments posted |
| Bookmarks | 🔖 | Number of users who bookmarked |
| Unlocks | 🔓 | Number of premium unlocks |
| Builds | 👥 | Number of users building it |

## 🔐 Authentication Flow

### When Not Logged In
1. Click any protected action (like, bookmark, comment)
2. Automatically redirected to `/login`
3. After login, return to the idea page
4. Perform the action

### When Logged In
1. All interaction buttons are active
2. Actions execute immediately
3. UI updates in real-time
4. State persists across sessions

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Can view ideas without login
- [ ] Can see all statistics
- [ ] Like button requires login
- [ ] Bookmark button requires login
- [ ] Comment form requires login
- [ ] Share button works without login

### Like Feature
- [ ] Like button works
- [ ] Unlike button works
- [ ] Like count updates
- [ ] Status persists after refresh
- [ ] Visual feedback is clear

### Bookmark Feature
- [ ] Bookmark button works
- [ ] Unbookmark button works
- [ ] Bookmark count updates
- [ ] Status persists after refresh
- [ ] Visual feedback is clear

### Comment Feature
- [ ] Can post comments
- [ ] Can reply to comments
- [ ] Can edit own comments
- [ ] Can delete own comments
- [ ] Comment count updates
- [ ] Timestamps are correct
- [ ] User info displays correctly

### Share Feature
- [ ] Share button works
- [ ] Link is copied correctly
- [ ] Success message appears
- [ ] Works on mobile and desktop

## 🐛 Common Issues & Solutions

### Issue: "Authentication required" error
**Solution**: Log in at `/login` or sign up at `/signup`

### Issue: Like/Bookmark button doesn't respond
**Solution**: 
1. Check if you're logged in
2. Check browser console for errors
3. Verify API is running on port 3000

### Issue: Comments don't load
**Solution**:
1. Check API is running
2. Check browser console for errors
3. Try refreshing the page

### Issue: Stats don't update
**Solution**:
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Check API logs for errors

### Issue: Can't edit/delete comment
**Solution**:
1. Verify you're the comment author
2. Check if you're still logged in
3. Try refreshing the page

## 📝 API Endpoints Reference

### Interactions
```
POST   /api/interactions/:ideaId/like          - Like/unlike idea
POST   /api/interactions/:ideaId/bookmark      - Bookmark/unbookmark idea
GET    /api/interactions/:ideaId/comments      - Get comments
POST   /api/interactions/:ideaId/comments      - Post comment
PUT    /api/interactions/comments/:commentId   - Update comment
DELETE /api/interactions/comments/:commentId   - Delete comment
GET    /api/interactions/:ideaId/status        - Get user's interaction status
```

### Ideas (with interaction status)
```
GET    /api/ideas                              - List ideas (includes isLiked, isBookmarked)
GET    /api/ideas/:slug                        - Get idea detail (includes all stats)
```

## 💡 Tips & Best Practices

### For Users
1. **Like ideas you find interesting** - Helps others discover great ideas
2. **Bookmark ideas to build later** - Easy access from your profile
3. **Comment with constructive feedback** - Help improve ideas
4. **Share ideas you love** - Grow the community

### For Developers
1. **Use React Query** - Automatic caching and refetching
2. **Implement optimistic updates** - Better UX
3. **Handle errors gracefully** - Show user-friendly messages
4. **Add loading states** - Indicate when actions are processing
5. **Validate input** - Prevent invalid data

## 🎯 Next Steps

1. **Explore Ideas**: Browse `/ideas` to see all ideas
2. **Create Account**: Sign up at `/signup`
3. **Interact**: Like, bookmark, and comment on ideas
4. **Submit Ideas**: Share your own ideas at `/ideas/submit`
5. **Build**: Start building ideas you've unlocked

## 📚 Additional Resources

- [Full Documentation](./INTERACTION_FEATURES.md)
- [API Documentation](http://localhost:3000/docs)
- [Frontend Components](./frontend/components/)
- [API Routes](./services/api/src/routes/)

## 🆘 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check API logs for server errors
3. Review the full documentation
4. Check the test script output
5. Verify all services are running

---

**Happy Interacting! 🎉**
