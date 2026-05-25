import http from 'node:http'
import { spawn } from 'node:child_process'

const server = spawn('node', ['.output/server/index.mjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, PORT: '3099' }
})

let serverOutput = ''
server.stdout.on('data', (d) => {
  serverOutput += d.toString()
})
server.stderr.on('data', (d) => {
  serverOutput += d.toString()
})

setTimeout(() => {
  http.get('http://localhost:3099/', (res) => {
    let body = ''
    res.on('data', (chunk) => {
      body += chunk
    })
    res.on('end', () => {
      console.log('STATUS:', res.statusCode)
      if (res.statusCode >= 400) {
        console.log('BODY (first 2000 chars):', body.substring(0, 2000))
      } else {
        console.log('SSR OK, HTML length:', body.length)
      }
      if (serverOutput) console.log('SERVER LOG:', serverOutput)
      server.kill()
      process.exit(0)
    })
  }).on('error', (e) => {
    console.log('REQUEST ERROR:', e.message)
    console.log('SERVER OUTPUT:', serverOutput)
    server.kill()
    process.exit(1)
  })
}, 4000)

setTimeout(() => {
  console.log('TIMEOUT')
  console.log('SERVER OUTPUT:', serverOutput)
  server.kill()
  process.exit(1)
}, 20000)
