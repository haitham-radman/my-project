import type { Register } from 'claude-code'

const WIDTH = 20

export const register: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { context } = await $.session.usage()

    if (e.props.hasSurvey || context.percent === undefined) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const percent = Math.min(100, Math.max(0, context.percent))
    const filled = Math.round((percent / 100) * WIDTH)
    const bar = '█'.repeat(filled) + '░'.repeat(WIDTH - filled)
    const label = percent >= 85 ? 'stormy' : percent >= 60 ? 'cloudy' : 'clear'

    return (
      <Box>
        <Text dimColor>
          Context {bar} {percent}% · {label}
        </Text>
      </Box>
    )
  })
}
