import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
  changeScreen,
  viewCabal
} from '../actions'
import CabalsList from './cabalsList'
import ChannelPanel from './channelPanel'
import MainPanel from './mainPanel'
import ProfilePanel from './profilePanel'
import Sidebar from './sidebar'

const mapStateToProps = state => {
  const cabal = state.cabals[state.currentCabal]
  return {
    addr: state.currentCabal,
    cabal,
    cabals: state.cabals,
    channelPanelVisible: state.channelPanelVisible[state.currentCabal],
    profilePanelVisible: state.profilePanelVisible[state.currentCabal],
    profilePanelUser: state.profilePanelUser[state.currentCabal],
    settings: state.cabalSettings[cabal?.addr] || {}
  }
}

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen, addr }) => dispatch(changeScreen({ screen, addr })),
  viewCabal: ({ addr }) => dispatch(viewCabal({ addr }))
})

class LayoutScreen extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showMemberList: false
    }
    this.toggleMemberList = this.toggleMemberList.bind(this)
  }

  toggleMemberList () {
    this.setState((state) => ({
      showMemberList: !state.showMemberList
    }))
  }

  cabalsInitialized () {
    if (this.props.cabals) {
      return Object.values(this.props.cabals).every((cabal) => {
        return cabal.initialized
      })
    } else {
      return false
    }
  }

  render () {
    const { cabal, cabals, addr } = this.props
    const { enableDarkmode } = this.props.settings || {}
    // console.log('render', { cabal, cabals, addr })
    // if (!cabal || !this.cabalsInitialized()) {
    if (!cabal) {
      return (
        <div className='loading'>
          <div className='status'> </div>
          <img src='static/images/cabal-logo-black.svg' />
          <div className='status'>Loading hypercores and swarming...</div>
        </div>
      )
    }
    return (
      <div className={`client ${enableDarkmode ? 'darkmode' : ''}`}>
        <CabalsList />
        <Sidebar />
        <MainPanel toggleMemberList={this.toggleMemberList} />
        {this.props.channelPanelVisible && <ChannelPanel addr={this.props.addr} channel={cabal.channel} />}
        {this.props.profilePanelVisible && <ProfilePanel addr={this.props.addr} userKey={this.props.profilePanelUser} />}
      </div>
    )
  }
}

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
