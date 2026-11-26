# On-Demand Revalidation API

This document explains how to use the on-demand revalidation API to invalidate ISR cache when course content is updated.

## Overview

Course detail and category pages use Incremental Static Regeneration (ISR) with a 5-minute cache period. When instructors update course content, you can trigger immediate cache invalidation using the revalidation API instead of waiting for the automatic revalidation period.

## Endpoint

```
POST /api/revalidate
```

## Authentication

The API requires a secret token set via the `REVALIDATION_SECRET` environment variable. This prevents unauthorized cache manipulation.

## Request Format

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "path": "/courses/course_123",
  "secret": "your-revalidation-token"
}
```

**Parameters:**
- `path` (required): The Next.js route path to revalidate (e.g., `/courses/course_123`, `/categories/tailoring`)
- `secret` (required): The revalidation secret token (matches `REVALIDATION_SECRET` env var)

## Response Format

### Success (200 OK)
```json
{
  "revalidated": true,
  "path": "/courses/course_123",
  "now": 1700000000000
}
```

### Invalid Secret (401 Unauthorized)
```json
{
  "revalidated": false,
  "error": "Invalid secret"
}
```

### Missing Path (400 Bad Request)
```json
{
  "revalidated": false,
  "error": "Path parameter is required"
}
```

### Server Error (500)
```json
{
  "revalidated": false,
  "error": "Revalidation is not configured on this server"
}
```

## Examples

### cURL

```bash
curl -X POST https://hamplard.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/courses/course_123",
    "secret": "your-revalidation-token"
  }'
```

### Node.js

```javascript
async function revalidateCourse(courseId) {
  const response = await fetch('https://hamplard.com/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: `/courses/${courseId}`,
      secret: process.env.REVALIDATION_SECRET,
    }),
  });

  const data = await response.json();
  
  if (!data.revalidated) {
    throw new Error(`Revalidation failed: ${data.error}`);
  }
  
  return data;
}
```

### Python

```python
import requests
import os

def revalidate_course(course_id):
    url = 'https://hamplard.com/api/revalidate'
    payload = {
        'path': f'/courses/{course_id}',
        'secret': os.environ['REVALIDATION_SECRET']
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    if not data.get('revalidated'):
        raise Exception(f"Revalidation failed: {data.get('error')}")
    
    return data
```

## Integration Points

### When to Trigger Revalidation

1. **Course Updates**
   - Instructor updates course title, description, or thumbnail
   - Instructor adds/removes/reorders modules or lessons
   - Instructor changes course pricing
   - Admin approves/rejects course

2. **Category Updates**
   - New course added to a category
   - Course removed from a category
   - Course status changed (published/unpublished)

3. **Instructor Profile Updates**
   - Instructor changes name or avatar (affects course cards)
   - Instructor bio updated (shown on course detail pages)

### Backend Integration Example

```javascript
// In your backend course update handler
async function updateCourse(courseId, updates) {
  // 1. Update course in database
  await db.courses.update(courseId, updates);
  
  // 2. Revalidate frontend cache
  await revalidateFrontendCache(`/courses/${courseId}`);
  
  // 3. If category changed, revalidate category pages
  if (updates.category) {
    await revalidateFrontendCache(`/categories/${updates.category.slug}`);
    if (updates.oldCategory) {
      await revalidateFrontendCache(`/categories/${updates.oldCategory.slug}`);
    }
  }
  
  return { success: true };
}

async function revalidateFrontendCache(path) {
  try {
    const response = await fetch(`${process.env.FRONTEND_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        secret: process.env.REVALIDATION_SECRET,
      }),
    });
    
    if (!response.ok) {
      console.error('Revalidation failed:', await response.text());
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    // Don't throw - cache will auto-refresh in 5 minutes anyway
  }
}
```

## Setup

### 1. Generate Secret Token

```bash
openssl rand -base64 32
```

### 2. Add to Environment Variables

**Development** (`.env.local`):
```bash
REVALIDATION_SECRET=your-generated-token-here
```

**Production** (Vercel/hosting platform):
```bash
vercel env add REVALIDATION_SECRET
# Paste your token when prompted
```

### 3. Configure Backend

Add the same secret to your backend environment:
```bash
REVALIDATION_SECRET=same-token-as-frontend
FRONTEND_URL=https://hamplard.com
```

## Security Considerations

1. **Keep Secret Private**: Never commit the revalidation secret to version control
2. **Use HTTPS**: Only call the API over HTTPS in production
3. **Backend Only**: Only call this API from your backend, not from client-side code
4. **Rate Limiting**: Consider implementing rate limiting if you expect high revalidation frequency
5. **Logging**: Log revalidation requests for audit purposes

## Troubleshooting

### "Invalid secret" Error

**Cause**: The secret in your request doesn't match the `REVALIDATION_SECRET` environment variable.

**Solution**:
1. Verify the secret is set correctly in production: `vercel env ls`
2. Ensure your backend is using the same secret
3. Check for extra whitespace or newlines in the secret

### "Revalidation is not configured" Error

**Cause**: The `REVALIDATION_SECRET` environment variable is not set on the frontend.

**Solution**:
1. Add `REVALIDATION_SECRET` to your hosting platform's environment variables
2. Redeploy the application

### Cache Not Updating

**Possible Causes**:
1. Wrong path format (should match Next.js route exactly)
2. CDN caching in front of Next.js
3. Browser caching (check with Incognito mode)

**Solution**:
1. Verify path matches the route exactly: `/courses/course_123` not `/courses?id=course_123`
2. If using a CDN, purge CDN cache or add cache-busting headers
3. Clear browser cache or test in Incognito mode

## Monitoring

### Track Revalidation Requests

Add logging to your backend:

```javascript
async function revalidateFrontendCache(path) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${process.env.FRONTEND_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, secret: process.env.REVALIDATION_SECRET }),
    });
    
    const duration = Date.now() - startTime;
    
    console.log('Revalidation request:', {
      path,
      status: response.status,
      duration,
      success: response.ok,
    });
    
    return response.ok;
  } catch (error) {
    console.error('Revalidation error:', { path, error: error.message });
    return false;
  }
}
```

### Metrics to Track

1. **Revalidation Success Rate**: Track successful vs failed revalidation requests
2. **Response Time**: Monitor API response times
3. **Frequency**: Track how often different paths are revalidated
4. **Error Types**: Categorize errors (auth failures, network errors, etc.)

## Best Practices

1. **Batch Updates**: If updating multiple courses, consider batching revalidation requests
2. **Async Processing**: Don't block course updates waiting for revalidation - fire and forget
3. **Fallback Strategy**: If revalidation fails, cache will auto-refresh in 5 minutes anyway
4. **Selective Revalidation**: Only revalidate paths that actually changed
5. **Testing**: Test revalidation in staging before deploying to production

## Related Documentation

- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Next.js revalidatePath API](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [BUNDLE_OPTIMIZATION.md](../BUNDLE_OPTIMIZATION.md)
