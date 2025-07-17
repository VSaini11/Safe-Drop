const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")
const File = require("../models/File")
const cloudinaryService = require("../services/cloudinaryService")
const { sanitizeInput } = require("../utils/sanitizer")

// Upload file
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const { password, expirySeconds } = req.body
    const file = req.file

    // Sanitize inputs
    const sanitizedPassword = password ? sanitizeInput(password) : null
    const expiry = Number.parseInt(expirySeconds) || 86400 // Default 24 hours

    // Validate expiry (max 30 days)
    if (expiry > 30 * 24 * 60 * 60) {
      return res.status(400).json({ error: "Maximum expiry is 30 days" })
    }

    // Generate unique file ID
    const fileId = uuidv4()

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinaryService.uploadFile(file.buffer, {
      public_id: `safedrop/${fileId}`,
      resource_type: "auto",
      folder: "safedrop",
    })

    // Hash password if provided
    let passwordHash = null
    let hasPassword = false

    if (sanitizedPassword && sanitizedPassword.length > 0) {
      passwordHash = await bcrypt.hash(sanitizedPassword, 12)
      hasPassword = true
    }

    // Calculate expiry date
    const expiresAt = new Date(Date.now() + expiry * 1000)

    // Save file metadata to database
    const fileDoc = new File({
      fileId,
      originalName: sanitizeInput(file.originalname),
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      size: file.size,
      mimeType: file.mimetype,
      passwordHash,
      hasPassword,
      expiresAt,
    })

    await fileDoc.save()

    res.status(201).json({
      success: true,
      fileId,
      message: "File uploaded successfully",
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Upload error:", error)

    // Clean up Cloudinary upload if database save fails
    if (error.cloudinaryPublicId) {
      try {
        await cloudinaryService.deleteFile(error.cloudinaryPublicId)
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
      }
    }

    res.status(500).json({
      error: "Upload failed. Please try again.",
    })
  }
}

// Get file information
const getFileInfo = async (req, res) => {
  try {
    const { fileId } = req.params

    if (!fileId || typeof fileId !== "string") {
      return res.status(400).json({ error: "Invalid file ID" })
    }

    const file = await File.findNonExpired(sanitizeInput(fileId))

    if (!file) {
      return res.status(404).json({ error: "File not found or expired" })
    }

    // Check if file is expired (double check)
    if (file.isExpired()) {
      return res.status(410).json({ error: "File has expired" })
    }

    res.json({
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
    console.error("Get file info error:", error)
    res.status(500).json({ error: "Unable to retrieve file information" })
  }
}

// Verify password
const verifyPassword = async (req, res) => {
  try {
    const { fileId } = req.params
    const { password } = req.body

    if (!fileId || !password) {
      return res.status(400).json({ error: "File ID and password are required" })
    }

    const file = await File.findNonExpired(sanitizeInput(fileId))

    if (!file) {
      return res.status(404).json({ error: "File not found or expired" })
    }

    if (!file.hasPassword) {
      return res.status(400).json({ error: "File is not password protected" })
    }

    const isValidPassword = await bcrypt.compare(sanitizeInput(password), file.passwordHash)

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid password" })
    }

    res.json({ success: true, message: "Password verified" })
  } catch (error) {
    console.error("Password verification error:", error)
    res.status(500).json({ error: "Password verification failed" })
  }
}

// Download file
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params
    const { password } = req.query

    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" })
    }

    const file = await File.findNonExpired(sanitizeInput(fileId))

    if (!file) {
      return res.status(404).json({ error: "File not found or expired" })
    }

    // Verify password if required
    if (file.hasPassword) {
      if (!password) {
        return res.status(401).json({ error: "Password required" })
      }

      const isValidPassword = await bcrypt.compare(sanitizeInput(password), file.passwordHash)
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid password" })
      }
    }

    // Record download
    await file.recordDownload()

    // Redirect to Cloudinary URL for download
    res.redirect(file.cloudinaryUrl)
  } catch (error) {
    console.error("Download error:", error)
    res.status(500).json({ error: "Download failed" })
  }
}

module.exports = {
  uploadFile,
  getFileInfo,
  verifyPassword,
  downloadFile,
}
