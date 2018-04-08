import { homedir } from 'os'
import { decode, encode } from 'dat-encoding'
import Swarm from 'chatmesh/swarm'
import Mesh from 'chatmesh/mesh'
import catnames from 'cat-names'
import path from 'path'
import promisify from 'util-promisify'
import fs from 'fs'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

var meshes = {}
var currentMesh

export const viewMesh = ({addr}) => dispatch => {
  var mesh = meshes[addr]
  if (mesh) {
    currentMesh = mesh
    dispatch({type: 'VIEW_MESH', addr})
    //storeOnDisk()
  }
}

export const cancelDeleteMesh = () => ({ type: 'DIALOGS_DELETE_CLOSE' })
export const deleteMesh = addr => ({ type: 'DIALOGS_DELETE_OPEN', addr })
export const confirmDeleteMesh = addr => dispatch => {
  const { mesh } = meshes[addr]

  if (mesh.swarm) {
    for (const con of mesh.swarm.connections) {
      con.removeAllListeners()
    }
  }
  // obj.mesh.db.close()
  delete meshes[addr]
  //storeOnDisk()
  dispatch({ type: 'DELETE_MESH', addr })
  dispatch({ type: 'DIALOGS_DELETE_CLOSE' })
}

export const showAddMesh = () => ({ type: 'SHOW_ADD_MESH' })
export const hideAddMesh = () => ({ type: 'HIDE_ADD_MESH' })
export const addMesh = ({input, username}) => dispatch => {
  try {
    var key = decode(input)
    var addr = encode(key)
  } catch (err) {
  }
  username = username || catnames.random()

  if (meshes[addr]) return console.error('Mesh already exists')
  var mesh = Mesh(path.join(homedir(), '.chatmesh-desktop', username), addr ? 'dat://' + addr : null, {username, sparse: true})
  mesh.db.ready(function (err) {
    if (err) return console.error(err)
    if (!addr) addr = mesh.db.key.toString('hex')
    var swarm = Swarm(mesh)
    mesh.swarm = swarm
    meshes[addr] = mesh
    //storeOnDisk()
    mesh.on('join', function (username) {
      dispatch({type: 'JOIN_USER', addr, username: username})
    })
    mesh.on('leave', function (username) {
      dispatch({type: 'LEAVE_USER', addr, username})
    })
    dispatch({type: 'ADD_MESH', addr, username: mesh.username})
    dispatch({type: 'VIEW_MESH', addr})
  })
}

export const addMessage = ({ message }) => dispatch => {
  dispatch({type: 'ADD_MESSAGE', message})
  currentMesh.mesh.message(message, function (err) {
    if (err) console.log(err)
    dispatch({type: 'ADD_MESSAGE_SUCCESS', message})
  })
}

export const loadFromDisk = () => async dispatch => {
  var blob
  try {
    await mkdir(`${homedir()}/.chatmesh-desktop`)
  } catch (_) {}

  try {
    blob = await readFile(`${homedir()}/.chatmesh-desktop/meshes.json`, 'utf8')
  } catch (_) {
    return
  }

  const pastMeshes = JSON.parse(blob)

  for (const key of Object.keys(pastMeshes)) {
    const opts = JSON.parse(pastMeshes[key])
    addMesh(opts)(dispatch)
  }
}

const storeOnDisk = async () => {
  const dir = `${homedir()}/.chatmesh-desktop`
  const meshesState = Object.keys(meshes).reduce(
    (acc, key) => ({
      ...acc,
      [key]: JSON.stringify({
        username: meshes[key].mesh.username,
        addr: meshes[key].mesh.addr
      })
    }),
    {}
  )
  await writeFile(`${dir}/meshes.json`, JSON.stringify(meshesState))
}
