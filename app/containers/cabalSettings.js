import React from 'react'
import { connect } from 'react-redux'
import { clipboard } from 'electron'

import { hideCabalSettings, removeCabal, saveCabalSettings } from '../actions'

const mapStateToProps = state => {
  var cabal = state.cabals[state.currentCabal]
  return {
    cabal,
    settings: state.cabalSettings[cabal.addr] || {}
  }
}

const mapDispatchToProps = dispatch => ({
  hideCabalSettings: () => dispatch(hideCabalSettings()),
  removeCabal: ({ addr }) => dispatch(removeCabal({ addr })),
  saveCabalSettings: ({ addr, settings }) => dispatch(saveCabalSettings({ addr, settings }))
})

class CabalSettingsContainer extends React.Component {
  onClickCloseSettings () {
    this.props.hideCabalSettings()
  }

  onToggleOption (option) {
    const settings = this.props.settings
    settings[option] = !this.props.settings[option]
    this.props.saveCabalSettings({ addr: this.props.cabal.addr, settings })
  }

  onClickCopyCode () {
    clipboard.writeText('cabal://' + this.props.cabal.addr)
    window.alert(
      'Copied code to clipboard! Now give it to people you want to join your Cabal. Only people with the link can join.'
    )
  }

  removeCabal (addr) {
    this.props.removeCabal({ addr })
  }

  render () {
    const { enableNotifications, alias } = this.props.settings || {}

    return (
      <div className='client__main'>
        <div className='window'>
          <div className='window__header'>
            <div className='channel-meta'>
              <div className='channel-meta__data'>
                <div className='channel-meta__data__details'>
                  <h1>
                    Settings
                    <span onClick={this.onClickCloseSettings.bind(this)} className='cabal-settings__close'><img src='static/images/icon-composermeta.svg' /></span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className='window__main'>
            <div className='window__main__content'>
              <div className='cabal-settings__item'>
                <div className='cabal-settings__item-label'>
                  <div className='cabal-settings__item-label-title'>Invite People</div>
                  <div className='cabal-settings__item-label-description'>Share this key with others to let them join the cabal.</div>
                </div>
                <div className='cabal-settings__item-input cabalKey'>
                  <input type='text' value={`cabal://${this.props.cabal.addr}`} readOnly />
                  <button
                    className='button invite'
                    onClick={this.onClickCopyCode.bind(this)}
                  >
                    Copy Key
                  </button>
                </div>
              </div>
              <div className='cabal-settings__item'>
                <div className='cabal-settings__item-label'>
                  <div className='cabal-settings__item-label-title'>Cabal Name</div>
                  <div className='cabal-settings__item-label-description'>Set a local name for this cabal. Only you can see this.</div>
                </div>
                <div className='cabal-settings__item-input'>
                  <input type='text' placeholder='My Favorite Cabal' value={alias} onChange={(e) => this.props.saveCabalSettings({ addr: this.props.cabal.addr, settings: { ...this.props.settings, alias: e.target.value } })} />
                </div>
              </div>
              <div className='cabal-settings__item' onClick={this.onToggleOption.bind(this, 'enableNotifications')}>
                <div className='cabal-settings__item-row'>
                  <div className='cabal-settings__item-checkbox'>
                    <input type='checkbox' checked={this.props.settings && !!enableNotifications} onChange={() => { }} />
                  </div>
                  <div className='cabal-settings__item-label'>
                    <div className='cabal-settings__item-label-title'>Enable desktop notifications</div>
                    <div className='cabal-settings__item-label-description'>Display a notification for new messages for this cabal when a channel is in the background.</div>
                  </div>
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
