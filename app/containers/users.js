import React, { Fragment } from 'react'

const Users = ({ users, show }) => {
  if (!show) {
    return (
      <Fragment>
        <div />
      </Fragment>
    )
  }

  if (!users || !users.length) return <div></div>

  return (
    <div>
      {Object.keys(users).map(username => (
        <div>{username}</div>
      ))}
    </div>
  )
}

export default Users
