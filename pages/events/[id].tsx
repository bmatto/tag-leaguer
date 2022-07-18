import { useMutation, useLazyQuery, gql } from '@apollo/client'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, useRef } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'

import { debounce } from '@mui/material'
import { pluck, path } from 'ramda'

import EVENT_QUERY from '../../graphql/queries/event.graphql'
import { serverClient } from '../../graphql/client'
import Layout from '../../components/Layout'
import CreateNewUser from '../../components/CreateNewUser'

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

function Score({ sx, eventScore }) {
  const maybeStrokes = eventScore ? eventScore.strokes : ''
  const [strokes, setStrokes] = useState(maybeStrokes)

  return (
    <TextField
      sx={{
        ...sx,
      }}
      onChange={(event) => {
        setStrokes(event.target.value)
      }}
      type="number"
      variant="standard"
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      value={strokes}
    />
  )
}

function CurrentTag({ tag }) {
  const [currentTag, setCurrentTag] = useState((tag && tag.number) || '')

  function handleCurrentTagChange(event) {
    setCurrentTag(event.target.value)
  }

  return (
    <TextField
      sx={{ width: 40 }}
      type="number"
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      variant="standard"
      value={currentTag}
      onChange={handleCurrentTagChange}
    />
  )
}

const SEARCH_USERS = gql`
  query SearchUsers($term: String) {
    searchUsers(term: $term) {
      id
      email
      firstname
      lastname
    }
  }
`

const DELETE_EVENT_MUTATION = gql`
  mutation DeleteEvent($eventId: ID!) {
    deleteEvent(eventId: $eventId) {
      id
      title
    }
  }
`

const ADD_USERS_TO_EVENT = gql`
  mutation AddUsersToEvent($UsersEventInput: UsersEventInput!) {
    addUsersToEvent(input: $UsersEventInput) {
      firstname
      lastname
      id
    }
  }
`

const CREATE_NEW_USER = gql`
  mutation CreateNewUser($CreateNewUserInput: CreateNewUserInput!) {
    createNewUser(input: $CreateNewUserInput) {
      firstname
      lastname
      id
    }
  }
`

const REMOVE_USER_FROM_EVENT = gql`
  mutation RemoveUserFromEvent($eventId: ID!, $userId: ID!) {
    removeUserFromEvent(userId: $userId, eventId: $eventId)
  }
`

export async function getServerSideProps({ params }) {
  const { id: eventId } = params

  let query

  try {
    query = await serverClient.query({
      query: EVENT_QUERY,
      variables: {
        eventId: eventId,
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

export default function Event({ event: initialEvent }) {
  const [event, setEvent] = useState(initialEvent)
  const [isAddNewUser, setIsAddNewUser] = useState(false)
  const [options, setOptions] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [value, setValue] = useState([])

  const router = useRouter()

  const eventId = useRef(event.id)

  const [deleteEvent, { loading: loadingDeleteEvent }] = useMutation(
    DELETE_EVENT_MUTATION
  )

  const [getEventQuery, { loading: eventLoading, data: eventData }] =
    useLazyQuery(EVENT_QUERY, {
      fetchPolicy: 'network-only',
    })
  const [getUsersQuery, { loading: userLoading, data: userData }] =
    useLazyQuery(SEARCH_USERS)

  const [
    removeUserFromEvent,
    { loading: removeUserFromEventLoading, data: removeUserFromEventData },
  ] = useMutation(REMOVE_USER_FROM_EVENT)
  const [addUsersToEvent, { loading: loadingAddUsersToEvent }] =
    useMutation(ADD_USERS_TO_EVENT)
  const [
    createNewUser,
    { loading: createNewUserLoading, data: createNewUserData },
  ] = useMutation(CREATE_NEW_USER)

  const getUsers = useMemo(() => {
    return debounce((term) => {
      getUsersQuery({
        variables: {
          term,
        },
      })
    })
  }, [getUsersQuery])

  function handleDelete() {
    deleteEvent({
      variables: {
        eventId: event.id,
      },
    })
    if (!loadingDeleteEvent) {
      router.replace(`/courses/${event.course.id}`)
    }
  }

  function handleAddPlayerClick(usersEventInput) {
    addUsersToEvent({
      variables: {
        UsersEventInput: usersEventInput,
      },
    })
    setValue([])
  }

  function handleCreateNewUserSubmit(newUser, event) {
    event.preventDefault()

    createNewUser({
      variables: {
        CreateNewUserInput: newUser,
      },
    })

    setIsAddNewUser(false)
    return false
  }

  function handleCreateNewPlayer() {
    setIsAddNewUser(true)
  }

  function handleRemoveUserFromEvent(userId) {
    removeUserFromEvent({
      variables: {
        userId,
        eventId: event.id,
      },
    })
  }

  useEffect(() => {
    if (inputValue === '') {
      setOptions([])
      return undefined
    }

    getUsers(inputValue)
  }, [inputValue, getUsers])

  // Handle Users Loaded For AutoComplete
  useEffect(() => {
    if (!userLoading && userData) {
      const { searchUsers } = userData
      const userOptions = searchUsers.map((user) => ({
        label: `${user.firstname} ${user.lastname}`,
        id: user.id,
      }))

      setOptions(userOptions)
    }
  }, [userLoading, userData])

  // Handle New Event Loaded
  useEffect(() => {
    if (!eventLoading && eventData) {
      setEvent(eventData.event)
    }
  }, [eventLoading, eventData])

  // Handle New User Created
  useEffect(() => {
    const newUserCreated = !createNewUserLoading && createNewUserData
    const userRemoved =
      !removeUserFromEventLoading &&
      path(['removeUserFromEvent'], removeUserFromEventData) === true

    if (newUserCreated || userRemoved) {
      console.log('re query for users')
      getEventQuery({
        variables: {
          eventId: eventId.current,
        },
      })
    }
  }, [
    createNewUserLoading,
    createNewUserData,
    removeUserFromEventLoading,
    removeUserFromEventData,
    getEventQuery,
  ])

  return (
    <Layout>
      <main>
        <h1>
          {event.title} at {event.course.name}
        </h1>
        <p>{new Date(parseInt(event.date)).toDateString()}</p>
        {/* <button onClick={handleDelete}>Delete Event</button> */}
        <Autocomplete
          freeSolo
          multiple
          options={options}
          sx={{ width: 300 }}
          filterOptions={(x) => x}
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue)
          }}
          onInputChange={(event, newValue) => {
            setInputValue(newValue)
          }}
          renderInput={(params) => (
            <TextField {...params} label="Find Players" fullWidth />
          )}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={value.length === 0}
            variant="contained"
            onClick={handleAddPlayerClick.bind(null, {
              eventId: event.id,
              userIds: pluck('id', value),
            })}
          >
            Add Players
          </Button>
          <Button variant="contained" onClick={handleCreateNewPlayer}>
            Create New Player
          </Button>
        </Box>

        <Box
          sx={{
            mt: 2,
            mb: 2,
          }}
        >
          <Stack spacing={3}>
            {event.users.map((user) => {
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
                  <CurrentTag tag={user.lastEventTag} />
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
                    eventScore={eventScore}
                  />
                  <Button
                    onClick={handleRemoveUserFromEvent.bind(null, user.id)}
                    sx={{ ml: 1 }}
                    variant="outlined"
                  >
                    {'Remove'}
                  </Button>
                </Box>
              )
            })}
          </Stack>{' '}
        </Box>
      </main>
      <Drawer
        sx={{
          width: 300,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 300,
            boxSizing: 'border-box',
          },
        }}
        open={isAddNewUser}
        onClose={() => {
          setIsAddNewUser(false)
        }}
      >
        <CreateNewUser
          handleCreateNewUserSubmit={handleCreateNewUserSubmit}
          eventId={event.id}
        />
      </Drawer>
    </Layout>
  )
}
