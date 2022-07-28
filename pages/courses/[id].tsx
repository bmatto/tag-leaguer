import Link from 'next/link'
import { useEffect, useState } from 'react'
import { gql, useMutation, useQuery } from '@apollo/client'

import COURSE_QUERY from '../../graphql/queries/course.graphql'
import { serverClient } from '../../graphql/client'
import Layout from '../../components/Layout'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

const NEW_EVENT_MUTATION = gql`
  mutation AddEvent($eventInput: EventInput!) {
    addEvent(input: $eventInput) {
      id
      title
      date
    }
  }
`

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

function CreateNewEvent({ courseId, onSubmit, onCancel }) {
  const [mutateFunction] = useMutation(NEW_EVENT_MUTATION, {
    refetchQueries: [
      { query: COURSE_QUERY, variables: { courseId: parseInt(courseId) } },
    ],
  })

  const [newEvent, setNewEvent] = useState({
    courseId,
    title: '',
    date: '',
  })

  function handleChange(event) {
    setNewEvent({
      ...newEvent,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log(event, newEvent)

    mutateFunction({
      variables: {
        eventInput: {
          ...newEvent,
        },
      },
    })

    onSubmit()

    return false
  }

  return (
    <form onSubmit={handleSubmit} name="CreateNewEvent">
      <Stack spacing={3}>
        <TextField
          fullWidth
          required
          label="Title"
          onChange={handleChange}
          type={'text'}
          name="title"
          value={newEvent.title}
        />
        <TextField
          fullWidth
          label="Date"
          required
          onChange={handleChange}
          type={'datetime-local'}
          name="date"
          value={newEvent.date}
        />
        <Button variant="contained" type="submit">
          Looks Good!
        </Button>
        <Button variant="outlined" type="button" onClick={onCancel}>
          Nevermind
        </Button>
      </Stack>
    </form>
  )
}

export default function Course({ course }) {
  const { loading, data } = useQuery(COURSE_QUERY, {
    variables: {
      courseId: parseInt(course.id),
    },
  })
  const [isCreateNewEvent, setIsCreateNewEvent] = useState(false)
  const [courseData, setCourseData] = useState(course)

  useEffect(() => {
    if (!loading) {
      setCourseData(data.course)
    }
  }, [data, loading])

  function createNewEvent() {
    setIsCreateNewEvent(true)
  }

  function handleCreateNewEvent() {
    setIsCreateNewEvent(false)
  }

  function handleCancel() {
    setIsCreateNewEvent(false)
  }

  return (
    <Layout>
      <main>
        <h1>{courseData.name}</h1>

        {isCreateNewEvent ? (
          <CreateNewEvent
            onCancel={handleCancel}
            onSubmit={handleCreateNewEvent}
            courseId={courseData.id}
          />
        ) : (
          <Button variant="contained" onClick={createNewEvent}>
            {'Create New Event'}
          </Button>
        )}
        <Stack spacing={3}>
          {courseData.events.map((event) => {
            return (
              <Box key={`event-${event.id}`}>
                <Link href={`/events/${event.id}`}>
                  <a>{event.title}</a>
                </Link>
              </Box>
            )
          })}{' '}
        </Stack>
      </main>
    </Layout>
  )
}
