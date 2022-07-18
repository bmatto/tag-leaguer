import { ApolloProvider } from '@apollo/client'

import { browserClient } from '../graphql/client'

const Leaguer = ({ Component, pageProps }) => {
  return (
    <ApolloProvider client={browserClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  )
}
export default Leaguer
