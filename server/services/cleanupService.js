const cron = require("node-cron")
const File = require("../models/File")
const cloudinaryService = require("./cloudinaryService")

class CleanupService {
  constructor() {
    this.isRunning = false
  }

  async cleanupExpiredFiles() {
    if (this.isRunning) {
      console.log("🧹 Cleanup already running, skipping...")
      return
    }

    this.isRunning = true
    console.log("🧹 Starting cleanup of expired files...")

    try {
      // Find expired files
      const expiredFiles = await File.find({
        expiresAt: { $lt: new Date() },
      })

      if (expiredFiles.length === 0) {
        console.log("✅ No expired files to clean up")
        return
      }

      console.log(`🗑️ Found ${expiredFiles.length} expired files to clean up`)

      let deletedCount = 0
      let errorCount = 0

      // Delete files from Cloudinary and database
      for (const file of expiredFiles) {
        try {
          // Delete from Cloudinary
          await cloudinaryService.deleteFile(file.cloudinaryPublicId)

          // Delete from database
          await File.findByIdAndDelete(file._id)

          deletedCount++
          console.log(`✅ Deleted: ${file.originalName} (${file.fileId})`)
        } catch (error) {
          errorCount++
          console.error(`❌ Failed to delete ${file.originalName}:`, error.message)

          // If Cloudinary deletion fails but file is expired, still remove from DB
          if (error.http_code === 404) {
            try {
              await File.findByIdAndDelete(file._id)
              console.log(`🗑️ Removed orphaned DB record: ${file.fileId}`)
            } catch (dbError) {
              console.error(`❌ Failed to remove DB record:`, dbError.message)
            }
          }
        }
      }

      console.log(`🧹 Cleanup completed: ${deletedCount} deleted, ${errorCount} errors`)
    } catch (error) {
      console.error("❌ Cleanup service error:", error)
    } finally {
      this.isRunning = false
    }
  }

  startCleanupJob() {
    // Run cleanup every hour
    cron.schedule("0 * * * *", () => {
      this.cleanupExpiredFiles()
    })

    // Run cleanup every 6 hours for thorough cleaning
    cron.schedule("0 */6 * * *", () => {
      this.cleanupExpiredFiles()
    })

    console.log("🕒 Cleanup job scheduled (every hour)")

    // Run initial cleanup after 1 minute
    setTimeout(() => {
      this.cleanupExpiredFiles()
    }, 60000)
  }
}

const cleanupService = new CleanupService()

module.exports = {
  startCleanupJob: () => cleanupService.startCleanupJob(),
  cleanupExpiredFiles: () => cleanupService.cleanupExpiredFiles(),
}
