import type { Register } from 'claude-code'

const DESTRUCTIVE = /\b(rm\s+(-\w*[rf]\w*|--recursive|--force)|git\s+clean|git\s+reset\s+--hard|find\b.*\s-delete|shred|truncate)\b/

export const register: Register = on => {
  const approved = new Set<string>()

  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    const command = e.command.trim()

    if (!DESTRUCTIVE.test(command) || approved.has(command)) {
      return next(e)
    }

    approved.add(command)

    return {
      deny:
        `${$.plugin.name}: this command deletes files:\n  ${command}\n` +
        'List what it would remove (e.g. with ls or a dry run) and tell the user. ' +
        'If the user confirms, run the exact same command again.',
    }
  })
}
