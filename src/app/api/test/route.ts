import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("=== TEST API GET 被调用 ===")
  return NextResponse.json({ message: "Test API is working!" })
}

export async function POST(request: NextRequest) {
  console.log("=== TEST API POST 被调用 ===")
  return NextResponse.json({ message: "Test API POST is working!" })
}