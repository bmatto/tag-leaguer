import Link from 'next/link'

import COURSE_QUERY from '../../graphql/queries/course.graphql'
import { serverClient } from '../../graphql/client'
import Layout from '../../components/Layout'

export async function getServerSideProps({ params }) {
  const { id: courseId } = params

  let query

  try {
    query = await serverClient.query({
      query: COURSE_QUERY,
      variables: {
        courseId: parseInt(courseId),
      },
    })
  } catch (e) {
    console.log(Object.keys(e))
    console.log(e.networkError.result)
    query = {
      data: {
        course: {
          name: 'foo',
        },
      },
    }
  }

  const {
    data: { course },
  } = query

  return {
    props: {
      course,
    },
  }
}

export default function Course({ course }) {
  return (
    <Layout>
      <main>
        <h1>{course.name}</h1>
        {course.events.map((event) => {
          return (
            <Link key={`event-${event.id}`} href={`/events/${event.id}`}>
              <a>{event.title}</a>
            </Link>
          )
        })}{' '}
      </main>
    </Layout>
  )
}
