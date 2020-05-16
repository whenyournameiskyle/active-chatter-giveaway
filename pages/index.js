import { useEffect, useState } from 'react'
import Head from 'next/head'
import TwitchJs from 'twitch-js'

const accentColor = '#4700ff'
const baseChannel = { userId: '20485198', username: 'aneternalenigma' }
const ignoredUsers = { 'aneternalenigma': true, 'aneternalbot': true }
let recordedChatters = {  }
let isRecording = false

// start initialize Twitch Clients
const { chat } = new TwitchJs({ log: { level: 'silent' }})
const { api } = new TwitchJs({
  log: { level: 'error' },
  clientId: '',
  token: ''
})
// end initialize Twitch Clients

export default function Home () {
  // start state hooks
  const [ currentlyDisplaying, setIsCurrentlyDisplaying ] = useState('allChatters')
  const [ chooseWinnerFrom, setChooseWinnerFrom ] = useState('nonSubsOnly')
  const [ isRecordingState, setIsRecordingState ] = useState(isRecording)
  const [ isSelectingWinner, setIsSelectingWinner ] = useState(false)
  const [ isDisplayingCopied, setIsDisplayingCopied ] = useState(false)

  const [ recordedChattersState, setRecordedChatters ] = useState({})
  const [ winner, setWinner ] = useState({})
  // end state hooks

  // start handle on mount with useEffect hook
  useEffect(() => {
    chat.removeAllListeners()
    chat.on(TwitchJs.Chat.Events.PARSE_ERROR_ENCOUNTERED, () => {})
    chat.connect().then(() => chat.join(baseChannel.username))

    chat.on(TwitchJs.Chat.Events.PRIVATE_MESSAGE, ({ tags, username }) => {
      if (isRecording && !ignoredUsers[username]) {
        const isUserSubbed = parseInt(tags.subscriber)
        recordedChatters[username] = { isUserSubbed, username }
        setRecordedChatters(prevObject => ({...prevObject, ...recordedChatters}))
      }
    })
  }, [])
  // end handle on mount with useEffect hook

  // start handle choose winner
  const getWinner = () => {
    setWinner({})
    setIsSelectingWinner(true)
    const chatterObjects = {
      'allChatters': Object.values(recordedChatters),
      'nonSubsOnly': Object.values(recordedChatters).filter(chatter => !chatter.isUserSubbed),
      'subsOnly': Object.values(recordedChatters).filter(chatter => !!chatter.isUserSubbed),
    }

    const selectedChatterArray = chatterObjects[chooseWinnerFrom]
    const numberOfChatters = selectedChatterArray.length

    if (!numberOfChatters) return setIsSelectingWinner(false)
    if (numberOfChatters < 2) {
      setIsSelectingWinner(false)
      return setWinner(selectedChatterArray[0])
    }

    fetch(`https://www.random.org/integers/?num=1&min=0&max=${numberOfChatters - 1}&col=1&base=10&format=plain`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.text())
      .then(data => {
        const potentialWinner = selectedChatterArray[parseInt(data)]

        if (chooseWinnerFrom !== 'nonSubsOnly') {
          setIsSelectingWinner(false)
          return setWinner(potentialWinner)
        }

        api.get('users', { search: { login: potentialWinner.username } })
        .then(({ data }) => {
          const userId = data.length && data[0].id
          if (!userId) return

          api.get('subscriptions', { search: { broadcaster_id: baseChannel.userId, user_id: userId } })
          .then(({ data }) => {
            const isUserSubbed = !!data[0]
            recordedChatters[potentialWinner.username] = { isUserSubbed, username: potentialWinner.username }
            setRecordedChatters(prevObject => ({...prevObject, ...recordedChatters}))

            if (isUserSubbed) {
              return getWinner()
            } else {
              setIsSelectingWinner(false)
              return setWinner(potentialWinner)
            }
          })
        })
      })
  }
  // end handle choose winner

  const clearChatters = () => {
    if (window.confirm('Do you really want to clear all chatters?')) {
      recordedChatters = {}
      setRecordedChatters({})
      setWinner({})
    }
  }

  const handleCopyWinner = (username) => {
    setIsDisplayingCopied(true)
    window.navigator && window.navigator.clipboard.writeText(username)
    setTimeout(() => setIsDisplayingCopied(false), 400)
  }

  const handleDisplayChange = (e) => {
    setIsCurrentlyDisplaying(e.target.value)
  }

  const handleWinnerChange = (e) => {
    setChooseWinnerFrom(e.target.value)
  }

  const handleToggleIsRecording = () => {
    isRecording = !isRecording
    setIsRecordingState(!isRecordingState)
  }

  return (
    <div className='container'>
      <Head> <title>Active Chatter List 2.2</title></Head>
      <h1> Choose Winner From: </h1>
      <div className='row' >
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='allChattersWinner' value='allChatters' checked={chooseWinnerFrom === 'allChatters'} />
        <label htmlFor='allChattersWinner'>All Chatters</label>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='subsOnlyWinner' value='subsOnly' checked={chooseWinnerFrom === 'subsOnly'} />
        <label htmlFor='subsOnlyWinner'>Subs Only</label>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='nonSubsOnlyWinner' value='nonSubsOnly' checked={chooseWinnerFrom === 'nonSubsOnly'} />
        <label htmlFor='nonSubsOnlyWinner'>Non-Subs Only</label>
      </div>
      {!!winner.username &&
      <div>
        <h1>AND THE WINNER IS</h1>
        <h2 className={isDisplayingCopied ? 'accentBackground' : 'accentColor'} onClick={() => handleCopyWinner(winner.username)}>{isDisplayingCopied ? 'Copied!' : winner.username}</h2>
      </div>
      }
      <button onClick={getWinner}>{isSelectingWinner ? 'CHOOSING...' : 'CHOOSE WINNER'} </button>
      <h1> Display list of: </h1>
      <div className='row'>
        <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='allChatters' value='allChatters' checked={currentlyDisplaying === 'allChatters'} />
        <label htmlFor='allChatters'>All Chatters</label>
        <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='subsOnly' value='subsOnly' checked={currentlyDisplaying === 'subsOnly'} />
        <label htmlFor='subsOnly'>Subs Only</label>
        <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='nonSubsOnly' value='nonSubsOnly' checked={currentlyDisplaying === 'nonSubsOnly'} />
        <label htmlFor='nonSubsOnly'>Non-Subs Only</label>
      </div>
      <div className='buttonRow'>
        <button onClick={handleToggleIsRecording}>{isRecordingState ? 'STOP' : 'START'} RECORDING</button>
        <button onClick={clearChatters}>CLEAR CHATTERS</button>
      </div>
      {
        <div>
          {Object.values(recordedChattersState).map((chatter, index) => {
            if ((currentlyDisplaying === 'subsOnly' && chatter.isUserSubbed)
              || (currentlyDisplaying === 'nonSubsOnly' && !chatter.isUserSubbed)
              || (currentlyDisplaying === 'allChatters')
            ) {
              return (
                <div className='row' key={index}>
                  <div>{chatter.username}</div>
                  <div className={!!chatter.isUserSubbed && 'accentColor'}>{!!chatter.isUserSubbed ? 'Subbed!' : 'Not Subbed!'}</div>
                </div>
              )
            }
          })}
        </div>
      }
      <style jsx>{`
        .accentBackground {
          background-color: ${accentColor};
          color: black;
        }

        .accentColor {
          color: ${accentColor};
        }

        .container {
          align-items: center;
          display: flex;
          flex-direction: column;
          font-size: 1.4rem;
          min-height: 100vh;
          text-align: center;
        }

        .buttonRow {
          display: flex;
          justify-content: center;
          width: 40rem;
        }

        .row {
          display: flex;
          justify-content: space-between;
          width: 40rem;
        }
      `}</style>
      <style jsx global>{`
        body, html {
          background: black;
          color: white;
          font-size: 10px;
          margin: 0;
          padding: 0.5rem;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
          Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }
        button {
          background-color: ${accentColor};
          border: none;
          color: black;
          cursor: pointer;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 3rem 1rem;
          padding: 1rem;
        }
        input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: 0.1rem solid white;
          border-radius: 50%;
          cursor: pointer;
          height: 1.5rem;
          width: 1.5rem;

        }
        input:checked {
          border: 0.5rem solid ${accentColor};
        }
        h2 {
          padding: 1rem 0;
        }
      `}</style>
    </div>
  )
}
