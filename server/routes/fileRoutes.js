const express = require("express")
const multer = require("multer")
const { uploadFile, getFileInfo, verifyPassword, downloadFile } = require("../controllers/fileController")

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types but check for malicious extensions
    const dangerousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com"]
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."))

    if (dangerousExtensions.includes(fileExtension)) {
      return cb(new Error("File type not allowed for security reasons"), false)
    }

    cb(null, true)
  },
})

// Routes
router.post("/upload", upload.single("file"), uploadFile)
router.get("/file/:fileId", getFileInfo)
router.post("/file/:fileId/verify", verifyPassword)
router.get("/file/:fileId/download", downloadFile)

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

module.exports = router
