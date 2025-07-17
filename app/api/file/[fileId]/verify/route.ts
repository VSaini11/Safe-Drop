import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { File } from '@/lib/models/File'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await connectDB()
    
    const { fileId } = await params
    const { password } = await request.json()
    
    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const file = await File.findNonExpired(fileId)

    if (!file) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 })
    }

    if (!file.hasPassword) {
      return NextResponse.json({ error: "File is not password protected" }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, file.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: "Password verified" })
  } catch (error) {
    console.error('Password verification API error:', error)
    return NextResponse.json(
      { error: 'Password verification failed' },
      { status: 500 }
    )
  }
}
