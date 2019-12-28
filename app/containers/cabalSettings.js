import React from 'react'
import { connect } from 'react-redux'

import { hideCabalSettings, removeCabal, saveCabalSettings } from '../actions'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    cabal,
    settings: cabal.settings
  }
}

const mapDispatchToProps = dispatch => ({
  hideCabalSettings: () => dispatch(hideCabalSettings()),
  removeCabal: ({ addr }) => dispatch(removeCabal({ addr })),
  saveCabalSettings: ({ addr, settings }) => dispatch(saveCabalSettings({ addr, settings }))
})

class CabalSettingsContainer extends React.Component {
  onClickCloseSettings() {
    this.props.hideCabalSettings()
  }

  onToggleOption(option) {
    let settings = this.props.settings
    settings[option] = !this.props.settings[option]
    this.props.saveCabalSettings({ addr: this.props.cabal.addr, settings })
  }

  removeCabal(addr) {
    this.props.removeCabal({ addr })
  }

  render() {
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
              <div className='cabal-settings__item' onClick={this.onToggleOption.bind(this, 'enableNotifications')}>
                <div className='cabal-settings__item-row'>
                  <div className='cabal-settings__item-checkbox'>
                    <input type='checkbox' checked={!!this.props.settings.enableNotifications} onChange={() => { }} />
                  </div>
                  <div className='cabal-settings__item-label'>
                    <div className='cabal-settings__item-label-title'>Enable desktop notifications</div>
                    <div className='cabal-settings__item-label-description'>Display a notification for new messages for this cabal when a channel is in the background.</div>
                  </div>
                </div>
              </div>
              <div className='cabal-settings__item'>
                <div className='cabal-settings__item-label'>
                  <div className='cabal-settings__item-label-title'>Cabal Key</div>
                  <div className='cabal-settings__item-label-description'>Share this key with others to let them join the cabal.</div>
                </div>
                <div className='cabal-settings__item-input'>
                  <input type='text' value={`cabal://${this.props.cabal.addr}`} readOnly />
                </div>
              </div>
              <div className='cabal-settings__item'>
                <div className='cabal-settings__item-label'>
                  <div className='cabal-settings__item-label-title'>Cabal Alias</div>
                  <div className='cabal-settings__item-label-description'>Set a local alias for this cabal.</div>
                </div>
                <div className='cabal-settings__item-input'>
                  <input type='text' placeholder='My Favorite Cabal' value={this.props.settings.alias} onChange={(e) => this.props.saveCabalSettings({ addr: this.props.cabal.addr, settings: { ...this.props.cabal.settings, alias: e.target.value } })} />
                </div>
              </div>
              <div className='cabal-settings__item'>
                <div className='cabal-settings__item-label'>
                  <div className='cabal-settings__item-label-title'>Remove this cabal from this Cabal Desktop client</div>
                  <div className='cabal-settings__item-label-description'>The local cabal database will remain and may also exist on peer clients.</div>
                </div>
                <div className='cabal-settings__item-input'>
                  <button className='button' onClick={this.removeCabal.bind(this, this.props.cabal.addr)}>Remove Cabal ({this.props.cabal.addr.substr(0, 8)}...)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const CabalSettings = connect(mapStateToProps, mapDispatchToProps)(CabalSettingsContainer)

export default CabalSettings
