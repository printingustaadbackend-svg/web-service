// vite.config.js
import { defineConfig } from "file:///C:/Users/sujal/OneDrive/Desktop/printing-ustaad/web-service/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/sujal/OneDrive/Desktop/printing-ustaad/web-service/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  // Dev: proxy /api/* → Express backend (so relative URLs work in both dev & prod)
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true
      }
    }
  },
  // Production build optimizations
  build: {
    sourcemap: false,
    // disable sourcemaps in production
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split large vendor libs into separate chunks for better caching
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "supabase": ["@supabase/supabase-js"],
          "fabric-vendor": ["fabric"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxzdWphbFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHByaW50aW5nLXVzdGFhZFxcXFx3ZWItc2VydmljZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcc3VqYWxcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxwcmludGluZy11c3RhYWRcXFxcd2ViLXNlcnZpY2VcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3N1amFsL09uZURyaXZlL0Rlc2t0b3AvcHJpbnRpbmctdXN0YWFkL3dlYi1zZXJ2aWNlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcblxyXG4gIC8vIERldjogcHJveHkgL2FwaS8qIFx1MjE5MiBFeHByZXNzIGJhY2tlbmQgKHNvIHJlbGF0aXZlIFVSTHMgd29yayBpbiBib3RoIGRldiAmIHByb2QpXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIC8vIFByb2R1Y3Rpb24gYnVpbGQgb3B0aW1pemF0aW9uc1xyXG4gIGJ1aWxkOiB7XHJcbiAgICBzb3VyY2VtYXA6IGZhbHNlLCAgICAgICAgLy8gZGlzYWJsZSBzb3VyY2VtYXBzIGluIHByb2R1Y3Rpb25cclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAvLyBTcGxpdCBsYXJnZSB2ZW5kb3IgbGlicyBpbnRvIHNlcGFyYXRlIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAnc3VwYWJhc2UnOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxyXG4gICAgICAgICAgJ2ZhYnJpYy12ZW5kb3InOiBbJ2ZhYnJpYyddLFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpWCxTQUFTLG9CQUFvQjtBQUM5WSxPQUFPLFdBQVc7QUFFbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBO0FBQUEsRUFHakIsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBR0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBO0FBQUEsSUFDWCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGNBQWM7QUFBQSxVQUNaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxZQUFZLENBQUMsdUJBQXVCO0FBQUEsVUFDcEMsaUJBQWlCLENBQUMsUUFBUTtBQUFBLFFBQzVCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
