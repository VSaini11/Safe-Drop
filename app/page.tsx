"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Copy, Download, FileText, Lock, Timer, Upload } from "lucide-react"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [expiry, setExpiry] = useState("86400")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError("")
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError("Please select a file to upload")
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB")
      return
    }

    setUploading(true)
    setError("")
    setUploadResult(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20
        })
      }, 200)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("password", password)
      formData.append("expirySeconds", expiry)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      // Show success animation
      setTimeout(() => {
        setUploadResult(result)
        setSelectedFile(null)
        setPassword("")
        setUploadProgress(0)
        // Reset file input
        const fileInput = document.getElementById("fileInput") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      }, 500)
      
    } catch (error: any) {
      setUploadProgress(0)
      setError(error.message || "Upload failed. Please try again.")
    } finally {
      setTimeout(() => setUploading(false), 500)
    }
  }

  const copyToClipboard = async () => {
    if (uploadResult?.fileId) {
      const baseUrl = window.location.hostname === "localhost" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL
      const downloadUrl = `${baseUrl}/download?id=${uploadResult.fileId}`
      try {
        await navigator.clipboard.writeText(downloadUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Could not copy to clipboard", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-white">SafeDrop</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Upload */}
      <div className="bg-slate-900 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left side - Content */}
            <div className="flex flex-col space-y-8 lg:space-y-10">
              {/* Upload Form - Always show first on mobile */}
              <div className="order-first lg:order-2 mt-6 lg:mt-8">
                {/* Upload Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-4 lg:p-6 w-full border border-slate-700"
                >
                  <h2 className="text-lg font-bold text-white mb-4 text-center">Upload Your File</h2>
                  
                  <form onSubmit={handleUpload} className="space-y-4">
                    {/* File selector */}
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="relative group"
                    >
                      <div className="border-2 border-dashed border-slate-600 rounded-xl p-4 text-center bg-slate-800/50 hover:border-blue-400 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                        <motion.div 
                          animate={{ 
                            scale: selectedFile ? [1, 1.05, 1] : 1 
                          }}
                          transition={{ duration: 0.4 }}
                          className="text-3xl mb-3"
                        >
                          {selectedFile ? <FileText className="h-10 w-10 mx-auto text-blue-400" /> : <Upload className="h-10 w-10 mx-auto text-slate-400" />}
                        </motion.div>
                        
                        <p className="text-slate-300 mb-3 text-sm">
                          {selectedFile ? (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="font-medium text-blue-400 flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {selectedFile.name}
                            </motion.span>
                          ) : (
                            "Drag and drop or click to select"
                          )}
                        </p>
                        
                        <input
                          type="file"
                          className="hidden"
                          id="fileInput"
                          onChange={handleFileSelect}
                        />
                        <label
                          htmlFor="fileInput"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-all duration-200 font-medium text-sm"
                        >
                          <Upload className="h-4 w-4" />
                          {selectedFile ? "Change" : "Select File"}
                        </label>
                      </div>
                    </motion.div>

                    {/* Upload Progress */}
                    <AnimatePresence>
                      {uploading && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Upload className="h-4 w-4 text-blue-500" />
                            </motion.div>
                            <span className="text-slate-700 font-medium text-sm">Uploading...</span>
                          </div>
                          
                          <div className="relative w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-full bg-blue-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          
                          <div className="text-right text-slate-600 mt-1 text-xs font-mono">
                            {Math.round(uploadProgress)}%
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <label className="block text-slate-300 font-medium mb-2 text-sm">
                          Password (Optional)
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                          placeholder="Enter password"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <label className="block text-slate-300 font-medium mb-2 text-sm">
                          Expires in
                        </label>
                        <select
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        >
                          <option value="3600">1 hour</option>
                          <option value="86400">1 day</option>
                          <option value="604800">1 week</option>
                          <option value="2592000">1 month</option>
                        </select>
                      </motion.div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs">{error}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Success Message */}
                    <AnimatePresence>
                      {uploadResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6 }}
                          className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2, type: "spring" }}
                            >
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            </motion.div>
                            <h3 className="text-sm font-semibold text-slate-900">Upload Successful</h3>
                          </div>
                          
                          <p className="text-emerald-700 mb-3 text-xs">
                            Your file is ready to share!
                          </p>
                          
                          <div className="bg-white rounded-lg p-2 mb-3 border border-emerald-200">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={`${window.location.origin}/download?id=${uploadResult.fileId}`}
                                readOnly
                                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-mono"
                              />
                              <motion.button
                                type="button"
                                onClick={copyToClipboard}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`px-3 py-1 rounded font-medium text-xs transition-all duration-200 ${
                                  copied 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-slate-900 hover:bg-slate-800 text-white"
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                  {copied ? "✓" : "Copy"}
                                </div>
                              </motion.button>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <p className="text-blue-700 text-xs text-center">
                              Share this link with your recipients
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={!selectedFile || uploading}
                      whileHover={{ scale: uploading ? 1 : 1.02 }}
                      whileTap={{ scale: uploading ? 1 : 0.98 }}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Upload className="h-4 w-4" />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload File
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </div>

              {/* Illustration - hidden on mobile, visible on lg screens */}
              <div className="order-last lg:order-1">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative hidden lg:block"
                >
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-2xl p-6 h-48 flex items-center justify-center relative overflow-hidden backdrop-blur-sm border border-slate-700">
                    {/* Decorative elements */}
                    <div className="absolute top-6 right-6 w-4 h-4 bg-blue-400 rounded-full opacity-60"></div>
                    <div className="absolute bottom-6 left-6 w-3 h-3 bg-indigo-400 rounded-full opacity-60"></div>
                    <div className="absolute top-12 left-8 w-2 h-2 bg-cyan-400 rounded-full opacity-40"></div>
                    
                    {/* File sharing illustration */}
                    <div className="relative flex flex-col items-center">
                      {/* Cloud */}
                      <div className="relative mb-6">
                        <div className="w-20 h-12 bg-blue-500 rounded-full relative">
                          <div className="absolute -left-4 top-2 w-8 h-8 bg-blue-500 rounded-full"></div>
                          <div className="absolute -right-4 top-2 w-8 h-8 bg-blue-500 rounded-full"></div>
                          <div className="absolute -top-2 left-6 w-8 h-8 bg-blue-500 rounded-full"></div>
                        </div>
                        {/* Upload arrow */}
                        <motion.div 
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
                        >
                          <div className="w-1 h-6 bg-blue-600"></div>
                          <div className="w-3 h-3 bg-blue-600 transform rotate-45 -mt-1 ml-[-1px]"></div>
                        </motion.div>
                      </div>
                      
                      {/* Files */}
                      <div className="flex gap-3 mb-4">
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                          className="w-12 h-16 bg-slate-700 rounded-lg shadow-lg relative"
                        >
                          <div className="w-2 h-2 bg-white rounded-full absolute top-2 left-2"></div>
                          <div className="w-6 h-1 bg-white/60 absolute top-5 left-2 rounded"></div>
                          <div className="w-4 h-1 bg-white/40 absolute top-7 left-2 rounded"></div>
                        </motion.div>
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          className="w-12 h-16 bg-emerald-600 rounded-lg shadow-lg relative"
                        >
                          <div className="w-2 h-2 bg-white rounded-full absolute top-2 left-2"></div>
                          <div className="w-6 h-1 bg-white/60 absolute top-5 left-2 rounded"></div>
                          <div className="w-4 h-1 bg-white/40 absolute top-7 left-2 rounded"></div>
                        </motion.div>
                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                          className="w-12 h-16 bg-orange-500 rounded-lg shadow-lg relative"
                        >
                          <div className="w-2 h-2 bg-white rounded-full absolute top-2 left-2"></div>
                          <div className="w-6 h-1 bg-white/60 absolute top-5 left-2 rounded"></div>
                          <div className="w-4 h-1 bg-white/40 absolute top-7 left-2 rounded"></div>
                        </motion.div>
                      </div>
                      
                      {/* Security shield */}
                      <motion.div 
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-8 h-10 bg-yellow-500 relative"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)' }}
                      >
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side - Content and Features */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-12 lg:px-6 overflow-y-auto max-h-[calc(100vh-8rem)] scroll-smooth pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Hero Content */}
              <div className="space-y-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Share Files with Complete Security
                </h1>
                
                <div className="space-y-3">
                  <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                    Secure file sharing made simple. Upload, protect with passwords, 
                    and set automatic deletion timers.
                  </p>
                  
                  <p className="text-sm text-slate-400 max-w-xl">
                    Perfect for sensitive documents and large files up to 1GB.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-base">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-base">Automatic file expiration</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-base">Password protection</span>
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Key Features</h2>
                  <p className="text-slate-300">
                    Our platform offers a range of features to ensure your files are secure and easily managed.
                  </p>
                </div>

                <div className="grid gap-6">
                  {[
                    {
                      icon: Lock,
                      title: "Password Protection",
                      description: "Add an extra layer of security by requiring a password to access your files"
                    },
                    {
                      icon: Timer,
                      title: "File Expiry",
                      description: "Set a time limit for your files to be automatically deleted after a certain period"
                    },
                    {
                      icon: Download,
                      title: "Secure Download Links",
                      description: "Generate unique, secure links for easy and safe file sharing"
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="bg-blue-500/10 rounded-lg p-3">
                          <feature.icon className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                          <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="space-y-8 pb-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">How It Works</h2>
                  <p className="text-slate-300">
                    Get started in just a few simple steps
                  </p>
                </div>

                <div className="grid gap-6">
                  {[
                    {
                      step: "1",
                      title: "Upload Your File",
                      description: "Drag and drop your file or select it from your computer"
                    },
                    {
                      step: "2",
                      title: "Configure Security",
                      description: "Set a password and expiry time for your file"
                    },
                    {
                      step: "3",
                      title: "Download and Enjoy",
                      description: "Share the secure link and download within the expiry time"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{item.step}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                        <p className="text-slate-300 text-sm">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}