import TwitchJs, { Events } from 'twitch-js'

const { chat } = new TwitchJs({ log: { level: 'silent' } })
chat.on(Events.PARSE_ERROR_ENCOUNTERED, () => {})
chat.removeAllListeners()
chat.connect()
  .then(() => {
    console.info('Connected to Twitch!')
  })
  .catch(e => console.error(`Error connecting to Twitch! ${e}`))
export { chat }
