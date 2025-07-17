import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { connectDB } from '@/lib/database'
import { File } from '@/lib/models/File'
import { SupabaseService } from '@/lib/services/supabaseService'
import bcrypt from 'bcryptjs'

const supabaseService = new SupabaseService()

// Upload endpoint
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const password = formData.get('password') as string
    const expirySeconds = parseInt(formData.get('expirySeconds') as string) || 86400
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      )
    }

    // Generate unique file ID and filename
    const fileId = uuidv4()
    const fileExtension = path.extname(file.name)
    const fileName = `safedrop/${fileId}${fileExtension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const uploadResult = await supabaseService.uploadFile(buffer, fileName, file.type)

    console.log('Supabase upload result:', {
      path: uploadResult.path,
      url: uploadResult.url,
      size: buffer.length
    })

    // Hash password if provided
    let passwordHash = null
    let hasPassword = false

    if (password && password.length > 0) {
      passwordHash = await bcrypt.hash(password, 12)
      hasPassword = true
    }

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + expirySeconds * 1000)

    // Save file metadata to database
    const fileDoc = new File({
      fileId,
      originalName: file.name,
      cloudinaryUrl: uploadResult.url, // Supabase URL
      cloudinaryPublicId: uploadResult.fileName, // Supabase file path
      size: file.size,
      mimeType: file.type,
      passwordHash,
      hasPassword,
      expiresAt,
    })

    await fileDoc.save()

    return NextResponse.json({
      success: true,
      fileId,
      message: "File uploaded successfully",
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}
