import TwitchJs from 'twitch-js'

export const { chat } = new TwitchJs({ log: { level: 'silent' } })
export const { api } = new TwitchJs({
  log: { level: 'error' },
  clientId: '',
  token: ''
})
