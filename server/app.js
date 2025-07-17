const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const path = require("path")
const connectDB = require("./config/database")
const fileRoutes = require("./routes/fileRoutes")
const { startCleanupJob } = require("./services/cleanupService")
require("dotenv").config({ path: path.join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3000

// Connect to MongoDB
connectDB()

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.cloudinary.com"],
      },
    },
  }),
)

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: "Upload limit exceeded. Please try again later.",
  },
})

app.use(limiter)
app.use("/api/upload", uploadLimiter)

// Body parsing middleware
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Serve static files
app.use(express.static(path.join(__dirname, "../client")))

// API routes
app.use("/api", fileRoutes)

// Serve frontend for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"))
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error)
  res.status(500).json({
    error: "Internal server error",
  })
})

// Start cleanup job
startCleanupJob()

app.listen(PORT, () => {
  console.log(`🚀 SafeDrop server running on port ${PORT}`)
  console.log(`📁 Frontend: http://localhost:${PORT}`)
  console.log(`🔗 API: http://localhost:${PORT}/api`)
})

module.exports = app
