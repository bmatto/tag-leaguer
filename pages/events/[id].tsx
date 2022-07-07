import EVENT_QUERY from '../../graphql/queries/event.graphql'
import { serverClient } from '../../graphql/client'
import Layout from '../../components/Layout'

export async function getServerSideProps({ params }) {
  const { id: eventId } = params

  let query

  try {
    query = await serverClient.query({
      query: EVENT_QUERY,
      variables: {
        eventId: parseInt(eventId),
      },
    })
  } catch (e) {
    console.log(Object.keys(e))
    console.log(e.networkError.result)
    query = {
      data: {
        event: {
          title: 'foo',
        },
      },
    }
  }

  const {
    data: { event },
  } = query

  return {
    props: {
      event,
    },
  }
}

export default function Event({ event }) {
  return (
    <Layout>
      <main>
        <h1>{event.title}</h1>
        <ul>
          {event.scores.map((score) => {
            const { user } = score
            return (
              <li key={`score-${score.id}`}>
                {user.firstname} {user.lastname} - {score.strokes}
              </li>
            )
          })}
        </ul>
      </main>
    </Layout>
  )
}
