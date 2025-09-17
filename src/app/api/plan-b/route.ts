// src/app/api/plan-b/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT * FROM plan_b WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
    `;
    
    if (result.length === 0) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching Plan B data:', error);
    return NextResponse.json({ error: 'Failed to fetch Plan B data' }, { status: 500 });
  }
}