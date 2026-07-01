// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/user/Documents/ERP_Software-master/ERP-Tool/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/user/Documents/ERP_Software-master/ERP-Tool/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const targetUrl = env.VITE_API_URL || "http://localhost:8000";
  return {
    plugins: [react()],
    server: {
      port: 3e3,
      proxy: {
        "/api/v1/ai": {
          target: "http://localhost:8000",
          changeOrigin: true
        },
        "/api": {
          target: targetUrl,
          changeOrigin: true
        }
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: true
    },
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: ["lucide-react", "framer-motion", "recharts"],
            query: ["@tanstack/react-query", "axios"],
            state: ["zustand"]
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxFUlBfU29mdHdhcmUtbWFzdGVyXFxcXEVSUC1Ub29sXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERvY3VtZW50c1xcXFxFUlBfU29mdHdhcmUtbWFzdGVyXFxcXEVSUC1Ub29sXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy91c2VyL0RvY3VtZW50cy9FUlBfU29mdHdhcmUtbWFzdGVyL0VSUC1Ub29sL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgY29uc3QgdGFyZ2V0VXJsID0gZW52LlZJVEVfQVBJX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwJztcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaS92MS9haSc6IHtcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwMDAnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiB0YXJnZXRVcmwsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHRlc3Q6IHtcbiAgICAgIGdsb2JhbHM6IHRydWUsXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbiAgICAgIHNldHVwRmlsZXM6ICcuL3NyYy9zZXR1cFRlc3RzLmpzJyxcbiAgICAgIGNzczogdHJ1ZSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICAgdWk6IFsnbHVjaWRlLXJlYWN0JywgJ2ZyYW1lci1tb3Rpb24nLCAncmVjaGFydHMnXSxcbiAgICAgICAgICAgIHF1ZXJ5OiBbJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScsICdheGlvcyddLFxuICAgICAgICAgICAgc3RhdGU6IFsnenVzdGFuZCddXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVYLFNBQVMsY0FBYyxlQUFlO0FBQzdaLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFDM0MsUUFBTSxZQUFZLElBQUksZ0JBQWdCO0FBRXRDLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxJQUNqQixRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsUUFDaEI7QUFBQSxRQUNBLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxhQUFhO0FBQUEsTUFDYixZQUFZO0FBQUEsTUFDWixLQUFLO0FBQUEsSUFDUDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osUUFBUSxDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxZQUNqRCxJQUFJLENBQUMsZ0JBQWdCLGlCQUFpQixVQUFVO0FBQUEsWUFDaEQsT0FBTyxDQUFDLHlCQUF5QixPQUFPO0FBQUEsWUFDeEMsT0FBTyxDQUFDLFNBQVM7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
