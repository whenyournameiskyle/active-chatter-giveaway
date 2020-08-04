import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Events } from 'twitch-js'
import styled from '@emotion/styled'
import { accentColor, founderColor, modAndVIPColor } from '../shared/styles.js'
import { baseChannel, ignoredUsers, isDevelopment } from '../shared/constants.js'
import { Button, ButtonRow, InputRow, Row, RowNumber } from '../shared/styled-components.js'
import { api, chat } from '../shared/twitch-clients.js'
import ChooseWinner from '../components/choose-winner.js'
let recordedChatters = { }
let isRecording = !!isDevelopment
export default function Home () {
  // start state hooks
  const [currentlyDisplaying, setIsCurrentlyDisplaying] = useState('allChatters')
  const [isRecordingState, setIsRecordingState] = useState(isRecording)
  const [recordedChattersState, setRecordedChatters] = useState({})
  // end state hooks
  // start handle on mount with useEffect hook
  useEffect(() => {
    // start restore localStorage
    const restored = window.localStorage.getItem('recordedChattersBackup')
    if (restored) {
      const parsedRestored = JSON.parse(restored)
      recordedChatters = parsedRestored
      setRecordedChatters(prevObject => ({ ...prevObject, ...parsedRestored }))
    }
    // end restore localStorage
    chat.removeAllListeners()
    chat.on(Events.PARSE_ERROR_ENCOUNTERED, () => {})
    chat.connect().then(() => chat.join(baseChannel.username))
    chat.on(Events.PRIVATE_MESSAGE, ({ tags }) => {
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
    chat.on(Events.RESUBSCRIPTION, ({ tags }) => {
      const { displayName, userId } = tags
      updateRecordedChatters(true, displayName, userId)
    })
    chat.on(Events.SUBSCRIPTION, ({ tags }) => {
      const { displayName, userId } = tags
      updateRecordedChatters(true, displayName, userId)
    })
    chat.on(Events.SUBSCRIPTION_GIFT, ({ tags }) => {
      const { msgParamRecipientDisplayName, msgParamRecipientId } = tags
      if (recordedChatters[msgParamRecipientDisplayName.toLowerCase()]) {
        updateRecordedChatters(true, msgParamRecipientDisplayName, msgParamRecipientId)
      }
    })
    chat.on(Events.USER_BANNED, ({ username }) => {
      ignoredUsers[username] = true
      delete recordedChatters[username]
      setRecordedChatters(() => ({ ...recordedChatters }))
      window.localStorage.setItem('recordedChattersBackup', JSON.stringify(recordedChatters))
    })
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
  const clearChatters = () => {
    if (window.confirm('Do you really want to clear all chatters?')) {
      isRecording = false
      setIsRecordingState(isRecording)
      window.localStorage.removeItem('recordedChattersBackup')
      recordedChatters = {}
      setRecordedChatters({})
      isRecording = true
      setIsRecordingState(isRecording)
    }
  }
  const handleDisplayChange = (e) => {
    setIsCurrentlyDisplaying(e.target.value)
  }
  const handleToggleIsRecording = () => {
    isRecording = !isRecording
    setIsRecordingState(!isRecordingState)
  }
  return (
    <Container>
      <Head><title>Active Chatter List v4.2.1</title></Head>
      <ChooseWinner
        checkIsSub={checkIsSub}
        recordedChatters={recordedChatters}
        updateRecordedChatters={updateRecordedChatters}
      />
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
        <Row color={chatter.color} key={index} thin>
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
const UsernameDisplay = styled.div`
  text-align: left;
  width: 100%;
`
const SubbedStatus = styled.div`
  text-align: right;
  width: 100%;
`
