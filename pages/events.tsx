import Head from 'next/head'
import Link from 'next/link'

import Layout from '../components/Layout'

import EVENTS_QUERY from '../graphql/queries/events.graphql'
import { serverClient } from '../graphql/client'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

export async function getServerSideProps() {
  const query = await serverClient.query({
    query: EVENTS_QUERY,
  })

  const {
    data: { events },
  } = query

  return {
    props: {
      events,
    },
  }
}

export default function Events({ events }) {
  return (
    <Layout>
      <Head>
        <title>Bellamy Tag League: Events</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Events</h1>
        <Stack spacing={3}>
          {events.map((event) => {
            return (
              <Box key={`event-${event.id}`}>
                <Link href={`/events/${event.id}`}>
                  <a>
                    {event.title} at {event.course.name}
                  </a>
                </Link>
              </Box>
            )
          })}
        </Stack>
        <Box></Box>
      </main>
    </Layout>
  )
}
