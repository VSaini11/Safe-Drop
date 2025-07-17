const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`)

    // Create TTL index for automatic cleanup
    const db = conn.connection.db
    await db.collection("files").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

    console.log("🕒 TTL index created for automatic file cleanup")
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

module.exports = connectDB
