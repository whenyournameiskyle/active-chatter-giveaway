import styled from '@emotion/styled'

export const accentColor = '#2980ed'
export const black = '#0e0e0e'

export const AlignRight = styled.div`
  ${({ color }) => color && `color: ${color};`}
  ${({ width }) => width && `width: ${width};`}
  text-align: right;
`

export const Button = styled.button`
  background-color: ${({ color }) => color || accentColor};
  border: none;
  color: ${black};
  cursor: pointer;
  ${({ disabled }) => disabled && 'opacity: 0.5;'}
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

export const ConfigContainer = styled.div`
  height: 15rem;
  display: flex;
  flex-direction: column;
}
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

export const JustifyCenter = styled.div`
  justify-content: center;
  display: flex;
`

export const Row = styled.div`
  background-color: ${({ invertedColors }) => invertedColors && accentColor};
  color: ${({ color, invertedColors }) => invertedColors ? black : color};
  display: flex;
  font-size: 1.4rem;
  justify-content: space-between;
  padding: ${({ thin }) => thin ? '0' : '0.5rem 0'};
  text-align: left;
  width: 100%;

  ${({ color, hover }) => hover && `
    &:hover {
      background-color: ${color || accentColor};
      color: ${black};
    };
  `}
`

export const RowNumber = styled.div`
  align-self: left;
  width: 4rem;
`

export const UsernameDisplay = styled.div`
  color: ${({ color }) => color};
  max-width: 21rem;
  text-align: left;
  width: 100%;
`
