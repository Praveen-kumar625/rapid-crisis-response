module.exports = {
    globDirectory: 'build/',
    globPatterns: [
        '**/*.{js,css,html,png,svg,jpg,json}',
        'static/js/*.js',
        'static/css/*.css'
    ],
    swDest: 'build/service-worker.js',
    // runtime caching – Mapbox tiles & API calls
    runtimeCaching: [{
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'mapbox-api',
                expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
            }
        },
        {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'app-shell',
                networkTimeoutSeconds: 3,
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 // 1 day
                }
            }
        }
    ]
};