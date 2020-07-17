import { css, Global } from '@emotion/core'
import { isDevelopment } from './constants.js'
export const accentColor = isDevelopment ? 'orangered' : '#4700ff'
export const black = '#0e0e0e'
export const founderColor = '#ff5090'
export const modAndVIPColor = '#fac748'
export const globalStyles = (
  <Global
    styles={css`
      body, html {
        background: ${black};
        color: white;
        font-size: 10px;
        margin: 0;
        padding: 0.5rem;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
        Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
          sans-serif;
      }
      input {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border: 0.1rem solid white;
        border-radius: 50%;
        cursor: pointer;
        height: 1.5rem;
        margin: 0;
        padding: 0rem;
        width: 1.5rem;
      }
      input:checked {
        border: 0.5rem solid ${accentColor};
      }
      h1 {
        margin: 1rem 0 1rem 0;
      }
      h1:first-of-type {
        margin: 0 0 1rem 0;
      }
      h2 {
        font-size: 1.4rem;
        font-weight: 400;
        padding: 0.5rem 0;
        margin: 0;
      }
      label {
        padding: 0 2rem 0 1rem;
      }
      label:last-of-type {
        padding: 0 0 0 1rem;
      }
  `}
  />
)
