import React, { Fragment } from 'react'
import AddMeshContainer from './containers/addMesh'
import MessagesContainer from './containers/messages'
import WriteContainer from './containers/write'
// import UsersContainer from './containers/users'
// import MeshesContainer from './containers/meshes'
import * as Dialog from './containers/dialog'

const App = () => (
  <Fragment>
    <Dialog.ConfirmContainer />
    <AddMeshContainer />
    <MessagesContainer />
    <WriteContainer />
  </Fragment>
)

export default App
