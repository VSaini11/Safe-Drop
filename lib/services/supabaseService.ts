import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export class SupabaseService {
  private bucketName = 'safedrop'

  async uploadFile(buffer: Buffer, fileName: string, contentType: string) {
    try {
      // Direct upload to Supabase Storage
      console.log(`Attempting to upload to bucket: ${this.bucketName}`)
      console.log(`File: ${fileName}, Size: ${buffer.length} bytes`)
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, buffer, {
          contentType,
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl,
        fileName,
      }
    } catch (error) {
      console.error('Supabase upload error:', error)
      throw error
    }
  }

  async downloadFile(fileName: string) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileName)

      if (error) {
        console.error('Supabase download error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No file data returned from Supabase')
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('Supabase download error:', error)
      throw error
    }
  }

  async deleteFile(fileName: string) {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName])

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Supabase delete error:', error)
      throw error
    }
  }

  async getSignedDownloadUrl(fileName: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(fileName, expiresIn)

      if (error) {
        console.error('Supabase signed URL error:', error)
        throw error
      }

      return data.signedUrl
    } catch (error) {
      console.error('Supabase signed URL error:', error)
      throw error
    }
  }

  getPublicUrl(fileName: string) {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName)
    
    return data.publicUrl
  }
}
