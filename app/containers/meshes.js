import React, { Fragment } from 'react'

const Meshes = ({ meshes, show }) => {
  if (!show) {
    return (
      <Fragment>
        <div />
      </Fragment>
    )
  }

  if (!meshes || !meshes.length) return <div></div>

  return (
    <div>
      {Object.keys(meshes).map(addr => {
        // var obj = meshes[addr]
        // var swarm = obj.swarm
        // var mesh = obj.mesh
        // TODO: stats?
        return (
          <div>{addr}</div>
        )
      })}
    </div>
  )
}

export default Meshes
