import NextApp from 'next/app'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { injectGlobal } from '@emotion/css'
import { accentColor, black } from '../shared/styled-components.js'

injectGlobal`
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
  `

const cache = createCache({ key: 'my-css-key' })

export default class App extends NextApp {
  render () {
    const { Component, pageProps } = this.props
    return (
      <CacheProvider value={cache}>
        <Component {...pageProps} />
      </CacheProvider>
    )
  }
}
