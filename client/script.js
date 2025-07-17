class SafeDropUploader {
  constructor() {
    this.apiUrl = window.location.hostname === "localhost" ? "http://localhost:3000/api" : "/api"
    this.initializeElements()
    this.bindEvents()
  }

  initializeElements() {
    this.uploadForm = document.getElementById("uploadForm")
    this.fileInput = document.getElementById("fileInput")
    this.passwordInput = document.getElementById("password")
    this.expirySelect = document.getElementById("expiry")
    this.uploadBtn = document.getElementById("uploadBtn")
    this.uploadResult = document.getElementById("uploadResult")
    this.uploadError = document.getElementById("uploadError")
    this.shareLink = document.getElementById("shareLink")
    this.copyBtn = document.getElementById("copyBtn")
    this.expiryTime = document.getElementById("expiryTime")
    this.fileLabel = document.querySelector(".file-label .file-text")
  }

  bindEvents() {
    this.uploadForm.addEventListener("submit", this.handleUpload.bind(this))
    this.fileInput.addEventListener("change", this.handleFileSelect.bind(this))
    this.copyBtn.addEventListener("click", this.copyToClipboard.bind(this))
  }

  handleFileSelect(event) {
    const file = event.target.files[0]
    if (file) {
      this.fileLabel.textContent = `Selected: ${file.name}`
      this.hideMessages()
    }
  }

  async handleUpload(event) {
    event.preventDefault()

    const file = this.fileInput.files[0]
    if (!file) {
      this.showError("Please select a file to upload")
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      this.showError("File size must be less than 50MB")
      return
    }

    this.setUploading(true)
    this.hideMessages()

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("password", this.passwordInput.value)
      formData.append("expirySeconds", this.expirySelect.value)

      const response = await fetch(`${this.apiUrl}/upload`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      this.showSuccess(result)
    } catch (error) {
      console.error("Upload error:", error)
      this.showError(error.message || "Upload failed. Please try again.")
    } finally {
      this.setUploading(false)
    }
  }

  setUploading(isUploading) {
    this.uploadBtn.disabled = isUploading
    const btnText = this.uploadBtn.querySelector(".btn-text")
    const btnLoader = this.uploadBtn.querySelector(".btn-loader")

    if (isUploading) {
      btnText.style.display = "none"
      btnLoader.style.display = "inline"
    } else {
      btnText.style.display = "inline"
      btnLoader.style.display = "none"
    }
  }

  showSuccess(result) {
    const downloadUrl = `${window.location.origin}/download.html?id=${result.fileId}`
    this.shareLink.value = downloadUrl
    this.expiryTime.textContent = this.formatExpiry(Number.parseInt(this.expirySelect.value))
    this.uploadResult.style.display = "block"

    // Reset form
    this.uploadForm.reset()
    this.fileLabel.textContent = "Choose file to upload"
  }

  showError(message) {
    this.uploadError.textContent = message
    this.uploadError.style.display = "block"
  }

  hideMessages() {
    this.uploadResult.style.display = "none"
    this.uploadError.style.display = "none"
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.shareLink.value)
      const originalText = this.copyBtn.textContent
      this.copyBtn.textContent = "Copied!"
      this.copyBtn.style.background = "#10b981"

      setTimeout(() => {
        this.copyBtn.textContent = originalText
        this.copyBtn.style.background = "#0ea5e9"
      }, 2000)
    } catch (error) {
      // Fallback for older browsers
      this.shareLink.select()
      document.execCommand("copy")
      this.copyBtn.textContent = "Copied!"
    }
  }

  formatExpiry(seconds) {
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes`
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)} hours`
    } else if (seconds < 604800) {
      return `${Math.floor(seconds / 86400)} days`
    } else {
      return `${Math.floor(seconds / 604800)} weeks`
    }
  }
}

// Initialize the uploader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SafeDropUploader()
})
