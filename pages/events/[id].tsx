import { useMutation, useQuery, gql } from '@apollo/client'
import { useEffect, useMemo, useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'

import { debounce } from '@mui/material'
import { sort } from 'ramda'

import EVENT_QUERY from '../../graphql/queries/event.graphql'
// import { serverClient } from '../../graphql/client'
import Layout from '../../components/Layout'
import UsersAutocomplete from '../../components/UsersAutoComplete'

function Name(props) {
  const { sx, ...other } = props

  return (
    <Box
      sx={{
        ...sx,
      }}
      {...other}
    />
  )
}

function Score({ sx, eventScore, userId, handleUpdateScore }) {
  const maybeStrokes = eventScore ? eventScore.strokes : ''
  const [strokes, setStrokes] = useState(maybeStrokes)

  return (
    <TextField
      sx={{
        ...sx,
      }}
      onChange={(event) => {
        setStrokes(event.target.value)
        handleUpdateScore(userId, event.target.value)
      }}
      type="number"
      variant="standard"
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      value={strokes}
    />
  )
}

function LastCourseTag({ tag }) {
  const [lastTag, setLastTag] = useState((tag && tag.number) || '')

  return (
    <Box sx={{ width: 40 }}>
      <TextField
        variant="standard"
        value={lastTag}
        onChange={(event) => setLastTag(event.target.value)}
      />
    </Box>
  )
}

function CurrentTag({ onCurrentTagChange, user }) {
  const { currentCourseTag: tag } = user
  const initialCurrentTag = (tag && parseInt(tag.number)) || ''

  if (user.id === '78') {
    console.log('tag prop', tag.id, initialCurrentTag)
  }

  const [currentTag, setCurrentTag] = useState(() => initialCurrentTag)
  const scoreId = user.eventScore ? user.eventScore.id : undefined

  function handleCurrentTagChange(event) {
    'handle Tag change'
    setCurrentTag(event.target.value)
    onCurrentTagChange(user.id, event.target.value, scoreId)
  }

  if (user.id === '78') {
    console.log(currentTag)
  }

  return (
    <TextField
      disabled={!user.eventScore}
      sx={{ width: 40 }}
      type="number"
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      variant="standard"
      value={currentTag}
      onChange={handleCurrentTagChange}
    />
  )
}

const splitUsersIntoCards = (users) => {
  let i = 0
  const cardUsers = [...users]
  const cards = [cardUsers.splice(0, 4)]
  const remainder = cardUsers.length % 3

  while (cardUsers.length > 0) {
    const potentialRemainingThreeCards = cardUsers.length / 3
    const totalPotentialCards = potentialRemainingThreeCards + cards.length

    if (i < remainder || totalPotentialCards > 18) {
      cards.push(cardUsers.splice(0, 4))
    } else {
      cards.push(cardUsers.splice(0, 3))
    }
    i++
  }

  return cards
}

const sortUsers = sort((userA, userB) => {
  const strokesA = userA.eventScore
    ? parseInt(userA.eventScore.strokes)
    : Infinity
  const strokesB = userB.eventScore
    ? parseInt(userB.eventScore.strokes)
    : Infinity

  const lastTagA = userA.lastEventTag
    ? parseInt(userA.lastEventTag.number)
    : Infinity
  const lastTagB = userB.lastEventTag
    ? parseInt(userB.lastEventTag.number)
    : Infinity

  return strokesA - strokesB || lastTagA - lastTagB
})

const REMOVE_USER_FROM_EVENT = gql`
  mutation RemoveUserFromEvent($eventId: ID!, $userId: ID!) {
    removeUserFromEvent(userId: $userId, eventId: $eventId)
  }
`

const UPDATE_SCORE = gql`
  mutation UpdateScore($UpdateScoreInput: UpdateScoreInput!) {
    updateScore(input: $UpdateScoreInput) {
      id
      strokes
    }
  }
`

const UPDATE_CURRENT_TAG = gql`
  mutation UpdateCurrentTag($UpdateCurrentTagInput: UpdateCurrentTagInput!) {
    updateCurrentTag(input: $UpdateCurrentTagInput) {
      id
      number
    }
  }
`

export async function getServerSideProps({ params }) {
  const { id: eventId } = params

  // let query

  // try {
  //   query = await serverClient.query({
  //     query: EVENT_QUERY,
  //     variables: {
  //       eventId: eventId,
  //     },
  //   })
  // } catch (e) {
  //   console.log(Object.keys(e))
  //   console.log(e.networkError.result)
  //   console.log(e.networkError.message)
  //   query = {
  //     data: {
  //       event: {
  //         title: 'foo',
  //         users: [],
  //         course: {
  //           name: 'bar',
  //         },
  //       },
  //     },
  //   }
  // }

  // const {
  //   data: { event },
  // } = query

  return {
    props: {
      event: {
        id: eventId,
        title: 'foo',
        users: [],
        course: {
          name: 'bar',
        },
      },
    },
  }
}

export default function Event({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent)

  const [users, setUsers] = useState(sortUsers(event.users))
  const [cards, setCards] = useState(splitUsersIntoCards(users))

  useEffect(() => {
    setCards(splitUsersIntoCards(users))
  }, [users])

  const { loading: eventLoading, data: eventData } = useQuery(EVENT_QUERY, {
    variables: {
      eventId: event.id,
    },
    fetchPolicy: 'network-only',
  })

  const eventQuery = {
    query: EVENT_QUERY,
    variables: { eventId: event.id },
  }

  const [removeUserFromEvent] = useMutation(REMOVE_USER_FROM_EVENT, {
    refetchQueries: [eventQuery],
  })

  const [updateScore] = useMutation(UPDATE_SCORE)
  const [updateCurrentTag] = useMutation(UPDATE_CURRENT_TAG)

  function handleRemoveUserFromEvent(userId) {
    removeUserFromEvent({
      variables: {
        userId,
        eventId: event.id,
      },
    })
  }

  const handleUpdateScore = useMemo(() => {
    return debounce((userId, strokes) => {
      updateScore({
        variables: {
          UpdateScoreInput: {
            userId,
            strokes: parseInt(strokes),
            eventId: event.id,
            date: event.date,
          },
        },
      })
    }, 1000)
  }, [updateScore, event])

  const handleCurrentTagChange = useMemo(() => {
    return debounce((userId, tagNumber, scoreId) => {
      updateCurrentTag({
        variables: {
          UpdateCurrentTagInput: {
            userId,
            scoreId,
            courseId: event.course.id,
            number: parseInt(tagNumber),
          },
        },
      })
    }, 1000)
  }, [updateCurrentTag, event])

  useEffect(() => {
    if (!eventLoading && eventData) {
      setEvent(eventData.event)
      setUsers(sortUsers(eventData.event.users))
    }
  }, [eventLoading, eventData])

  return (
    <Layout>
      <main>
        <h1>
          {event.title} at {event.course.name}
        </h1>
        <p>{new Date(parseInt(event.date)).toDateString()}</p>
        {/* <button onClick={handleDelete}>Delete Event</button> */}
        <UsersAutocomplete
          eventQuery={eventQuery}
          eventId={event.id}
          users={users}
        />

        <Box
          sx={{
            mt: 2,
            mb: 2,
          }}
        >
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-evenly',
                alignItems: 'center',
              }}
            >
              <Box sx={{ width: 40 }}>Prv Tag</Box>
              <Box sx={{ width: 40 }}>Cur Tag</Box>
              <Box sx={{ flex: 1 }}>Name</Box>
            </Box>
            {cards.map((cardUsers, i) => {
              return (
                <Box key={`cardUsers-${i}`}>
                  <h2>{`Card ${i + 1}`}</h2>
                  <Stack spacing={3}>
                    {cardUsers.map((user) => {
                      const { eventScore } = user

                      return (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-evenly',
                            alignItems: 'center',
                          }}
                          key={`score-${user.id}`}
                        >
                          <LastCourseTag tag={user.lastEventTag} />
                          <CurrentTag
                            user={user}
                            onCurrentTagChange={handleCurrentTagChange.bind(
                              user
                            )}
                          />{' '}
                          <Name
                            sx={{
                              flex: 1,
                            }}
                          >
                            {user.firstname} {user.lastname}
                          </Name>
                          <Score
                            sx={{
                              width: 100,
                            }}
                            userId={user.id}
                            eventScore={eventScore}
                            handleUpdateScore={handleUpdateScore}
                          />
                          <Button
                            onClick={handleRemoveUserFromEvent.bind(
                              null,
                              user.id
                            )}
                            sx={{ ml: 1 }}
                            variant="outlined"
                          >
                            {'Remove'}
                          </Button>
                        </Box>
                      )
                    })}
                  </Stack>
                </Box>
              )
            })}
          </Stack>{' '}
        </Box>
      </main>
    </Layout>
  )
}
