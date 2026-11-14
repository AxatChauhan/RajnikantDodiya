import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (url.startsWith('/api/auth')) {
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              let body = {};
              try { body = JSON.parse(bodyStr); } catch {}
              const action = url.replace('/api/auth', '').replace(/^\//, '').split('?')[0] || '';
              const { default: handler } = await import('./api/auth.js');
              const mockRes = {
                statusCode: 200,
                setHeader(k: string, v: string) { res.setHeader(k, v); },
                status(c: number) { this.statusCode = c; return this; },
                json(data: any) {
                  res.statusCode = this.statusCode;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end(data?: any) {
                  res.end(data);
                }
              };
              return handler({ method: req.method, url, body, query: { action }, headers: req.headers }, mockRes);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        if (url.startsWith('/api/store/price')) {
          try {
            const { default: handler } = await import('./api/store/price.js');
            const mockRes = {
              statusCode: 200,
              setHeader(k: string, v: string) { res.setHeader(k, v); },
              status(c: number) { this.statusCode = c; return this; },
              json(data: any) {
                res.statusCode = this.statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              }
            };
            return handler({ method: req.method, query: {}, headers: req.headers }, mockRes);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            return;
          }
        }
        if (url.startsWith('/api/store/create-order')) {
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              let body = {};
              try { body = JSON.parse(bodyStr); } catch {}
              const { default: handler } = await import('./api/store/create-order.js');
              const mockRes = {
                statusCode: 200,
                setHeader(k: string, v: string) { res.setHeader(k, v); },
                status(c: number) { this.statusCode = c; return this; },
                json(data: any) {
                  res.statusCode = this.statusCode;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                }
              };
              return handler({ method: req.method, body, headers: req.headers }, mockRes);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        if (url.startsWith('/api/store/verify-payment')) {
          let bodyStr = '';
          req.on('data', (chunk: any) => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              let body = {};
              try { body = JSON.parse(bodyStr); } catch {}
              const { default: handler } = await import('./api/store/verify-payment.js');
              const mockRes = {
                statusCode: 200,
                setHeader(k: string, v: string) { res.setHeader(k, v); },
                status(c: number) { this.statusCode = c; return this; },
                json(data: any) {
                  res.statusCode = this.statusCode;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                }
              };
              return handler({ method: req.method, body, headers: req.headers }, mockRes);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        if (url.startsWith('/api/store/razorpay-webhook')) {
          const bodyChunks: any[] = [];
          req.on('data', (chunk: any) => { bodyChunks.push(chunk); });
          req.on('end', async () => {
            try {
              const rawBodyBuffer = Buffer.concat(bodyChunks);
              const rawBodyStr = rawBodyBuffer.toString('utf8');
              let body = {};
              try { body = JSON.parse(rawBodyStr); } catch {}
              const { default: handler } = await import('./api/store/razorpay-webhook.js');
              const mockReq = {
                method: req.method,
                rawBody: rawBodyBuffer,
                body,
                headers: req.headers
              };
              const mockRes = {
                statusCode: 200,
                setHeader(k: string, v: string) { res.setHeader(k, v); },
                status(c: number) { this.statusCode = c; return this; },
                json(data: any) {
                  res.statusCode = this.statusCode;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                }
              };
              return handler(mockReq, mockRes);
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiDevMiddleware()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-qr': ['qrcode.react'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});

