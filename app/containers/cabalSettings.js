import React from 'react'
import { connect } from 'react-redux'

import { hideCabalSettings, removeCabal } from '../actions'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    cabal
  }
}

const mapDispatchToProps = dispatch => ({
  hideCabalSettings: () => dispatch(hideCabalSettings()),
  removeCabal: ({ addr }) => dispatch(removeCabal({ addr }))
})

class CabalSettingsContainer extends React.Component {

  onClickCloseSettings () {
    this.props.hideCabalSettings()
  }

  removeCabal (addr) {
    this.props.removeCabal({ addr })
  }

  render () {
    return (
      <div className='client__main'>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>
                    <span onClick={this.onClickCloseSettings.bind(this)} className='cabal-settings__close'><img src='static/images/icon-composermeta.svg' /></span>
                    Settings
                  </h1>
                </div>
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
                  <button className='button' onClick={this.removeCabal.bind(this, this.props.cabal.addr)}>Remove this cabal from Cabal Desktop</button>
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
