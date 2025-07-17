"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function DownloadContent() {
  const searchParams = useSearchParams()
  const fileId = searchParams.get('id')
  
  const [fileInfo, setFileInfo] = useState<any>(null)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (fileId) {
      loadFileInfo()
    } else {
      setError("Invalid download link")
      setLoading(false)
    }
  }, [fileId])

  const loadFileInfo = async () => {
    try {
      const response = await fetch(`/api/file/${fileId}`)
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError("File not found or expired")
        } else {
          setError(result.error || "Unable to load file information")
        }
        setLoading(false)
        return
      }

      setFileInfo(result)
      setLoading(false)

      if (result.hasPassword) {
        setShowPasswordForm(true)
      }
    } catch (error) {
      setError("Connection error. Please try again.")
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError("Please enter a password")
      return
    }

    try {
      const response = await fetch(`/api/file/${fileId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Invalid password")
        return
      }

      setError("")
      setShowPasswordForm(false)
    } catch (error) {
      setError("Unable to verify password. Please try again.")
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError("")
    
    try {
      const url = `/api/file/${fileId}/download${password ? `?password=${encodeURIComponent(password)}` : ""}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        // Try to parse error message
        const contentType = response.headers.get('Content-Type')
        let errorMessage = "Download failed"
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json()
            errorMessage = result.error || errorMessage
          } catch (parseError) {
            // If JSON parsing fails, use default error message
            console.error('Error parsing JSON response:', parseError)
          }
        }
        
        throw new Error(errorMessage)
      }

      // Create blob and trigger download
      const blob = await response.blob()
      
      // Check if blob is empty
      if (blob.size === 0) {
        throw new Error("File is empty or could not be downloaded")
      }
      
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = fileInfo.originalName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(downloadUrl)
      
      // Show success message
      setError("")
    } catch (error: any) {
      console.error('Download error:', error)
      setError(error.message || "Download failed")
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading file information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Upload New File
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔒 SafeDrop
          </h1>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Upload new file
          </Link>
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {showPasswordForm ? (
              <div className="text-center">
                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Password Required
                </h2>
                <p className="text-gray-600 mb-6">This file is password protected</p>
                
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                  >
                    Access File
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  {fileInfo.originalName}
                </h2>
                <p className="text-gray-600 mb-4">
                  {formatFileSize(fileInfo.size)} • 
                  Uploaded {formatDate(fileInfo.uploadedAt)}
                </p>
                <p className="text-amber-600 font-medium mb-6">
                  ⏰ Expires: {formatDate(fileInfo.expiresAt)}
                </p>
                
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transform hover:-translate-y-1 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {downloading ? "Preparing Download..." : "📥 Download File"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <DownloadContent />
    </Suspense>
  )
}
