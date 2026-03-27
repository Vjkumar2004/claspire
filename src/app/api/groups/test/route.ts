import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('Test API route is working!')
  return NextResponse.json({ message: 'Test API is working!' })
}
