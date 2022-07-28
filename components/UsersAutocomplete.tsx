import { useState, useEffect, useMemo } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { debounce } from '@mui/material'
import { gql, useLazyQuery, useMutation } from '@apollo/client'
import { concat, pluck, includes } from 'ramda'

import CreateNewUser from './CreateNewUser'

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

export default function UsersAutocomplete({ users, eventId, eventQuery }) {
  const [options, setOptions] = useState([])
  const [value, setValue] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isAddNewUser, setIsAddNewUser] = useState(false)

  const [getUsersQuery, { loading: userLoading, data: userData }] =
    useLazyQuery(SEARCH_USERS)

  const [addUsersToEvent] = useMutation(ADD_USERS_TO_EVENT, {
    refetchQueries: [eventQuery],
  })
  const [createNewUser] = useMutation(CREATE_NEW_USER, {
    refetchQueries: [eventQuery],
  })

  const getUsers = useMemo(() => {
    return debounce((term) => {
      getUsersQuery({
        variables: {
          term,
        },
      })
    })
  }, [getUsersQuery])

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
      const selectedAndAddedUsers = concat(
        pluck('id', value),
        pluck('id', users)
      )
      const { searchUsers } = userData

      const searchOptions = searchUsers.reduce((acc, user) => {
        if (!includes(user.id, selectedAndAddedUsers)) {
          acc.push({
            label: `${user.firstname} ${user.lastname}`,
            id: user.id,
          })
        }

        return acc
      }, [])

      setOptions(searchOptions)
    }
  }, [userLoading, userData, value, users])

  function handleCreateNewPlayer() {
    setIsAddNewUser(true)
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

  return (
    <>
      <Autocomplete
        freeSolo
        multiple
        filterSelectedOptions
        autoComplete
        options={options}
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
            eventId: eventId,
            userIds: pluck('id', value),
          })}
        >
          Add Players
        </Button>
        <Button variant="contained" onClick={handleCreateNewPlayer}>
          Create New Player
        </Button>
      </Box>
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
          eventId={eventId}
        />
      </Drawer>
    </>
  )
}
