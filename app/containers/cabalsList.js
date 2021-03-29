import React from 'react'
import { connect } from 'react-redux'
import platform from '../platform'

import { viewCabal, changeScreen } from '../actions'

const mapStateToProps = state => {
  const cabal = state.cabals[state.currentCabal]
  const addr = cabal.addr
  return {
    addr,
    cabals: state.cabals,
    cabal,
    settings: state.cabalSettings || {},
    username: cabal.username
  }
}

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen }) => dispatch(changeScreen({ screen })),
  viewCabal: ({ addr }) => dispatch(viewCabal({ addr }))
})

class CabalsListScreen extends React.Component {
  joinCabal () {
    this.props.changeScreen({ screen: 'addCabal' })
  }

  openSettings () {
    this.props.changeScreen({ screen: 'appSettings' })
  }

  selectCabal (addr) {
    this.props.viewCabal({ addr })
  }

  render () {
    var self = this
    var { addr, cabals, settings } = this.props
    cabals = cabals || {}
    var cabalKeys = (Object.keys(cabals) || []).sort()
    var className = [
      'client__cabals', 
      ...(platform.mac? ['client__cabals__mac'] : [])
    ].join(' ')
    return (
      <div className={className}>
        <div className='switcher'>
          {cabalKeys.map(function (key) {
            var cabal = cabals[key]
            if (cabal) {
              return (
                <div title={key} key={key} onClick={self.selectCabal.bind(self, key)} className={addr === cabal.addr ? 'switcher__item switcher__item--active' : 'switcher__item'}>
                  <span>
                    {(settings[key]?.alias || key).slice(0, 2)}
                  </span>
                  {cabal.allChannelsUnreadCount > 0 && <div className='unreadIndicator' />}
                </div>
              )
            }
          })}
          <div className='switcher__item --addnew' title='Join or Create A Cabal' onClick={self.joinCabal.bind(self)}>
            <img src='static/images/icon-newchannel.svg' />
          </div>
        </div>
        {/* <div className='client__cabals__footer'>
          <div className='switcher__item settingsButton' title='Application Settings' onClick={self.openSettings.bind(self)}>
            <img src='static/images/icon-gear.svg' />
          </div>
        </div> */}
      </div>
    )
  }
}

const CabalsList = connect(mapStateToProps, mapDispatchToProps)(CabalsListScreen)

export default CabalsList
