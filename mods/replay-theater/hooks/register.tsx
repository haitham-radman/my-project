import type { Register } from 'claude-code'

const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])

export const register: Register = on => {
  let edits: string[] = []

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'replay',
      description: 'Replay the file edits of the last turn, in order',
    })

    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    edits = []

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const path = typeof e.file_path === 'string' ? e.file_path : undefined

    if (path !== undefined && EDIT_TOOLS.has(e.tool)) {
      edits.push(`${edits.length + 1}. ${e.tool} ${path}`)
      $.ui.status(`${edits.length} edits across ${new Set(edits.map(x => x.split(' ')[2])).size} files`)
    }

    return next(e)
  })

  on('command.run', { command: 'replay' }, () => ({
    text: edits.length === 0 ? 'No edits in the last turn.' : edits.join('\n'),
  }))
}
