// MongoDB initialization script
const db = db.getSiblingDB("safedrop")

// Create collections
db.createCollection("files")

// Create indexes for better performance
db.files.createIndex({ fileId: 1 }, { unique: true })
db.files.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.files.createIndex({ uploadedAt: 1 })
db.files.createIndex({ fileId: 1, expiresAt: 1 })

// Create a user for the application
db.createUser({
  user: "safedrop",
  pwd: "safedrop123",
  roles: [
    {
      role: "readWrite",
      db: "safedrop",
    },
  ],
})

print("SafeDrop database initialized successfully!")
