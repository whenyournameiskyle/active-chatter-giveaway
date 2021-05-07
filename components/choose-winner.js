import styled from '@emotion/styled'
import React, { useState } from 'react'
import { MersenneTwister19937, Random } from 'random-js'
import { Button, ButtonRow, ConfigContainer, InputRow, JustifyCenter, Row, RowNumber } from '../shared/styled-components.js'

export default React.memo(function ChooseWinners ({ chooseWinnerFrom, selectedChatterArray, setChooseWinnerFrom, updateRecordedChatters }) {
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
  let tries = 0
  const getWinner = async () => {
    tries += 1
    if (tries >= 25) return
    setIsSelectingWinner(true)
    const numberOfChatters = selectedChatterArray.length
    if (!numberOfChatters) return setIsSelectingWinner(false)
    if (numberOfChatters < 2) {
      setIsSelectingWinner(false)
      return setWinners([selectedChatterArray[0].username])
    }
    const potentialWinnerIndex = await fetchWinner(numberOfChatters - 1)
    const potentialWinner = (selectedChatterArray[potentialWinnerIndex])

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
      <ConfigContainer>
        <h1>Choose Winner From:</h1>
        <h2>Winners to Choose:</h2>
        <JustifyCenter>
          <WinnerCountInput min='1' onChange={handleWinnerCountChange} type='number' value={numberOfWinners} />
        </JustifyCenter>
        <h2>Select Winner From:</h2>
        <InputRow>
          <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='allChattersWinner' value='allChatters' checked={chooseWinnerFrom === 'allChatters'} />
          <label htmlFor='allChattersWinner'>All Chatters</label>
          <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='subsOnlyWinner' value='subsOnly' checked={chooseWinnerFrom === 'subsOnly'} />
          <label htmlFor='subsOnlyWinner'>Subs Only</label>
          <input onChange={handleWinnerChange} type='radio' name='filterPotentialWinner' id='nonSubsOnlyWinner' value='nonSubsOnly' checked={chooseWinnerFrom === 'nonSubsOnly'} />
          <label htmlFor='nonSubsOnlyWinner'>Non-Subs Only</label>
        </InputRow>
      </ConfigContainer>
      <ButtonRow>
        <Button disabled={!!isSelectingWinner} onClick={getWinner}>{isSelectingWinner ? 'PICKING...' : 'PICK WINNER(S)'} </Button>
        <Button onClick={clearWinners}>CLEAR WINNERS</Button>
      </ButtonRow>
      {!!winners.length && <h1>Winner(s):</h1>}
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
    </div>
  )
})

const WinnerCountInput = styled.input`
  border: none;
  border-radius: 10%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  text-align: center;
  width: 3.5rem;
`
