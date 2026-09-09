import { NextRequest, NextResponse } from 'next/server';
import { getLiveSignals } from '@/lib/signals';

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('refresh') === 'true';

  try {
    const result = await getLiveSignals({ perSourceLimit: 6, force });
    return NextResponse.json(result, {
      headers: {
        // Let a CDN cache this for a bit, but always allow a manual refresh to bypass it.
        'Cache-Control': force ? 'no-store' : 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (err) {
    console.error('[api/signals] Unhandled error:', err);
    return NextResponse.json(
      { signals: [], fetchedAt: new Date().toISOString(), sources: {}, error: 'Failed to fetch live signals' },
      { status: 200 }
    );
  }
}
