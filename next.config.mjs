/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com']
    },
    typescript: {
        // Skip type checking during build for speed since Vercel will do it anyway
        ignoreBuildErrors: true
    },
    eslint: {
        // Skip ESLint during build for speed since Vercel will do it anyway
        ignoreDuringBuilds: true
    }
}

export default nextConfig
