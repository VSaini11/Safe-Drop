const validator = require("validator")

const sanitizeInput = (input) => {
  if (typeof input !== "string") {
    return input
  }

  // Remove any potential XSS attempts
  let sanitized = validator.escape(input)

  // Remove any potential SQL injection attempts
  sanitized = sanitized.replace(/['"\\;]/g, "")

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

const sanitizeFilename = (filename) => {
  if (typeof filename !== "string") {
    return "unknown"
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, "")

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, "_")

  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf("."))
    const name = sanitized.substring(0, 255 - extension.length)
    sanitized = name + extension
  }

  return sanitized || "unnamed_file"
}

const validateFileId = (fileId) => {
  if (typeof fileId !== "string") {
    return false
  }

  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(fileId)
}

module.exports = {
  sanitizeInput,
  sanitizeFilename,
  validateFileId,
}
