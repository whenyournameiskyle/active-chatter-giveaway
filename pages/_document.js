import Document, { Head, Html, Main, NextScript } from 'next/document'
import { extractCritical } from '@emotion/server'
import { isDevelopment } from '../shared/constants.js'

export default class MyDocument extends Document {
  static async getInitialProps (ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    const styles = extractCritical(initialProps.html)
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-emotion-css={styles.ids.join(' ')}
            dangerouslySetInnerHTML={{ __html: styles.css }}
          />
        </>
      )
    }
  }

  render () {
    return (
      <Html>
        <Head>
          {!isDevelopment && <script async src='https://www.googletagmanager.com/gtag/js?id=G-J8VJ5R14TS' />}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
