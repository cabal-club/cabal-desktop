import React, { Fragment } from 'react'

const Cabales = ({ cabales, show }) => {
  if (!show) {
    return (
      <Fragment>
        <div />
      </Fragment>
    )
  }

  if (!cabales || !cabales.length) return <div></div>

  return (
    <div>
      {Object.keys(cabales).map(addr => {
        // var obj = cabales[addr]
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

export default Cabales
