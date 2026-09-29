import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import os from 'os'

function networkIpPlugin(): Plugin {
  return {
    name: 'network-ip-plugin',
    configureServer(server) {
      server.middlewares.use('/api/network-ip', (_req, res) => {
        const interfaces = os.networkInterfaces()
        const ips: string[] = []
        for (const name of Object.keys(interfaces)) {
          const list = interfaces[name]
          if (list) {
            for (const iface of list) {
              const isIPv4 = iface.family === 'IPv4' || (iface.family as unknown) === 4
              if (isIPv4 && !iface.internal) {
                ips.push(iface.address)
              }
            }
          }
        }
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(JSON.stringify({ ips }))
      })
    }
  }
}

// `npm run dev`       -> http://<LAN-IP>:5173   (phone can open the product URL)
// `npm run dev:https` -> https://<LAN-IP>:5173  (also lets the phone's in-app camera scanner work)
export default defineConfig(({ mode }) => ({
  plugins: [react(), networkIpPlugin(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: { host: '0.0.0.0', port: 5173, strictPort: false },
  preview: { host: '0.0.0.0', port: 5173 },
}))

