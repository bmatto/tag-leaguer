import Link from 'next/link'
import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout>
      <main>
        <div className="grid">
          <Link href="/courses">
            <a className="card">
              <h3>Courses &rarr;</h3>
              <p>A list of all the courses in Leaguer</p>
            </a>
          </Link>

          <Link href="/events">
            <a className="card">
              <h3>Events &rarr;</h3>
              <p>A list of all the events in Leaguer</p>
            </a>
          </Link>
        </div>
      </main>
    </Layout>
  )
}
