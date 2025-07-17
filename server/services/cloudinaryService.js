const cloudinary = require("cloudinary").v2

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

class CloudinaryService {
  async uploadFile(buffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: "auto",
        folder: "safedrop",
        use_filename: true,
        unique_filename: true,
        ...options,
      }

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error)
          reject(error)
        } else {
          resolve(result)
        }
      })

      uploadStream.end(buffer)
    })
  }

  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return result
    } catch (error) {
      console.error("Cloudinary delete error:", error)
      throw error
    }
  }

  async getFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId)
      return result
    } catch (error) {
      console.error("Cloudinary get info error:", error)
      throw error
    }
  }
}

module.exports = new CloudinaryService()
