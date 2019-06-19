import React from 'react'
import { connect } from 'react-redux'

import { removeCabal } from '../actions'
import Avatar from './avatar'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    cabal
  }
}

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen }) => dispatch(changeScreen({ screen })),
  changeUsername: ({ addr, username }) => dispatch(changeUsername({ addr, username })),
  removeCabal: ({ key }) => dispatch(removeCabal({ key }))
})

class CabalSettingsContainer extends React.Component {

  removeCabal (key) {
    this.props.removeCabal({ key })
  }

  render () {
    return (
      <div className='client__main'>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>Settings</h1>
                </div>
              </div>
              <div className='channel-meta__other'>
                {/* <div className='channel-meta__other__more'><img src='static/images/icon-channelother.svg' /></div> */}
              </div>
            </div>
          </div>
          <div className='window__main'>
            <div className='window__main__content'>
              <ul>
                <li>
                  <strong>Cabal Key:</strong> cabal://{this.props.cabal.addr}
                </li>
                <li>
                  <button onClick={this.removeCabal.bind(this, this.props.cabal.addr)}>Remove this cabal from Cabal Desktop</button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const CabalSettings = connect(mapStateToProps, mapDispatchToProps)(CabalSettingsContainer)

export default CabalSettings
