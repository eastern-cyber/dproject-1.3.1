// src/app/api/plan-b/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Debug: Check if DATABASE_URL is available
console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function POST(request: NextRequest) {
  console.log('POST /api/plan-b called');
  
  try {
    const planBData = await request.json();
    console.log('Received data:', planBData);

    // Validate only the absolutely required field
    if (!planBData.user_id) {
      console.log('Missing user_id');
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }

    // Insert into plan_b table with default values for all NOT NULL fields
    const query = `
      INSERT INTO plan_b (
        user_id, 
        rate_thb_pol, 
        cumulative_pol, 
        append_pol,
        append_pol_tx_hash,
        append_pol_date_time,
        pr_pol,
        pr_pol_tx_hash,
        pr_pol_date_time,
        link_ipfs,
        remark,
        d1,
        d2,
        d3,
        d4,
        d5,
        d6,
        d7
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const currentTime = new Date().toISOString();
    
    const values = [
      planBData.user_id,
      planBData.rate_thb_pol || 0,
      planBData.cumulative_pol || 0,
      planBData.append_pol || 0,
      planBData.append_tx_hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      planBData.append_pol_date_time || currentTime,
      planBData.pr_pol || 0,
      planBData.pr_pol_tx_hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      planBData.pr_pol_date_time || currentTime,
      planBData.link_ipfs || '',
      planBData.remark || '{}',
      planBData.d1 || 1, // Set d1 to 1 as requested
      planBData.d2 || 0,
      planBData.d3 || 0,
      planBData.d4 || 0,
      planBData.d5 || 0,
      planBData.d6 || 0,
      planBData.d7 || 0
    ];

    console.log('Executing query with values:', values);

    const client = await pool.connect();
    try {
      const result = await client.query(query, values);
      console.log('Database insert successful:', result.rows[0]);
      return NextResponse.json(result.rows[0]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}