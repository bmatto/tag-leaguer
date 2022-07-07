import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'

import COURSES_QUERY from '../graphql/queries/courses.graphql'
import { serverClient } from '../graphql/client'

export async function getServerSideProps() {
  const query = await serverClient.query({
    query: COURSES_QUERY,
  })

  const {
    data: { courses },
  } = query

  return {
    props: {
      courses,
    },
  }
}

export default function Courses({ courses }) {
  return (
    <Layout>
      <Head>
        <title>Bellamy Tag League: Courses</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Courses</h1>
        {courses.map((course) => {
          return (
            <Link key={`course-${course.id}`} href={`/courses/${course.id}`}>
              <a>{course.name}</a>
            </Link>
          )
        })}
      </main>
    </Layout>
  )
}
