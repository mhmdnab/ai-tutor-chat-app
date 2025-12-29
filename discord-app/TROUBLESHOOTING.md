# Troubleshooting Guide

## Common Issues and Solutions

### "Multiple matrix-js-sdk entrypoints detected"

**Cause**: Next.js is bundling the Matrix SDK multiple times.

**Solution**: Already fixed in [lib/matrix-client.ts](lib/matrix-client.ts:3-6) - the SDK entrypoint flag is cleared before import.

If you still see this error:
```bash
# Kill all Next.js processes
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### "Module not found" or Path Resolution Errors

**Cause**: Turbopack (Next.js 16+) has different module resolution than webpack.

**Solution**: The app works without custom webpack/turbopack config. If you added custom configs, remove them and keep the config minimal (see [next.config.ts](next.config.ts)).

### "Encountered two children with the same key"

**Cause**: Duplicate messages in the timeline.

**Solution**: Already fixed - duplicate detection is in place in [app/chat/page.tsx](app/chat/page.tsx:38-44).

### Port Already in Use

**Error**: `Port 3000 is in use`

**Solution**:
```bash
# Option 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
npm run dev -- -p 3001
```

### Login Fails

**Possible Causes**:
1. Wrong username (use `username` not `@username:matrix.org`)
2. Wrong password
3. Homeserver URL incorrect

**Solution**:
- Verify credentials at [https://app.element.io](https://app.element.io)
- Try logging in there first to confirm they work

### Messages Not Appearing

**Possible Causes**:
1. Matrix client not synced
2. Room not selected
3. Network issues

**Solution**:
- Check browser console for errors
- Refresh the page
- Verify you're logged in

### Build Errors

**TypeScript Errors**:
```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules
npm install

# Build again
npm run build
```

### Clear All Caches

If nothing else works:
```bash
# Full reset
pkill -f "next dev"
rm -rf .next
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

## Development Tips

### Hot Reload Not Working

**Solution**:
```bash
# Restart the dev server
# Press Ctrl+C to stop
npm run dev
```

### Checking Logs

**Browser Console**: Open DevTools (F12) → Console
**Server Logs**: Check terminal where `npm run dev` is running

### Testing Real-time Features

1. Open app in browser A
2. Open [Element](https://app.element.io) in browser B
3. Login with same account
4. Send message from one, see it appear in the other

## Need More Help?

- Check [Matrix JS SDK Docs](https://matrix-org.github.io/matrix-js-sdk/)
- Check [Next.js Docs](https://nextjs.org/docs)
- Review [README.md](README.md) for features
- Check [QUICKSTART.md](QUICKSTART.md) for setup
