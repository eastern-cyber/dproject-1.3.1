// src/app/api/users/route.ts

import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  console.log('API /api/users called');
  
  if (!sql) {
    console.error('Database not configured');
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const getAll = searchParams.get('getAll');
    
    console.log('Query params:', { user_id, getAll });
    
    if (user_id) {
      // Get specific user by query parameter
      console.log('Fetching specific user:', user_id);
      const users = await sql`
        SELECT 
          id,
          user_id,
          referrer_id,
          email,
          name,
          token_id,
          plan_a,
          plan_b,
          created_at,
          updated_at
        FROM users 
        WHERE user_id = ${user_id}
      `;
      
      console.log('User query result:', users);
      
      if (users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(users[0]);
    } else if (getAll === 'true') {
      // Get all users for the check-user page (with additional fields)
      console.log('Fetching all users for check-user page');
      const users = await sql`
        SELECT 
          user_id,
          referrer_id,
          email,
          name,
          token_id,
          plan_a,
          plan_b,
          created_at,
          updated_at
        FROM users 
        WHERE user_id IS NOT NULL 
        AND user_id != ''
        ORDER BY created_at DESC
      `;
      
      console.log(`Fetched ${users.length} users from database`);
      return NextResponse.json(users);
    } else {
      // Get all users for admin dashboard (with all fields including plan_a and plan_b)
      console.log('Fetching all users for admin dashboard');
      const users = await sql`
        SELECT 
          id,
          user_id,
          referrer_id,
          email,
          name,
          token_id,
          plan_a,
          plan_b,
          created_at,
          updated_at
        FROM users 
        ORDER BY created_at DESC
      `;
      
      console.log(`Fetched ${users.length} users from database`);
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}