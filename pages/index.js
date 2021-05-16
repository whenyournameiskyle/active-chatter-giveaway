import Head from 'next/head'
import styled from '@emotion/styled'
import { useEffect, useState } from 'react'
import TwitchJs, { Events } from 'twitch-js'

import { accentColor, AlignRight, Button, ButtonRow, ConfigContainer, InputRow, JustifyCenter, Row, RowNumber, UsernameDisplay } from '../shared/styled-components.js'
import { ignoredUsers, isDevelopment } from '../shared/constants.js'
import ChooseWinner from '../components/choose-winner.js'

const { chat } = new TwitchJs({ log: { level: 'silent' } })

let chatterSessionStorageTimeout, isRecording
let recordedChatters = { }
let wordFilter = ''

export default function Home () {
  const [channelToRecord, setChannelToRecord] = useState('')
  const [wordFilterDisplayState, setWordFilter] = useState('')
  const [chooseWinnerFrom, setChooseWinnerFrom] = useState('nonSubsOnly')
  const [currentlyDisplaying, setIsCurrentlyDisplaying] = useState('allChatters')
  const [isRecordingState, setIsRecordingState] = useState(isRecording)
  const [selectedTab, setSelectedTab] = useState('chatters')
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
    chat.on(Events.PRIVATE_MESSAGE, ({ message, tags }) => {
      const { badges, displayName, subscriber, userId } = tags
      if (ignoredUsers[displayName.toLowerCase()]) return
      message = message.toLowerCase()
      // if (!!wordFilter && !message.trim().split(' ').includes(wordFilter)) {
      //   return
      // }
      if (!!wordFilter && message.trim() !== wordFilter) {
        return
      }
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
      setChatterStorage(recordedChatters)
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
    if (!isDevelopment) {
      window.dataLayer = window.dataLayer || []
      function gtag () {
        window.dataLayer.push(arguments)
      }
      gtag('js', new Date())
      gtag('config', 'G-J8VJ5R14TS', {
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_title: window.document.title
      })
    }
  }, [])

  const clearChatters = () => {
    if (chatterSessionStorageTimeout) clearTimeout(chatterSessionStorageTimeout)
    window.sessionStorage.removeItem('recordedChattersBackup')
    recordedChatters = {}
    setRecordedChatters({})
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

  const setChatterStorage = (recordedChatters) => {
    if (chatterSessionStorageTimeout) clearTimeout(chatterSessionStorageTimeout)
    chatterSessionStorageTimeout = setTimeout(() => {
      const stringified = JSON.stringify(recordedChatters)
      window.sessionStorage.setItem('recordedChattersBackup', stringified)
    }, 500)
  }

  const updateRecordedChatters = (isUserSubbed, username, userId, badges) => {
    username = username.toLowerCase()
    if (isRecording && !ignoredUsers[username]) {
      const count = recordedChatters[username] ? recordedChatters[username].count || 0 : 0
      recordedChatters[username] = { isUserSubbed, username, userId, badges, count: count + 1 }
      setRecordedChatters(prevObject => ({ ...prevObject, ...recordedChatters }))
      setChatterStorage(recordedChatters)
    }
  }

  const handleChannelToRecordChange = (e) => {
    if (!e.target.value) return
    setChannelToRecord(e.target.value)
  }

  const handleChooseTab = (value) => {
    setSelectedTab(value)
  }

  const handleClearChatters = () => {
    if (window.confirm('Do you really want to clear all chatters?')) {
      clearChatters()
    }
  }

  const handleDisplayChange = (e) => {
    setIsCurrentlyDisplaying(e.target.value)
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
          quickExit = true
        }
      })
    }

    if (quickExit) {
      isRecording = true
      setIsRecordingState(true)
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
      const value = e.target.value.trim()
      if (e.target.id === 'wordFilter') {
        setWordFilter(value)
        wordFilter = value.toLowerCase()
        handleJoinNewChannel(channelToRecord)
      }
      if (e.target.id === 'channelToRecord') {
        handleJoinNewChannel(value)
      }
    }
  }

  const handleToggleIsRecording = () => {
    isRecording = !isRecording
    if (isRecording) {
      handleJoinNewChannel(channelToRecord)
    }
    setIsRecordingState(!isRecordingState)
  }

  const handleWordFilterChange = (e) => {
    if (e?.target?.value.toLowerCase() !== wordFilter && isRecordingState) {
      isRecording = false
      setIsRecordingState(false)
    }
    const word = e?.target?.value.trim() || ''
    setWordFilter(word)
    wordFilter = word.toLowerCase()
  }

  return (
    <Container>
      <Head>
        <title>Active Chatter Giveaway</title>
      </Head>
      <Tabs>
        <Tab isSelected={selectedTab === 'chatters'} onClick={() => handleChooseTab('chatters')}>
          Chatter List
        </Tab>
        <Tab isSelected={selectedTab === 'winners'} onClick={() => handleChooseTab('winners')}>
          Choose Winner
        </Tab>
      </Tabs>
      <Left isSelected={selectedTab === 'chatters'}>
        <ConfigContainer>
          <h1>Record{isRecordingState && channelToRecord ? 'ing' : ''} Chatters In</h1>
          <JustifyCenter>
            <Column margin='0.25rem'>
              <h2>Channel:</h2>
              <TextInput onChange={handleChannelToRecordChange} onKeyPress={handleKeyPress} id='channelToRecord' type='text' value={channelToRecord} />
            </Column>
            <Column>
              <h2>Word filter:</h2>
              <TextInput onChange={handleWordFilterChange} onKeyPress={handleKeyPress} id='wordFilter' type='text' value={wordFilterDisplayState} />
            </Column>
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
          <Button color={isRecordingState ? 'red' : ''} disabled={!channelToRecord} onClick={handleToggleIsRecording}>{isRecordingState ? 'STOP RECORDING' : 'RECORD'}</Button>
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
        ))}
      </Left>
      <Right isSelected={selectedTab === 'winners'}>
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

const Column = styled.div`
  display: flex;
  flex-direction: column;
`

const Container = styled.div`
  align-items: center;
  display: flex;
  font-size: 1.4rem;
  flex: 0 0 100%;
  justify-content: center;
  text-align: center;
  @media only screen and (max-width: 600px) {
    flex-direction: column;
  }
`

const Left = styled.div`
  margin-bottom: auto;
  padding: 0 5rem;

  @media only screen and (max-width: 600px) {
    padding: 0;
    display: ${({ isSelected }) => isSelected ? 'inline-block' : 'none'};
  }
`

const Right = styled.div`
  flex-direction: column;
  margin-bottom: auto;
  padding: 0 5rem;

  @media only screen and (max-width: 600px) {
    padding: 0;
    display: ${({ isSelected }) => isSelected ? 'inline-block' : 'none'};
  }
`

const Tab = styled.div`
  background-color: ${({ isSelected }) => isSelected ? accentColor : ''};
  border: 0.25rem solid ${accentColor};
  width: 100%;
`

const Tabs = styled.div`
  display: none;
  @media only screen and (max-width: 600px) {
    display: flex;
    padding-bottom: 1rem;
    width: 100%;
  }
`

const TextInput = styled.input`
  border: none;
  border-radius: 10%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  width: 90%;
`
