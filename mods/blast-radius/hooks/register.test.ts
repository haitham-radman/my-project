import { test, expect } from 'claude-code/testing'

test('denies a destructive command once, then lets the same command through', async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: 'ok' }))

  const first = await $.tool.call({ tool: 'Bash', command: 'rm -rf dist' })
  expect(first.deny).toContain('deletes files')

  const second = await $.tool.call({ tool: 'Bash', command: 'rm -rf dist' })
  expect(second.deny).toBeUndefined()
})
