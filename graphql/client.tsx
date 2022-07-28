import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client'

console.log(process.env.BASE_URL)

export const serverClient = new ApolloClient({
  ssrMode: true,
  link: createHttpLink({
    uri: `${process.env.BASE_URL}/api/graphql`,
    credentials: 'same-origin',
  }),
  cache: new InMemoryCache(),
})

export const browserClient = new ApolloClient({
  link: createHttpLink({
    uri: '/api/graphql',
    credentials: 'same-origin',
  }),
  cache: new InMemoryCache(),
})
