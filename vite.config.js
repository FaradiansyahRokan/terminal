import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss()
  ],
    server: {
    proxy: {
      '/api/yahoo-chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: false,
        // 🔥 PENYAMARAN: Tambahkan Header agar tidak diblokir Yahoo
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/'
        },
        rewrite: (path) => path.replace(/^\/api\/yahoo-chart/, '/v8/finance/chart'),
        // Debugging: Log agar kita tahu kalau proxy jalan di terminal
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/yahoo-search': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/'
        },
        rewrite: (path) => path.replace(/^\/api\/yahoo-search/, '/v1/finance/search'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/finnhub': {
        target: 'https://finnhub.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/finnhub/, '/api/v1')
      },
      '/api/binance': {
        target: 'https://data-api.binance.vision',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/binance/, '/api/v3')
      }
    }
  }
})
