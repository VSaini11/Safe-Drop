import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { File } from '@/lib/models/File'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await connectDB()
    
    const { fileId } = await params
    
    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    const file = await File.findNonExpired(fileId)

    if (!file) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 })
    }

    // Return file info without sensitive data
    return NextResponse.json({
      fileId: file.fileId,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      hasPassword: file.hasPassword,
      uploadedAt: file.uploadedAt,
      expiresAt: file.expiresAt,
      downloadCount: file.downloadCount,
    })
  } catch (error) {
    console.error('File info API error:', error)
    return NextResponse.json(
      { error: 'Failed to get file info' },
      { status: 500 }
    )
  }
}
