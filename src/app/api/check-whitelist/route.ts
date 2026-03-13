import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseAdmin';
import { normalizeWallet } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is available
    if (!firestore) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable - please try again later' },
        { status: 503 }
      );
    }
    const body = await request.json();
    const { wallet } = body;

    // Validate required fields
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Read from Firestore
    try {
      const normalizedWallet = normalizeWallet(wallet);
      const submissionsRef = firestore.collection('whitelistSubmissions');

      const snapshot = await submissionsRef
        .where('normalizedWallet', '==', normalizedWallet)
        .get();

      if (snapshot.empty) {
        return NextResponse.json(
          { found: false, message: 'Not found on whitelist' },
          { status: 200 }
        );
      }

      const submissions = snapshot.docs.map((doc: any) => doc.data());
      const primary = submissions[0];
      const hasPhase2 = submissions.some((s: any) => !!s.code);
      const hasPhase3 = submissions.some((s: any) => !s.code);

      return NextResponse.json(
        {
          found: true,
          submission: {
            twitter: primary.twitter,
            wallet: primary.wallet,
            code: primary.code,
            phase2: hasPhase2,
            phase3: hasPhase3,
            timestamp: primary.createdAt?.toDate?.()?.toISOString?.() ?? null,
          },
        },
        { status: 200 }
      );

    } catch (error) {
      return NextResponse.json(
        { error: 'Unable to check whitelist status' },
        { status: 500 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Whitelist checker API endpoint is active' },
    { status: 200 }
  );
}
