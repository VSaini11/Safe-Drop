import { v2 as cloudinary } from 'cloudinary'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export class FileStorageService {
  private uploadsDir = path.join(process.cwd(), 'uploads')

  constructor() {
    this.ensureUploadsDir()
  }

  private async ensureUploadsDir() {
    if (!existsSync(this.uploadsDir)) {
      await mkdir(this.uploadsDir, { recursive: true })
    }
  }

  // Local storage methods
  async uploadFileLocal(buffer: Buffer, filename: string) {
    try {
      await this.ensureUploadsDir()
      const filePath = path.join(this.uploadsDir, filename)
      await writeFile(filePath, buffer)
      
      return {
        success: true,
        filePath,
        url: `/api/files/${filename}`,
        public_id: filename
      }
    } catch (error) {
      console.error('Local upload error:', error)
      throw error
    }
  }

  async downloadFileLocal(filename: string) {
    try {
      const filePath = path.join(this.uploadsDir, filename)
      const buffer = await readFile(filePath)
      return buffer
    } catch (error) {
      console.error('Local download error:', error)
      throw error
    }
  }

  async deleteFileLocal(filename: string) {
    try {
      const filePath = path.join(this.uploadsDir, filename)
      await unlink(filePath)
      return { success: true }
    } catch (error) {
      console.error('Local delete error:', error)
      throw error
    }
  }

  // Cloudinary methods (with fallback)
  async uploadFile(buffer: Buffer, options: any = {}) {
    return new Promise((resolve, reject) => {
      // Try unsigned upload first (bypasses many ACL issues)
      const uploadOptions = {
        resource_type: "auto",
        upload_preset: "ml_default", // Use the default unsigned preset
        ...options,
      }

      const uploadStream = cloudinary.uploader.unsigned_upload_stream(
        "ml_default", // Default unsigned preset
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary unsigned upload error:", error)
            // Fallback to signed upload
            this.uploadFileSigned(buffer, options).then(resolve).catch(reject)
          } else {
            resolve(result)
          }
        }
      )

      uploadStream.end(buffer)
    })
  }

  async uploadFileSigned(buffer: Buffer, options: any = {}) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: "auto",
        ...options,
      }

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Cloudinary signed upload error:", error)
          reject(error)
        } else {
          resolve(result)
        }
      })

      uploadStream.end(buffer)
    })
  }

  async deleteFile(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return result
    } catch (error) {
      console.error("Cloudinary delete error:", error)
      throw error
    }
  }

  async getFileInfo(publicId: string) {
    try {
      const result = await cloudinary.api.resource(publicId)
      return result
    } catch (error) {
      console.error("Cloudinary get file info error:", error)
      throw error
    }
  }

  getPublicUrl(publicId: string, options: any = {}) {
    return cloudinary.url(publicId, {
      resource_type: 'auto',
      type: 'upload',
      secure: true,
      ...options
    })
  }

  getSignedDownloadUrl(publicId: string, options: any = {}) {
    // For public files, we can just use the regular URL
    return cloudinary.url(publicId, {
      resource_type: 'auto',
      type: 'upload',
      secure: true,
      ...options
    })
  }

  async downloadPrivateFile(publicId: string) {
    try {
      // For public files, just use the regular URL
      const downloadUrl = cloudinary.url(publicId, {
        resource_type: 'auto',
        type: 'upload',
        secure: true
      })
      
      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const buffer = await response.arrayBuffer()
      return Buffer.from(buffer)
    } catch (error) {
      console.error("Cloudinary private download error:", error)
      throw error
    }
  }
}
