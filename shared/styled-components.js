import styled from '@emotion/styled'
import { accentColor, black } from './styles.js'

export const Button = styled.button`
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

export const ButtonRow = styled.div`
  display: flex;
  width: 100%;
`

export const InputRow = styled.div`
  align-items: center;
  display: flex;
  font-size: 1.4rem;
  justify-content: center;
  padding: 1rem 0;
  text-align: left;
  width: 100%;
`

export const Row = styled.div`
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

export const RowNumber = styled.div`
  align-self: left;
  flex: 1;
  margin-right: 2rem;
  width: 3rem;
`
