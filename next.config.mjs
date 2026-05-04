import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    const stubPath = join(__dirname, 'lib', 'node-stub.js');

    // Strip "node:" prefix from imports, then alias to stub
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.normalModuleFactory.tap('StripNodePrefix', (nmf) => {
          nmf.hooks.beforeResolve.tap('StripNodePrefix', (resolveData) => {
            if (resolveData.request && resolveData.request.startsWith('node:')) {
              resolveData.request = resolveData.request.replace('node:', '');
            }
          });
        });
      }
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: stubPath,
        https: stubPath,
        http: stubPath,
        path: stubPath,
        stream: stubPath,
        util: stubPath,
        zlib: stubPath,
        url: stubPath,
        assert: stubPath,
        net: stubPath,
        tls: stubPath,
        crypto: stubPath,
        os: stubPath,
      };
    }

    return config;
  },
};

export default nextConfig;
