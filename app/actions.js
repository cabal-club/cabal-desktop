import { homedir } from 'os'
import { encode } from 'dat-encoding'
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

var dir = path.join(__dirname, 'chatmesh-data')

export const viewMesh = ({addr}) => dispatch => {
  var obj = meshes[addr]
  if (obj) {
    currentMesh = obj
    dispatch({type: 'VIEW_MESH', mesh: obj.mesh})
    storeOnDisk()
  }
}

export const cancelDeleteMesh = () => ({ type: 'DIALOGS_DELETE_CLOSE' })
export const deleteMesh = addr => ({ type: 'DIALOGS_DELETE_OPEN', addr })
export const confirmDeleteMesh = addr => dispatch => {
  const { obj } = meshes[addr]

  if (obj.swarm) {
    for (const con of obj.swarm.connections) {
      con.removeAllListeners()
    }
  }
  // obj.mesh.db.close()
  delete meshes[addr]
  storeOnDisk()
  dispatch({ type: 'DELETE_MESH', addr })
  dispatch({ type: 'DIALOGS_DELETE_CLOSE' })
}

export const showAddMesh = () => ({ type: 'SHOW_ADD_MESH' })
export const hideAddMesh = () => ({ type: 'HIDE_ADD_MESH' })
export const addMesh = ({link, username}) => dispatch => {
  var addr = encode(link)
  var mesh = Mesh(path.join(dir, addr), addr, {username: username || catnames.random(), sparse: true})
  meshes[addr] = { mesh, swarm: Swarm(mesh) }
  storeOnDisk()
  dispatch({type: 'ADD_MESH', addr, mesh})
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
