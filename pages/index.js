import Head from 'next/head'
import styled from '@emotion/styled'
import { useEffect, useState } from 'react'
import TwitchJs, { Events } from 'twitch-js'

import { accentColor, AlignRight, Button, ButtonRow, ConfigContainer, InputRow, JustifyCenter, Row, RowNumber, UsernameDisplay } from '../shared/styled-components.js'
import { ignoredUsers } from '../shared/constants.js'
import ChooseWinner from '../components/choose-winner.js'

const { chat } = new TwitchJs({ log: { level: 'silent' } })

let chatterSessionStorageTimeout, isRecording
let recordedChatters = { }

export default function Home () {
  const [channelToRecord, setChannelToRecord] = useState('')
  const [chooseWinnerFrom, setChooseWinnerFrom] = useState('nonSubsOnly')
  const [currentlyDisplaying, setIsCurrentlyDisplaying] = useState('allChatters')
  const [isRecordingState, setIsRecordingState] = useState(isRecording)
  const [sortKey, setSortKey] = useState('')
  const [recordedChattersState, setRecordedChatters] = useState({})
  useEffect(() => {
    chat.removeAllListeners()
    chat.connect()
      .then(() => {
        console.info('Connected to Twitch!')
      })
      .catch(e => console.error(`Error connecting to Twitch! ${e}`))
    chat.on(Events.PARSE_ERROR_ENCOUNTERED, () => {})
    chat.on(Events.PRIVATE_MESSAGE, ({ tags }) => {
      const { badges, displayName, subscriber, userId } = tags
      if (ignoredUsers[displayName.toLowerCase()]) return
      const isUserSubbed = parseInt(subscriber) || !!badges?.subscriber || !!badges?.founder
      updateRecordedChatters(isUserSubbed, displayName, userId, badges)
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
      ignoredUsers[username.toLowerCase()] = true
      delete recordedChatters[username]
      setRecordedChatters(() => ({ ...recordedChatters }))
      handleSetChatterStorage(recordedChatters)
    })
    // start restore sessionStorage
    const restoredChannelToRecord = window.sessionStorage.getItem('channelToRecordBackup')
    if (restoredChannelToRecord) {
      handleJoinNewChannel(restoredChannelToRecord)

      const restoredChatters = window.sessionStorage.getItem('recordedChattersBackup')
      if (restoredChatters) {
        const parsedRestored = JSON.parse(restoredChatters)
        recordedChatters = parsedRestored
        setRecordedChatters(prevObject => ({ ...prevObject, ...parsedRestored }))
      }
    }
    // end restore sessionStorage
  }, [])

  const updateRecordedChatters = (isUserSubbed, username, userId, badges) => {
    username = username.toLowerCase()
    if (isRecording && !ignoredUsers[username]) {
      const count = recordedChatters[username] ? recordedChatters[username].count || 0 : 0
      recordedChatters[username] = { isUserSubbed, username, userId, badges, count: count + 1 }
      setRecordedChatters(prevObject => ({ ...prevObject, ...recordedChatters }))
      handleSetChatterStorage(recordedChatters)
    }
  }

  const handleSetChatterStorage = (recordedChatters) => {
    if (chatterSessionStorageTimeout) clearTimeout(chatterSessionStorageTimeout)
    chatterSessionStorageTimeout = setTimeout(() => {
      const stringified = JSON.stringify(recordedChatters)
      window.sessionStorage.setItem('recordedChattersBackup', stringified)
    }, 500)
  }
  const handleClearChatters = () => {
    if (window.confirm('Do you really want to clear all chatters?')) {
      clearChatters()
    }
  }

  const clearChatters = () => {
    window.sessionStorage.removeItem('recordedChattersBackup')
    recordedChatters = {}
    setRecordedChatters({})
  }

  const handleChannelToRecordChange = (e) => {
    if (!e.target.value) return
    setChannelToRecord(e.target.value)
  }

  const handleDisplayChange = (e) => {
    setIsCurrentlyDisplaying(e.target.value)
  }

  const handleToggleIsRecording = () => {
    isRecording = !isRecording
    if (isRecording) {
      handleJoinNewChannel(channelToRecord)
    }
    setIsRecordingState(!isRecordingState)
  }

  const handleJoinNewChannel = (newChannel) => {
    const currentChannels = Object.keys(chat._channelState)
    let quickExit = false

    if (currentChannels.length) {
      currentChannels.forEach((channel) => {
        channel = channel.replace('#', '')
        if (newChannel !== channel) {
          chat.part(channel)
        }
        if (newChannel === channel) {
          console.log('AH!, this should rarely happen I think?')
          quickExit = true
        }
      })
    }

    if (quickExit) {
      return
    }

    setChannelToRecord(newChannel)
    clearChatters(true)

    chat.join(newChannel)
      .then(() => {
        console.info(`Joined ${newChannel}`)
        isRecording = true
        setIsRecordingState(true)
        window.sessionStorage.setItem('channelToRecordBackup', newChannel)
      })
      .catch(e => {
        console.error(`Error joining ${newChannel}, ${e}`)
      })
  }

  const handleKeyPress = (e) => {
    if (e.charCode === 13) {
      handleJoinNewChannel(e?.target?.value)
    }
  }

  const getFiltered = (arrayToFilter, displayingOnSwitch) => {
    switch (displayingOnSwitch) {
      case 'subsOnly':
        return arrayToFilter.filter((user) => user.isUserSubbed)
      case 'nonSubsOnly':
        return arrayToFilter.filter((user) => !user.isUserSubbed)
      default:
        return arrayToFilter
    }
  }
  const getSorted = (arrayToSort) => {
    if (!sortKey) return arrayToSort
    if (sortKey === 'username') return arrayToSort.sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    return arrayToSort.sort((a, b) => b[sortKey] - a[sortKey])
  }

  return (
    <Container>
      <Head>
        <title>Active Chatter Giveaway</title>
      </Head>
      <Left>
        <ConfigContainer>
          <h1>Record{isRecordingState && channelToRecord ? 'ing' : ''} Chatters In</h1>
          <h2>Channel:</h2>
          <JustifyCenter>
            <ChannelNameInput onChange={handleChannelToRecordChange} onKeyPress={handleKeyPress} type='text' value={channelToRecord} />
          </JustifyCenter>
          <h2>Display:</h2>
          <InputRow>
            <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='allChatters' value='allChatters' checked={currentlyDisplaying === 'allChatters'} />
            <label htmlFor='allChatters'>All Chatters</label>
            <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='subsOnly' value='subsOnly' checked={currentlyDisplaying === 'subsOnly'} />
            <label htmlFor='subsOnly'>Subs Only</label>
            <input onChange={handleDisplayChange} type='radio' name='filterChatterType' id='nonSubsOnly' value='nonSubsOnly' checked={currentlyDisplaying === 'nonSubsOnly'} />
            <label htmlFor='nonSubsOnly'>Non-Subs Only</label>
          </InputRow>
        </ConfigContainer>
        <ButtonRow>
          <Button color={isRecordingState ? 'red' : ''} disabled={!channelToRecord} onClick={handleToggleIsRecording}>{isRecordingState ? 'STOP' : 'START'} RECORDING</Button>
          <Button onClick={handleClearChatters}>CLEAR CHATTERS</Button>
        </ButtonRow>
        <Row>
          <RowNumber onClick={() => setSortKey('')}>#</RowNumber>
          <UsernameDisplay onClick={() => setSortKey('username')}>Username</UsernameDisplay>
          <div onClick={() => setSortKey('count')}>⇟</div>
          <AlignRight width='12rem' />
        </Row>
        {getSorted(getFiltered(Object.values(recordedChattersState), currentlyDisplaying)).map((user, index) => (
          <Row color={user.isUserSubbed ? accentColor : ''} hover key={index} thin>
            <RowNumber>{index + 1}.</RowNumber>
            <UsernameDisplay>{user.username}</UsernameDisplay>
            <div>{user.count}</div>
            <AlignRight width='12rem'>{user.isUserSubbed ? 'Subbed!' : 'Not Subbed!'}</AlignRight>
          </Row>
        )
        )}
      </Left>
      <Right>
        <ChooseWinner
          chooseWinnerFrom={chooseWinnerFrom}
          selectedChatterArray={getFiltered(Object.values(recordedChattersState), chooseWinnerFrom)}
          setChooseWinnerFrom={setChooseWinnerFrom}
          updateRecordedChatters={updateRecordedChatters}
        />
      </Right>
    </Container>
  )
}

const Container = styled.div`
    align-items: center;
    display: flex;
    font-size: 1.4rem;
    justify-content: center;
    text-align: center;
`

const Left = styled.div`
    margin-bottom: auto;
    padding: 0 5rem;
`

const Right = styled.div`
    flex-direction: column;
    margin-bottom: auto;
    padding: 0 5rem;
`

const ChannelNameInput = styled.input`
  border: none;
  border-radius: 10%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  width: 90%;
`
