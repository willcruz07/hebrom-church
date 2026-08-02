// PostToolUse hook: lints the file Claude just edited/wrote (advisory only, no --fix).
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let input = ''
process.stdin.on('data', (chunk) => (input += chunk))
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input)
    const filePath = payload?.tool_input?.file_path
    if (!filePath || !/\.(ts|tsx)$/.test(filePath)) process.exit(0)

    try {
      const output = execFileSync('npx', ['eslint', filePath], {
        cwd: path.resolve(__dirname, '..', '..'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      })
      if (output.trim()) process.stdout.write(output)
    } catch (err) {
      // eslint exits non-zero when it finds problems — that's the whole point, just show them
      if (err.stdout) process.stdout.write(err.stdout)
      if (err.stderr) process.stderr.write(err.stderr)
    }
  } catch {
    // malformed hook input — stay silent, never block the edit
  }
  process.exit(0)
})
