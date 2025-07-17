class SafeDropDownloader {
  constructor() {
    this.apiUrl = window.location.hostname === "localhost" ? "http://localhost:3000/api" : "https://safe-drop-blond.vercel.app/api"
    this.fileId = this.getFileIdFromUrl()
    this.initializeElements()
    this.bindEvents()
    this.loadFileInfo()
  }

  initializeElements() {
    this.loadingState = document.getElementById("loadingState")
    this.passwordForm = document.getElementById("passwordForm")
    this.passwordSubmit = document.getElementById("passwordSubmit")
    this.downloadPassword = document.getElementById("downloadPassword")
    this.passwordError = document.getElementById("passwordError")
    this.downloadReady = document.getElementById("downloadReady")
    this.downloadBtn = document.getElementById("downloadBtn")
    this.errorState = document.getElementById("errorState")
    this.fileName = document.getElementById("fileName")
    this.fileSize = document.getElementById("fileSize")
    this.uploadDate = document.getElementById("uploadDate")
    this.expiryDate = document.getElementById("expiryDate")
    this.errorTitle = document.getElementById("errorTitle")
    this.errorMessage = document.getElementById("errorMessage")
  }

  bindEvents() {
    this.passwordSubmit.addEventListener("submit", this.handlePasswordSubmit.bind(this))
    this.downloadBtn.addEventListener("click", this.handleDownload.bind(this))
  }

  getFileIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("id")
  }

  async loadFileInfo() {
    if (!this.fileId) {
      this.showError("Invalid Link", "The download link is invalid or malformed.")
      return
    }

    try {
      const response = await fetch(`${this.apiUrl}/file/${this.fileId}`)
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          this.showError("File Not Found", "This file may have expired or been removed.")
        } else if (response.status === 410) {
          this.showError("File Expired", "This file has expired and is no longer available.")
        } else {
          this.showError("Error", result.error || "Unable to load file information.")
        }
        return
      }

      this.fileInfo = result
      this.hideLoading()

      if (result.hasPassword) {
        this.showPasswordForm()
      } else {
        this.showDownloadReady()
      }
    } catch (error) {
      console.error("Error loading file info:", error)
      this.showError("Connection Error", "Unable to connect to the server. Please try again.")
    }
  }

  async handlePasswordSubmit(event) {
    event.preventDefault()

    const password = this.downloadPassword.value
    if (!password) {
      this.showPasswordError("Please enter a password")
      return
    }

    try {
      const response = await fetch(`${this.apiUrl}/file/${this.fileId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (!response.ok) {
        this.showPasswordError(result.error || "Invalid password")
        return
      }

      this.hidePasswordError()
      this.passwordForm.style.display = "none"
      this.showDownloadReady()
    } catch (error) {
      console.error("Password verification error:", error)
      this.showPasswordError("Unable to verify password. Please try again.")
    }
  }

  async handleDownload() {
    this.setDownloading(true)

    try {
      const password = this.downloadPassword.value
      const url = `${this.apiUrl}/file/${this.fileId}/download${password ? `?password=${encodeURIComponent(password)}` : ""}`

      const response = await fetch(url)

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Download failed")
      }

      // Get filename from response headers or use original filename
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = this.fileInfo.originalName

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Download error:", error)
      alert("Download failed: " + error.message)
    } finally {
      this.setDownloading(false)
    }
  }

  setDownloading(isDownloading) {
    this.downloadBtn.disabled = isDownloading
    const btnText = this.downloadBtn.querySelector(".btn-text")
    const btnLoader = this.downloadBtn.querySelector(".btn-loader")

    if (isDownloading) {
      btnText.style.display = "none"
      btnLoader.style.display = "inline"
    } else {
      btnText.style.display = "inline"
      btnLoader.style.display = "none"
    }
  }

  showPasswordForm() {
    this.passwordForm.style.display = "block"
    this.downloadPassword.focus()
  }

  showPasswordError(message) {
    this.passwordError.textContent = message
    this.passwordError.style.display = "block"
  }

  hidePasswordError() {
    this.passwordError.style.display = "none"
  }

  showDownloadReady() {
    this.fileName.textContent = this.fileInfo.originalName
    this.fileSize.textContent = this.formatFileSize(this.fileInfo.size)
    this.uploadDate.textContent = this.formatDate(this.fileInfo.uploadedAt)
    this.expiryDate.textContent = this.formatDate(this.fileInfo.expiresAt)
    this.downloadReady.style.display = "block"
  }

  showError(title, message) {
    this.hideLoading()
    this.errorTitle.textContent = title
    this.errorMessage.textContent = message
    this.errorState.style.display = "block"
  }

  hideLoading() {
    this.loadingState.style.display = "none"
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleString()
  }
}

// Initialize the downloader when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SafeDropDownloader()
})
