import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to check Cloudinary connectivity
export async function GET(request: NextRequest) {
  try {
    // Test a simple fetch to a known public Cloudinary URL
    const testUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/sample.jpg`
    
    console.log('Testing Cloudinary connectivity with URL:', testUrl)
    
    const response = await fetch(testUrl)
    
    console.log('Test response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Cloudinary connectivity is working",
        testUrl,
        status: response.status
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Cloudinary connectivity failed",
        testUrl,
        status: response.status,
        statusText: response.statusText
      })
    }
  } catch (error) {
    console.error('Cloudinary test error:', error)
    return NextResponse.json({
      success: false,
      message: "Test failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
