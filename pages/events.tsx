import Head from 'next/head'
import Link from 'next/link'

import Layout from '../components/Layout'

import EVENTS_QUERY from '../graphql/queries/events.graphql'
import { serverClient } from '../graphql/client'

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
        {events.map((event) => {
          return (
            <Link key={`event-${event.id}`} href={`/events/${event.id}`}>
              <a>
                {event.title} at {event.course.name}
              </a>
            </Link>
          )
        })}
      </main>
    </Layout>
  )
}
