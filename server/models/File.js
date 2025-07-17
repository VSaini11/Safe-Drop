const mongoose = require("mongoose")

const fileSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
fileSchema.index({ fileId: 1, expiresAt: 1 })

// Pre-save middleware to ensure expiry date is set
fileSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    // Default to 24 hours if not set
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
  next()
})

// Instance method to check if file is expired
fileSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt
}

// Instance method to increment download count
fileSchema.methods.recordDownload = async function () {
  this.downloadCount += 1
  this.lastDownloadedAt = new Date()
  return await this.save()
}

// Static method to find non-expired files
fileSchema.statics.findNonExpired = function (fileId) {
  return this.findOne({
    fileId: fileId,
    expiresAt: { $gt: new Date() },
  })
}

// Static method to cleanup expired files
fileSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  })
}

module.exports = mongoose.model("File", fileSchema)
