import { useEffect, useState } from 'react'
import Head from 'next/head'
import TwitchJs from 'twitch-js'
const accentColor = '#4700ff'
const baseChannel = { userId: '20485198', username: 'aneternalenigma' }
const ignoredUsers = {
  'aneternalenigma': true,
  'ananonymouscheerer': true,
  'aneternalbot': true,
  'streamelements': true,
  'nightbot': true,
  'moobot': true
}
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
  const [ isDisplayingCopied, setIsDisplayingCopied ] = useState({})
  const [ recordedChattersState, setRecordedChatters ] = useState({})
  const [ winners, setWinners ] = useState([])
  // end state hooks
  // start handle on mount with useEffect hook
  useEffect(() => {
    chat.removeAllListeners()
    chat.on(TwitchJs.Chat.Events.PARSE_ERROR_ENCOUNTERED, () => {})
    chat.connect().then(() => chat.join(baseChannel.username))
    chat.on(TwitchJs.Chat.Events.PRIVATE_MESSAGE, ({ tags, username }) => {
      if (isRecording && !ignoredUsers[username]) {
        const isUserSubbed = parseInt(tags.subscriber) || !!tags.badges?.founder
        updateRecordedChatters(isUserSubbed, username)
      }
    })
    const restored = window.localStorage.getItem('recordedChattersBackup')
    if (!!restored) {
      const parsedRestored = JSON.parse(restored)
      recordedChatters = parsedRestored
      setRecordedChatters(prevObject => ({...prevObject, ...parsedRestored}))
    }
  }, [])
  // end handle on mount with useEffect hook
  const updateRecordedChatters = (isUserSubbed, username) => {
    recordedChatters[username] = { isUserSubbed, username }
    setRecordedChatters(prevObject => ({...prevObject, ...recordedChatters}))
    window.localStorage.setItem('recordedChattersBackup', JSON.stringify(recordedChatters))
  }
  // start handle choose winner
  const getWinner = () => {
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
      return setWinners([selectedChatterArray[0].username])
    }
    fetch(`https://www.random.org/integers/?num=1&min=0&max=${numberOfChatters - 1}&col=1&base=10&format=plain`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.text())
      .then(async data => {
        const potentialWinner = selectedChatterArray[parseInt(data)] && selectedChatterArray[parseInt(data)].username
        let tempWinnerArray = [...winners]
        if (tempWinnerArray.includes(potentialWinner)) {
          return getWinner()
        }
        if (chooseWinnerFrom === 'nonSubsOnly') {
          const isUserSubbed = await checkIsSub(potentialWinner)
          if (isUserSubbed) {
            updateRecordedChatters(isUserSubbed, potentialWinner)
            return getWinner()
          }
        }
        tempWinnerArray.push(potentialWinner)
        setIsSelectingWinner(false)
        return setWinners(tempWinnerArray)
      })
  }
  // end handle choose winner
  // start api check is sub
  const checkIsSub = (username) => {
    if (!api || !username) return
    return api.get('users', { search: { login: username } })
      .then(({ data }) => {
        const userId = data.length && data[0].id
        if (!userId) return
        return api.get('subscriptions', { search: { broadcaster_id: baseChannel.userId, user_id: userId } })
        .then(({ data }) => {
          const isUserSubbed = !!data[0]
          if (isUserSubbed) {
            return true
          } else {
            return false
          }
        })
      })
  }
  // end api check is sub
  const clearWinners = () => {
    if (window.confirm('Do you really want to clear the list of winners?')) {
      setWinners([])
    }
  }
  const clearChatters = () => {
    if (window.confirm('Do you really want to clear all chatters?')) {
      recordedChatters = {}
      setRecordedChatters({})
      setWinners([])
      window.localStorage.removeItem('recordedChattersBackup')
    }
  }
  const handleCopyWinner = (username) => {
    setIsDisplayingCopied({ [username]: true })
    window.navigator && window.navigator.clipboard.writeText(username)
    setTimeout(() => {
      setIsDisplayingCopied({ [username]: false })
    }, 500)
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
      <Head> <title>Active Chatter List v3.1.0</title></Head>
      <h1> Choose Winner From: </h1>
      <div className='row' >
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='allChattersWinner' value='allChatters' checked={chooseWinnerFrom === 'allChatters'} />
        <label htmlFor='allChattersWinner'>All Chatters</label>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='subsOnlyWinner' value='subsOnly' checked={chooseWinnerFrom === 'subsOnly'} />
        <label htmlFor='subsOnlyWinner'>Subs Only</label>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='nonSubsOnlyWinner' value='nonSubsOnly' checked={chooseWinnerFrom === 'nonSubsOnly'} />
        <label htmlFor='nonSubsOnlyWinner'>Non-Subs Only</label>
      </div>
      {!!winners.length &&
        <div>
          <h1>WINNER(S):</h1>
          {winners.map((winner, index) =>
            <div className='row thin winner' key={index}>
              <div className='rowNumber'>{index + 1}.</div>
              <div
                className={isDisplayingCopied[winner] ? 'accentBackground' : 'accentColor'}
                onClick={() => handleCopyWinner(winner)}
              >
                {isDisplayingCopied[winner] ? 'Copied!' : winner}
              </div>
            </div>
          )}
        </div>
      }
      <div className='buttonRow'>
        <button disabled={!!isSelectingWinner} onClick={getWinner}>{isSelectingWinner ? 'CHOOSING...' : 'CHOOSE WINNER(S)'} </button>
        <button onClick={clearWinners}>CLEAR WINNERS</button>
      </div>
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
      <div>
        {Object.values(recordedChattersState).filter((chatter) =>
          (currentlyDisplaying === 'subsOnly' && chatter.isUserSubbed)
          || (currentlyDisplaying === 'nonSubsOnly' && !chatter.isUserSubbed)
          || (currentlyDisplaying === 'allChatters')
        ).map((chatter, index) => (
            <div className={`row ${!!chatter.isUserSubbed && 'accentColor'}`} key={index}>
              <div className='username'>{chatter.username}</div>
              <div>{!!chatter.isUserSubbed ? 'Subbed!' : 'Not Subbed!'}</div>
            </div>
          )
        )}
      </div>
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
          align-items: center;
          display: flex;
          justify-content: space-evenly;
          text-align: left;
          width: 40rem;
        }
        .rowNumber {
          align-self: left;
          flex-grow: 1;
          width: 3rem;
        }
        .thin {
          width: 30rem;
        }
        .username {
          flex-grow: 1;
          margin-left: 2rem;
        }
        .winner {
          font-size: 1.6rem;
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
          font-size: 1.4rem;
          font-weight: 400;
          padding: 0.5rem 0;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
