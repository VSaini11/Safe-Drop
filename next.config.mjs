/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com']
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'production'
                    ? 'https://safe-drop-server.up.railway.app/api/:path*'
                    : 'http://localhost:3001/api/:path*'
            }
        ]
    }
}

export default nextConfig
