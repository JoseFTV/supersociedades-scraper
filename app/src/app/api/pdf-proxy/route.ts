import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isAuthError, safeErrorResponse } from '@/lib/auth-guard';

/**
 * GET /api/pdf-proxy?caseId=xxx
 * Proxies PDF content from Vercel Blob (private store) to the browser.
 * This allows iframes to display PDFs from private blob storage.
 * Requires authentication.
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult.error;

    const caseId = req.nextUrl.searchParams.get('caseId');
    if (!caseId) {
      return NextResponse.json({ error: 'caseId required' }, { status: 400 });
    }

    const caso = await prisma.case.findUnique({
      where: { id: caseId },
      select: { pdfBlobUrl: true, sourceUrl: true },
    });

    if (!caso?.pdfBlobUrl) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Fetch the PDF from Vercel Blob with the auth token
    const response = await fetch(caso.pdfBlobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`[PDF Proxy] Failed to fetch blob: ${response.status}`);
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 502 });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${caso.sourceUrl || 'document.pdf'}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'PDF Proxy');
  }
}
