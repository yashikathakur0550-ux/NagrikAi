import { Plugin } from 'vite';
import { handleApiRoute } from './api';

export function viteApiPlugin(): Plugin {
  return {
    name: 'nagrikai-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const handled = await handleApiRoute(req, res);
          if (handled) return;
        }
        next();
      });
    },
  };
}
