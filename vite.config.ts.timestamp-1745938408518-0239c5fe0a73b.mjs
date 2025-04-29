// vite.config.ts
import { defineConfig } from "file:///C:/Meus%20Apps/radiomanager/radiomanager%202/radiomanager/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Meus%20Apps/radiomanager/radiomanager%202/radiomanager/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Meus%20Apps/radiomanager/radiomanager%202/radiomanager/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Meus Apps\\radiomanager\\radiomanager 2\\radiomanager";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react({
      // Otimização para o desenvolvimento
      devTarget: "es2022",
      // Melhorar a performance do SWC
      tsDecorators: false,
      plugins: []
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Otimizações de build
  build: {
    target: "es2015",
    sourcemap: mode !== "production",
    // Dividir chunks para melhorar o carregamento
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@supabase/supabase-js"
          ],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
            "sonner"
          ]
        }
      }
    }
  },
  // Otimizações para desenvolvimento
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js"
    ],
    esbuildOptions: {
      target: "es2020"
    }
  },
  // Reduzir o tamanho dos logs
  logLevel: mode === "production" ? "info" : "info"
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxNZXVzIEFwcHNcXFxccmFkaW9tYW5hZ2VyXFxcXHJhZGlvbWFuYWdlciAyXFxcXHJhZGlvbWFuYWdlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcTWV1cyBBcHBzXFxcXHJhZGlvbWFuYWdlclxcXFxyYWRpb21hbmFnZXIgMlxcXFxyYWRpb21hbmFnZXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L01ldXMlMjBBcHBzL3JhZGlvbWFuYWdlci9yYWRpb21hbmFnZXIlMjAyL3JhZGlvbWFuYWdlci92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCh7XHJcbiAgICAgIC8vIE90aW1pemFcdTAwRTdcdTAwRTNvIHBhcmEgbyBkZXNlbnZvbHZpbWVudG9cclxuICAgICAgZGV2VGFyZ2V0OiAnZXMyMDIyJyxcclxuICAgICAgLy8gTWVsaG9yYXIgYSBwZXJmb3JtYW5jZSBkbyBTV0NcclxuICAgICAgdHNEZWNvcmF0b3JzOiBmYWxzZSxcclxuICAgICAgcGx1Z2luczogW11cclxuICAgIH0pLFxyXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxyXG4gICAgY29tcG9uZW50VGFnZ2VyKCksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIGRlIGJ1aWxkXHJcbiAgYnVpbGQ6IHtcclxuICAgIHRhcmdldDogJ2VzMjAxNScsXHJcbiAgICBzb3VyY2VtYXA6IG1vZGUgIT09ICdwcm9kdWN0aW9uJyxcclxuICAgIC8vIERpdmlkaXIgY2h1bmtzIHBhcmEgbWVsaG9yYXIgbyBjYXJyZWdhbWVudG9cclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICB2ZW5kb3I6IFtcclxuICAgICAgICAgICAgJ3JlYWN0JyxcclxuICAgICAgICAgICAgJ3JlYWN0LWRvbScsXHJcbiAgICAgICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcclxuICAgICAgICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcydcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICB1aTogW1xyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxyXG4gICAgICAgICAgICAnc29ubmVyJ1xyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIHBhcmEgZGVzZW52b2x2aW1lbnRvXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXHJcbiAgICBdLFxyXG4gICAgZXNidWlsZE9wdGlvbnM6IHtcclxuICAgICAgdGFyZ2V0OiAnZXMyMDIwJ1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gUmVkdXppciBvIHRhbWFuaG8gZG9zIGxvZ3NcclxuICBsb2dMZXZlbDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ2luZm8nIDogJ2luZm8nXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVixTQUFTLG9CQUFvQjtBQUM1WCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQTtBQUFBLE1BRUosV0FBVztBQUFBO0FBQUEsTUFFWCxjQUFjO0FBQUEsTUFDZCxTQUFTLENBQUM7QUFBQSxJQUNaLENBQUM7QUFBQSxJQUNELFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFdBQVcsU0FBUztBQUFBO0FBQUEsSUFFcEIsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUTtBQUFBLFlBQ047QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxJQUFJO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsVUFBVSxTQUFTLGVBQWUsU0FBUztBQUM3QyxFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
