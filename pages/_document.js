import Document, { Head, Html, Main, NextScript } from 'next/document'
import { extractCritical } from '@emotion/server'

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
          <script async src='https://www.googletagmanager.com/gtag/js?id=G-J8VJ5R14TS'></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
