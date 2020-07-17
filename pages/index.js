import { useEffect, useState } from 'react'
import Head from 'next/head'
import TwitchJs from 'twitch-js'
import { MersenneTwister19937, Random } from 'random-js'
import styled from '@emotion/styled'
import { accentColor, black, founderColor, modAndVIPColor } from '../shared/styles.js'
import { baseChannel, ignoredUsers, isDevelopment } from '../shared/constants.js'
let recordedChatters = { }
let isRecording = !!isDevelopment
// start initialize Twitch Clients
const { chat } = new TwitchJs({ log: { level: 'silent' } })
const { api } = new TwitchJs({
  log: { level: 'error' },
  clientId: '',
  token: ''
})
// end initialize Twitch Clients
export default function Home () {
  // start state hooks
  const [currentlyDisplaying, setIsCurrentlyDisplaying] = useState('allChatters')
  const [chooseWinnerFrom, setChooseWinnerFrom] = useState('nonSubsOnly')
  const [isRecordingState, setIsRecordingState] = useState(isRecording)
  const [isSelectingWinner, setIsSelectingWinner] = useState(false)
  const [isDisplayingCopied, setIsDisplayingCopied] = useState({})
  const [numberOfWinners, setNumberOfWinners] = useState('1')
  const [recordedChattersState, setRecordedChatters] = useState({})
  const [winners, setWinners] = useState([])
  // end state hooks
  // start handle on mount with useEffect hook
  useEffect(() => {
    chat.removeAllListeners()
    chat.on(TwitchJs.Chat.Events.PARSE_ERROR_ENCOUNTERED, () => {})
    chat.connect().then(() => chat.join(baseChannel.username))
    chat.on(TwitchJs.Chat.Events.PRIVATE_MESSAGE, ({ tags }) => {
      const { badges, displayName, subscriber, userId } = tags
      const isUserSubbed = !!badges?.subscriber || !!badges?.founder || !!parseInt(subscriber)
      let color = 'white'
      if (badges?.founder) {
        color = founderColor
      } else if (badges?.vip || badges?.moderator) {
        color = modAndVIPColor
      } else if (isUserSubbed) {
        color = accentColor
      }
      updateRecordedChatters(isUserSubbed, displayName, userId, color)
    })
    chat.on(TwitchJs.Chat.Events.RESUBSCRIPTION, ({ tags }) => {
      const { displayName, userId } = tags
      updateRecordedChatters(true, displayName, userId)
    })
    chat.on(TwitchJs.Chat.Events.SUBSCRIPTION, ({ tags }) => {
      const { displayName, userId } = tags
      updateRecordedChatters(true, displayName, userId)
    })
    chat.on(TwitchJs.Chat.Events.SUBSCRIPTION_GIFT, ({ tags }) => {
      const { msgParamRecipientDisplayName, msgParamRecipientId } = tags
      if (recordedChatters[msgParamRecipientDisplayName.toLowerCase()]) {
        updateRecordedChatters(true, msgParamRecipientDisplayName, msgParamRecipientId)
      }
    })
    chat.on(TwitchJs.Chat.Events.USER_BANNED, ({ username }) => {
      ignoredUsers[username] = true
      delete recordedChatters[username]
      setRecordedChatters(() => ({ ...recordedChatters }))
      window.localStorage.setItem('recordedChattersBackup', JSON.stringify(recordedChatters))
    })
    // start restore localStorage
    const restored = window.localStorage.getItem('recordedChattersBackup')
    if (restored) {
      const parsedRestored = JSON.parse(restored)
      recordedChatters = parsedRestored
      setRecordedChatters(prevObject => ({ ...prevObject, ...parsedRestored }))
    }
    // end restore localStorage
  }, [])
  // end handle on mount with useEffect hook
  const updateRecordedChatters = (isUserSubbed, username, userId, color = '') => {
    if (isRecording && !ignoredUsers[username]) {
      const lowercaseUsername = username.toLowerCase()
      if (!color && isUserSubbed) {
        color = accentColor
      }
      recordedChatters[lowercaseUsername] = { isUserSubbed, username, userId, color }
      setRecordedChatters(prevObject => ({ ...prevObject, ...recordedChatters }))
      window.localStorage.setItem('recordedChattersBackup', JSON.stringify(recordedChatters))
    }
  }
  let count = 0
  // start handle choose winner
  const getWinner = async () => {
    setIsSelectingWinner(true)
    const chatterObjects = {
      allChatters: Object.values(recordedChatters),
      nonSubsOnly: Object.values(recordedChatters).filter(chatter => !chatter.isUserSubbed),
      subsOnly: Object.values(recordedChatters).filter(chatter => !!chatter.isUserSubbed)
    }
    const selectedChatterArray = chatterObjects[chooseWinnerFrom]
    const numberOfChatters = selectedChatterArray.length
    if (!numberOfChatters) return setIsSelectingWinner(false)
    if (numberOfChatters < 2) {
      setIsSelectingWinner(false)
      return setWinners([selectedChatterArray[0].username])
    }
    const potentialWinnerIndex = await fetchWinner(numberOfChatters - 1)
    const potentialWinner = (selectedChatterArray[potentialWinnerIndex])
    if (chooseWinnerFrom === 'nonSubsOnly') {
      const isUserSubbed = await checkIsSub(potentialWinner.userId)
      if (isUserSubbed) {
        updateRecordedChatters(isUserSubbed, potentialWinner.username, potentialWinner.userId)
        return getWinner()
      }
    }
    setWinners((previousWinners) => {
      if (previousWinners.includes(potentialWinner.username)) {
        return [...previousWinners]
      }
      count += 1
      return [...previousWinners, ...[potentialWinner.username]]
    })
    if (count < numberOfWinners) {
      return getWinner()
    }
    return setIsSelectingWinner(false)
  }
  const fetchWinner = (max) => {
    const random = new Random(MersenneTwister19937.autoSeed())
    const integer = random.integer(0, max)
    return integer
  }
  // end handle choose winner
  // start api check is sub
  const checkIsSub = (userId) => {
    if (!api || !userId) return
    return api.get('subscriptions', { search: { broadcaster_id: baseChannel.userId, user_id: userId } })
      .then(({ data }) => {
        const isUserSubbed = !!data[0]
        if (isUserSubbed) {
          return true
        } else {
          return false
        }
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
      isRecording = false
      setIsRecordingState(isRecording)
      window.localStorage.removeItem('recordedChattersBackup')
      recordedChatters = {}
      setRecordedChatters({})
      setWinners([])
      isRecording = true
      setIsRecordingState(isRecording)
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
  const handleWinnerCountChange = (e) => {
    setNumberOfWinners(e.target.value)
  }
  const handleToggleIsRecording = () => {
    isRecording = !isRecording
    setIsRecordingState(!isRecordingState)
  }
  return (
    <Container>
      <Head><title>Active Chatter List v4.2.0</title></Head>
      <h1>Choose Winner From:</h1>
      <InputRow>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='allChattersWinner' value='allChatters' checked={chooseWinnerFrom === 'allChatters'} />
        <label htmlFor='allChattersWinner'>All Chatters</label>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='subsOnlyWinner' value='subsOnly' checked={chooseWinnerFrom === 'subsOnly'} />
        <label htmlFor='subsOnlyWinner'>Subs Only</label>
        <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='nonSubsOnlyWinner' value='nonSubsOnly' checked={chooseWinnerFrom === 'nonSubsOnly'} />
        <label htmlFor='nonSubsOnlyWinner'>Non-Subs Only</label>
      </InputRow>
      {!!winners.length && <h1>WINNER(S):</h1>}
      {!!winners.length &&
        winners.map((winner, index) => {
          const wasCopied = !!isDisplayingCopied[winner]
          return (
            <Row key={index} onClick={() => handleCopyWinner(winner)}>
              <RowNumber>{index + 1}.</RowNumber>
              <div>{wasCopied ? 'Copied!' : winner}</div>
            </Row>
          )
        })}
      <InputRow>
        Winners to Choose:
        <WinnerCountInput min='1' onChange={handleWinnerCountChange} type='number' value={numberOfWinners} />
      </InputRow>
      <ButtonRow>
        <Button disabled={!!isSelectingWinner} onClick={getWinner}>{isSelectingWinner ? 'CHOOSING...' : 'CHOOSE WINNER(S)'} </Button>
        <Button onClick={clearWinners}>CLEAR WINNERS</Button>
      </ButtonRow>
      <h1> Display list of: </h1>
      <InputRow>
        <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='allChatters' value='allChatters' checked={currentlyDisplaying === 'allChatters'} />
        <label htmlFor='allChatters'>All Chatters</label>
        <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='subsOnly' value='subsOnly' checked={currentlyDisplaying === 'subsOnly'} />
        <label htmlFor='subsOnly'>Subs Only</label>
        <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='nonSubsOnly' value='nonSubsOnly' checked={currentlyDisplaying === 'nonSubsOnly'} />
        <label htmlFor='nonSubsOnly'>Non-Subs Only</label>
      </InputRow>
      <ButtonRow>
        <Button onClick={handleToggleIsRecording}>{isRecordingState ? 'STOP' : 'START'} RECORDING</Button>
        <Button onClick={clearChatters}>CLEAR CHATTERS</Button>
      </ButtonRow>
      {Object.values(recordedChattersState).filter((chatter) =>
        (currentlyDisplaying === 'subsOnly' && chatter.isUserSubbed) ||
        (currentlyDisplaying === 'nonSubsOnly' && !chatter.isUserSubbed) ||
        (currentlyDisplaying === 'allChatters')
      ).map((chatter, index) => (
        <Row thin color={chatter.color} key={index}>
          <UsernameDisplay>{chatter.username}</UsernameDisplay>
          <SubbedStatus>{chatter.isUserSubbed ? 'Subbed!' : 'Not Subbed!'}</SubbedStatus>
        </Row>
      )
      )}
    </Container>
  )
}
const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: 1.4rem;
  margin: 0 auto;
  max-width: 36rem;
  min-height: 100vh;
  text-align: center;
`
const ButtonRow = styled.div`
  display: flex;
  width: 100%;
`
const UsernameDisplay = styled.div`
  text-align: left;
  width: 100%;
`
const SubbedStatus = styled.div`
  text-align: right;
  width: 100%;
`
const RowNumber = styled.div`
  align-self: left;
  flex: 1;
  margin-right: 2rem;
  width: 3rem;
`
const InputRow = styled.div`
  align-items: center;
  display: flex;
  font-size: 1.4rem;
  justify-content: center;
  padding: 1rem 0;
  text-align: left;
  width: 100%;
`
const Row = styled.div`
  align-items: center;
  background-color: ${({ invertedColors }) => invertedColors && accentColor};
  color: ${({ color, invertedColors }) => invertedColors ? black : color};
  display: flex;
  font-size: 1.4rem;
  justify-content: center;
  padding: ${({ thin }) => thin ? '0' : '0.5rem 0'};
  text-align: left;
  width: 100%;

  &:hover {
    background-color: ${({ color }) => color || accentColor};
    color: ${black};
  }
`
const Button = styled.button`
  background-color: ${accentColor};
  border: none;
  color: ${black};
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 1rem 0;
  padding: 1.5rem;
  width: 100%;

  &:first-of-type {
    margin-right: 2rem;
  }
`
const WinnerCountInput = styled.input`
  background-color: ;
  border: none;
  border-radius: 10%;
  margin-left: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  width: 3.5rem;
`
