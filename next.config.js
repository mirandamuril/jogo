/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disabled for PixiJS stability
    swcMinify: true,
    // Ensure we don't try to optimize packages that crash
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
}

module.exports = nextConfig
