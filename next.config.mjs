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
                destination: '/api/:path*'
            }
        ]
    }
}

export default nextConfig
