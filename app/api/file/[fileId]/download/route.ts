import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/database'
import { File } from '@/lib/models/File'
import { SupabaseService } from '@/lib/services/supabaseService'
import bcrypt from 'bcryptjs'

const supabaseService = new SupabaseService()

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    await connectDB()
    
    const { fileId } = await params
    const { searchParams } = new URL(request.url)
    const password = searchParams.get('password')
    
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const file = await File.findNonExpired(fileId)

    if (!file) {
      return NextResponse.json({ error: "File not found or expired" }, { status: 404 })
    }

    // Verify password if required
    if (file.hasPassword) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 })
      }

      const isValidPassword = await bcrypt.compare(password, file.passwordHash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
      }
    }

    // Record download
    try {
      await file.recordDownload()
    } catch (downloadRecordError) {
      console.error('Failed to record download:', downloadRecordError)
      // Continue with download even if recording fails
    }

    // Download file from S3
    try {
      console.log('File details:', {
        fileId: file.fileId,
        cloudinaryUrl: file.cloudinaryUrl,
        cloudinaryPublicId: file.cloudinaryPublicId,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType
      })
      
      // Download file from Supabase Storage
      console.log('Downloading file from Supabase with path:', file.cloudinaryPublicId)
      
      const fileBuffer = await supabaseService.downloadFile(file.cloudinaryPublicId)
      console.log('Successfully downloaded file from Supabase, size:', fileBuffer.length)
      
      if (fileBuffer.length === 0) {
        return NextResponse.json(
          { error: 'File is empty or corrupted' },
          { status: 502 }
        )
      }
      
      // Set appropriate headers for file download
      const headers = new Headers()
      headers.set('Content-Type', file.mimeType || 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="${file.originalName}"`)
      headers.set('Content-Length', fileBuffer.length.toString())
      headers.set('Cache-Control', 'no-cache')
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })
    } catch (error) {
      console.error('Error downloading file from Supabase:', error)
      return NextResponse.json(
        { error: `Failed to retrieve file from storage: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during download' },
      { status: 500 }
    )
  }
}
