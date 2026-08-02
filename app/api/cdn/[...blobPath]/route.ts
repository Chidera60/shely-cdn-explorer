import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CACHE_DIR = path.join(process.cwd(), '.shelby_cache');

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

    const filePath = path.join(CACHE_DIR, blobPath);

    // Security check to prevent directory traversal
    if (!filePath.startsWith(CACHE_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          error: 'Blob not found',
          message: `Blob '${blobPath}' does not exist on Shelby CDN storage edge.`,
        },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Determine MIME type
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.pdf') contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
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
