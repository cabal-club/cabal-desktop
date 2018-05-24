import React, { Fragment } from 'react'

const Cabals = ({ cabals, show }) => {
  if (!show) {
    return (
      <Fragment>
        <div />
      </Fragment>
    )
  }

  if (!cabals || !cabals.length) return <div></div>

  return (
    <div>
      {Object.keys(cabals).map(addr => {
        // var obj = cabals[addr]
        // var swarm = obj.swarm
        // var cabal = obj.cabal
        // TODO: stats?
        return (
          <div>{addr}</div>
        )
      })}
    </div>
  )
}

export default Cabals
