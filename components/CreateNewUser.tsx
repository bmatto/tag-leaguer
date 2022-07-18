import { useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

export default function CreateNewUser(props) {
  const { handleCreateNewUserSubmit, eventId } = props
  const [newUser, setNewUser] = useState({
    firstname: '',
    lastname: '',
    email: '',
    eventId: eventId,
  })

  function handleFormFieldChange(event) {
    setNewUser({
      ...newUser,
      [event.target.name]: event.target.value,
    })
  }

  function handleAddToEventChange(event) {
    setNewUser({
      ...newUser,
      eventId: event.target.checked ? eventId : undefined,
    })
  }

  return (
    <form
      onSubmit={handleCreateNewUserSubmit.bind(null, newUser)}
      name="create-new-user"
    >
      <Stack
        sx={{
          p: 2,
        }}
        spacing={2}
      >
        <TextField
          onChange={handleFormFieldChange}
          required
          fullWidth
          id="standard-required"
          label="First Name"
          name="firstname"
          variant="standard"
          value={newUser.firstname}
        />
        <TextField
          onChange={handleFormFieldChange}
          required
          fullWidth
          id="standard-required"
          label="Last Name"
          name="lastname"
          variant="standard"
          value={newUser.lastname}
        />
        <TextField
          onChange={handleFormFieldChange}
          fullWidth
          id="standard-required"
          label="Email"
          name="email"
          variant="standard"
          value={newUser.email}
        />
        <FormGroup>
          <FormControlLabel
            label="Add to Event"
            control={
              <Checkbox
                onChange={handleAddToEventChange}
                name="addtoevent"
                defaultChecked
              />
            }
          />
          <Button type="submit" variant="contained">
            Save
          </Button>{' '}
        </FormGroup>
      </Stack>
    </form>
  )
}
