// src/app/api/users/[userId]/route.ts (rename the folder from [users] to [userId])

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!sql) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const user = await sql`
      SELECT user_id, email, name, token_id, referrer_id, created_at
      FROM users 
      WHERE user_id = ${userId}
    `;

    if (user && user.length > 0) {
      return NextResponse.json(user[0]);
    } else {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}