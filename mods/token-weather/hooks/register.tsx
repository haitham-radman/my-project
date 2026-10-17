import type { Register } from 'claude-code'

const WIDTH = 20

const weather = (rawPercent: number) => {
  const percent = Math.min(100, Math.max(0, rawPercent))
  const filled = Math.round((percent / 100) * WIDTH)
  const bar = '█'.repeat(filled) + '░'.repeat(WIDTH - filled)
  const label = percent >= 85 ? 'stormy' : percent >= 60 ? 'cloudy' : 'clear'

  return `Context ${bar} ${percent}% · ${label}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'token-weather',
      description: 'Show how full the context window is',
    })

    return next(e)
  })

  on('command.run', { command: 'token-weather' }, async $ => {
    const { context } = await $.session.usage()

    return {
      text:
        context.percent === undefined
          ? 'token-weather: no context reading yet (send a message first).'
          : `token-weather: ${weather(context.percent)}`,
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { context } = await $.session.usage()

    if (e.props.hasSurvey || context.percent === undefined) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>{weather(context.percent)}</Text>
      </Box>
    )
  })
}
