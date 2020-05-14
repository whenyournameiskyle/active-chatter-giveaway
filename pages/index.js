import { useEffect, useState } from 'react'
import Head from 'next/head'
import TwitchJs from 'twitch-js'

const enigmaPurple = '#4700ff'
const anEternalEnigma = { userId: '20485198', username: 'aneternalenigma' }
const ignoredUsers = { 'aneternalenigma': true, 'aneternalbot': true }
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

  const [ recordedChatters, setRecordedChatters ] = useState({})
  const [ subbedChatters, setSubbedChatters ] = useState({})
  const [ unsubbedChatters, setUnsubbedChatters ] = useState({})
  const [ winner, setWinner ] = useState({})
  // end state hooks

  // start handle on mount with useEffect hook
  useEffect(() => {
    chat.removeAllListeners()
    chat.on(TwitchJs.Chat.Events.PARSE_ERROR_ENCOUNTERED, () => {})
    chat.connect().then(() => chat.join(anEternalEnigma.username))

    chat.on(TwitchJs.Chat.Events.PRIVATE_MESSAGE, ({ tags, username }) => {
      if (isRecording && !ignoredUsers[username]) {
        const isUserSubbed = parseInt(tags.subscriber)
        const newRecordedChatters = {...recordedChatters}
        newRecordedChatters[username] = { isUserSubbed, username }
        setRecordedChatters(prevObject => ({...prevObject, ...newRecordedChatters}))

        if (isUserSubbed) {
          updateSubbedChatters({ isUserSubbed, username })
        } else {
          const newUnsubbedChatters = {...unsubbedChatters}
          newUnsubbedChatters[username] = { isUserSubbed, username }
          setUnsubbedChatters(prevObject => ({...prevObject, ...newUnsubbedChatters}))
        }
      }
    })
  }, [])
  // end handle on mount with useEffect hook

  const clearChatters = () => {
    setRecordedChatters({})
    setSubbedChatters({})
    setUnsubbedChatters({})
    setWinner({})
  }

  const toggleIsRecording = () => {
    isRecording = !isRecording
    setIsRecordingState(!isRecordingState)
  }

  const updateSubbedChatters = ({ isUserSubbed, username }) => {
    const newSubbedChatters = {...subbedChatters}
    newSubbedChatters[username] = { isUserSubbed, username }
    setSubbedChatters(prevObject => ({...prevObject, ...newSubbedChatters}))

    if (unsubbedChatters[username]) {
      const newUnsubbedChatters = {...unsubbedChatters}
      delete newUnsubbedChatters[username]
      setUnsubbedChatters(prevObject => ({...prevObject, ...newUnsubbedChatters}))
    }
  }

  const handleDisplayChange = (e) => {
    setIsCurrentlyDisplaying(e.target.value)
  }

  const handleWinnerChange = (e) => {
    setChooseWinnerFrom(e.target.value)
  }

  const getWinner = () => {
    setWinner({})
    setIsSelectingWinner(true)
    const chatterObjects = {
      'allChatters': recordedChatters,
      'nonSubsOnly': unsubbedChatters,
      'subsOnly': subbedChatters
    }
    const selectedChatterObject = chatterObjects[chooseWinnerFrom]
    const numberOfChatters = Object.keys(selectedChatterObject).length

    if (!numberOfChatters) return setIsSelectingWinner(false)
    if (numberOfChatters < 2) {
      setIsSelectingWinner(false)
      return setWinner(Object.values(selectedChatterObject)[0])
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
        const potentialWinner = Object.values(selectedChatterObject)[parseInt(data)]

        if (chooseWinnerFrom !== 'nonSubsOnly') {
          setIsSelectingWinner(false)
          return setWinner(potentialWinner)
        }

        api.get('users', { search: { login: potentialWinner.username } })
        .then(({ data }) => {
          const userId = data.length && data[0].id
          if (!userId) return

          api.get('subscriptions', { search: { broadcaster_id: anEternalEnigma.userId, user_id: userId } })
          .then(({ data }) => {
            const isUserSubbed = !!data[0]
            if (isUserSubbed) {
              updateSubbedChatters({ isUserSubbed, username: potentialWinner.username})
              return getWinner()
            } else {
              setIsSelectingWinner(false)
              return setWinner(potentialWinner)
            }
          })
        })
      })
  }

  return (
    <div className='container'>
      <Head> <title>Active Chatter List</title></Head>
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
        <h2 className='accentColor'>{winner.username}</h2>
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
        <button onClick={toggleIsRecording}>{isRecordingState ? 'STOP' : 'START'} RECORDING</button>
        <button onClick={clearChatters}>CLEAR CHATTERS</button>
      </div>
      {
        <div>
          {Object.values(currentlyDisplaying === 'allChatters' ? recordedChatters : currentlyDisplaying === 'subsOnly' ? subbedChatters : unsubbedChatters).map((chatter, index) =>
            <div className='row' key={index}>
              <div>{chatter.username}</div>
              <div className={!!chatter.isUserSubbed && 'accentColor'}>{!!chatter.isUserSubbed ? 'Subbed!' : 'Not Subbed!'}</div>
            </div>
          )}
        </div>
      }
      <style jsx>{`
        .accentColor {
          color: ${enigmaPurple};
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
          background-color: ${enigmaPurple};
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
          border: 0.5rem solid ${enigmaPurple};
        }
      `}</style>
    </div>
  )
}
