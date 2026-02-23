import { NextRequest, NextResponse } from 'next/server';
import { validateWallet, validateTwitter, validatePhase2Code, normalizeTwitter, normalizeWallet } from '@/lib/utils';
import { firestore, FieldValue } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { twitter, wallet, code } = body;

    // Validate required fields
    if (!twitter || !wallet) {
      return NextResponse.json(
        { error: 'Twitter username and wallet address are required' },
        { status: 400 }
      );
    }

    // Validate inputs using shared utilities
    if (!validateWallet(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (!validateTwitter(twitter)) {
      return NextResponse.json(
        { error: 'Invalid Twitter username' },
        { status: 400 }
      );
    }

    if (code && !validatePhase2Code(code)) {
      return NextResponse.json(
        { error: 'Invalid Phase 2 code format' },
        { status: 400 }
      );
    }

    // Validate Phase 2 access code if provided
    const submissionsRef = firestore.collection('whitelistSubmissions');
    const phase2CodesRef = firestore.collection('phase2Codes');

    const normalizedTwitter = normalizeTwitter(twitter);
    const normalizedWallet = normalizeWallet(wallet);
    const hasCode = Boolean(code);
    const uppercaseCode = code ? code.toUpperCase() : null;

    try {
      await firestore.runTransaction(async (transaction) => {
        const twitterQuery = submissionsRef
          .where('normalizedTwitter', '==', normalizedTwitter)
          .where('hasCode', '==', hasCode)
          .limit(1);
        const walletQuery = submissionsRef
          .where('normalizedWallet', '==', normalizedWallet)
          .where('hasCode', '==', hasCode)
          .limit(1);

        const [twitterSnap, walletSnap] = await Promise.all([
          transaction.get(twitterQuery),
          transaction.get(walletQuery),
        ]);

        if (!twitterSnap.empty) {
          throw new Error(`twitter_exists_${hasCode ? 'phase2' : 'phase3'}`);
        }

        if (!walletSnap.empty) {
          throw new Error(`wallet_exists_${hasCode ? 'phase2' : 'phase3'}`);
        }

        let codeDocRef: FirebaseFirestore.DocumentReference | null = null;
        if (uppercaseCode) {
          codeDocRef = phase2CodesRef.doc(uppercaseCode);
          const codeDoc = await transaction.get(codeDocRef);

          if (!codeDoc.exists) {
            throw new Error('invalid_code');
          }

          if (codeDoc.data()?.used) {
            throw new Error('code_used');
          }
        }

        const submissionRef = submissionsRef.doc();
        transaction.set(submissionRef, {
          twitter,
          wallet,
          code: code || null,
          normalizedTwitter,
          normalizedWallet,
          hasCode,
          createdAt: FieldValue.serverTimestamp(),
        });

        if (codeDocRef) {
          transaction.update(codeDocRef, {
            used: true,
            usedAt: FieldValue.serverTimestamp(),
            usedBySubmission: submissionRef.id,
          });
        }
      });
    } catch (transactionError: any) {
      console.error('Firestore transaction error:', transactionError);

      if (transactionError instanceof Error) {
        if (transactionError.message.startsWith('twitter_exists')) {
          const phase = transactionError.message.endsWith('phase2') ? '2' : '3';
          return NextResponse.json(
            { error: `This Twitter username has already been submitted for Phase ${phase}` },
            { status: 400 }
          );
        }

        if (transactionError.message.startsWith('wallet_exists')) {
          const phase = transactionError.message.endsWith('phase2') ? '2' : '3';
          return NextResponse.json(
            { error: `This wallet address has already been submitted for Phase ${phase}` },
            { status: 400 }
          );
        }

        if (transactionError.message === 'invalid_code') {
          return NextResponse.json(
            { error: 'Invalid Phase 2 access code' },
            { status: 400 }
          );
        }

        if (transactionError.message === 'code_used') {
          return NextResponse.json(
            { error: 'This Phase 2 access code has already been used' },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Unable to save submission' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Successfully submitted to whitelist',
        data: {
          twitter,
          wallet: wallet.slice(0, 6) + '...' + wallet.slice(-4),
          code: code ? 'provided' : 'none',
          submitted: true,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Whitelist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Whitelist API endpoint is active' },
    { status: 200 }
  );
}
