import { homedir } from 'os'
import { decode, encode } from 'dat-encoding'
import to from 'to2'
import pump from 'pump'
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
  var dir = path.join(homedir(), '.chatmesh-desktop', addr || username)
  var mesh = Mesh(dir, addr ? 'dat://' + addr : null, {username})
  mesh.db.ready(function (err) {
    if (err) return console.error(err)
    if (!addr) addr = mesh.db.key.toString('hex')
    var swarm = Swarm(mesh)
    mesh.swarm = swarm
    meshes[addr] = mesh
    //storeOnDisk()
    mesh.on('join', function (username) {
      dispatch({type: 'MESH_USERS', addr, users: mesh.users})
    })
    mesh.on('leave', function (username) {
      dispatch({type: 'MESH_USERS', addr, users: mesh.users})
    })
    dispatch({type: 'ADD_MESH', addr, username: mesh.username})
    dispatch({type: 'VIEW_MESH', addr})

    pump(mesh.db.createHistoryStream(), to.obj(
      function (row, enc, next) {
        writeMsg(row)
        next()
      },
      function (next) {
        mesh.db.on('remote-update', onappend)
        mesh.db.on('append', onappend)
        function onappend (feed) {
          var h = mesh.db.createHistoryStream({ reverse: true })
          pump(h, to.obj(function (row, enc, next) {
            writeMsg(row)
            h.destroy()
          }))
        }
        next()
      }
    ), function (err) {
      if (err) console.error(err)
    })

    function writeMsg (row) {
      var m
      if (row.value) console.log('got', row)
      if (row.value && (m=/^chat\/([^\/]+)@/.exec(row.key))) {
        var utcDate = new Date(m[1])
        dispatch({type: 'ADD_LINE', addr, utcDate, row})
      }
      next()
    }
  })
}

export const addMessage = ({ message }) => dispatch => {
  currentMesh.mesh.message(message, function (err) {
    if (err) console.log(err)
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
