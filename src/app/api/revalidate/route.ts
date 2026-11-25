import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation API route for instructors' content updates.
 * 
 * This endpoint allows instructors or admin systems to trigger immediate
 * cache invalidation when course content is updated, without waiting for
 * the 5-minute ISR revalidation period.
 * 
 * @example
 * POST /api/revalidate
 * {
 *   "path": "/courses/course_123",
 *   "secret": "your-revalidation-token"
 * }
 * 
 * Or revalidate a category:
 * {
 *   "path": "/categories/tailoring",
 *   "secret": "your-revalidation-token"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, secret } = body;

    // Verify the secret token to prevent unauthorized revalidation
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    
    if (!revalidationSecret) {
      return NextResponse.json(
        { 
          revalidated: false, 
          error: 'Revalidation is not configured on this server' 
        },
        { status: 500 }
      );
    }

    if (secret !== revalidationSecret) {
      return NextResponse.json(
        { revalidated: false, error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Validate path parameter
    if (!path || typeof path !== 'string') {
      return NextResponse.json(
        { revalidated: false, error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Revalidate the specified path
    revalidatePath(path);

    return NextResponse.json({ 
      revalidated: true, 
      path,
      now: Date.now() 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        revalidated: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
