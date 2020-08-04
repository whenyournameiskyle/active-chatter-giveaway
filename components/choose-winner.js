import styled from '@emotion/styled'
import { useState } from 'react'
import { MersenneTwister19937, Random } from 'random-js'
import { Button, ButtonRow, InputRow, Row, RowNumber } from '../shared/styled-components.js'

export default function ChooseWinners ({ checkIsSub, recordedChatters, updateRecordedChatters }) {
  const [chooseWinnerFrom, setChooseWinnerFrom] = useState('nonSubsOnly')
  const [isDisplayingCopied, setIsDisplayingCopied] = useState({})
  const [isSelectingWinner, setIsSelectingWinner] = useState(false)
  const [numberOfWinners, setNumberOfWinners] = useState('1')
  const [winners, setWinners] = useState([])
  const handleWinnerChange = (e) => {
    setChooseWinnerFrom(e.target.value)
  }
  const handleWinnerCountChange = (e) => {
    setNumberOfWinners(e.target.value)
  }
  const handleCopyWinner = (username) => {
    setIsDisplayingCopied({ [username]: true })
    window.navigator && window.navigator.clipboard.writeText(username)
    setTimeout(() => {
      setIsDisplayingCopied({ [username]: false })
    }, 500)
  }
  const clearWinners = () => {
    if (window.confirm('Do you really want to clear the list of winners?')) {
      setWinners([])
    }
  }
  // start handle choose winner
  let count = 0
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
  return (
    <div>
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
    </div>
  )
}
const WinnerCountInput = styled.input`
  border: none;
  border-radius: 10%;
  margin-left: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  width: 3.5rem;
`
