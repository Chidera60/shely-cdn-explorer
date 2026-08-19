import { NextRequest, NextResponse } from 'next/server';
import { getStoredBlobData, getSafeCachePath, getMimeTypeFromExt } from '@/lib/shelby/storage';
import fs from 'fs';

export const dynamic = 'force-dynamic';

/**
 * High-Availability CDN Edge Delivery Route
 * Serves stored Shelby blobs with appropriate MIME headers, caching rules, and CORS.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { blobPath: string[] } }
) {
  try {
    const blobPath = params.blobPath ? params.blobPath.join('/') : '';
    if (!blobPath) {
      return NextResponse.json({ error: 'Missing blob path' }, { status: 400 });
    }

    // 1. Check in-memory/disk store via storage manager
    const stored = getStoredBlobData(blobPath);
    if (stored) {
      return new NextResponse(new Uint8Array(stored.buffer), {
        status: 200,
        headers: {
          'Content-Type': stored.mimeType,
          'Content-Length': stored.buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Shelby-CDN-Status': 'HIT',
        },
      });
    }

    // 2. Safe disk path check
    const safePath = getSafeCachePath(blobPath);
    if (!safePath) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!fs.existsSync(safePath)) {
      return NextResponse.json(
        {
          error: 'Blob not found',
          message: `Blob '${blobPath}' does not exist on Shelby CDN storage edge.`,
        },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(safePath);
    const contentType = getMimeTypeFromExt(safePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Shelby-CDN-Status': 'HIT',
      },
    });
  } catch (error: any) {
    console.error('CDN retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal CDN retrieval error' },
      { status: 500 }
    );
  }
}
