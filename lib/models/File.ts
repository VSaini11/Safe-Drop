import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
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
    index: true,
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
})

// Static method to find non-expired files
fileSchema.statics.findNonExpired = function(fileId: string) {
  return this.findOne({
    fileId,
    expiresAt: { $gt: new Date() },
  })
}

// Instance method to record downloads
fileSchema.methods.recordDownload = function() {
  this.downloadCount += 1
  this.lastDownloadedAt = new Date()
  return this.save()
}

// Add interface for static methods
interface FileModel extends mongoose.Model<any> {
  findNonExpired(fileId: string): Promise<any>
}

export const File = (mongoose.models.File || mongoose.model('File', fileSchema)) as FileModel
