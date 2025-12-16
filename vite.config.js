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
      // 1. BINANCE (JANGAN PAKAI HEADER NEKO-NEKO)
      '/api/binance': {
        target: 'https://data-api.binance.vision', // Server public binance yang lebih ramah
        changeOrigin: true,
        secure: false, // Bypass SSL Error
        rewrite: (path) => path.replace(/^\/api\/binance/, '/api/v3'),
        // Debugging: Cek kalau error
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy Error (Binance):', err);
          });
        }
      },

      // 2. FINNHUB (POLOS SAJA)
      '/api/finnhub': {
        target: 'https://finnhub.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/finnhub/, '/api/v1')
      },

      // 3. YAHOO CHART (WAJIB PAKAI HEADER PENYAMARAN)
      '/api/yahoo-chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/yahoo-chart/, '/v8/finance/chart'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },

      // 4. YAHOO SEARCH (WAJIB PAKAI HEADER PENYAMARAN)
      '/api/yahoo-search': {
        target: 'https://query2.finance.yahoo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/yahoo-search/, '/v1/finance/search'),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    }
  }
})
