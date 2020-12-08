import React, { useState } from 'react'
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
import { cabalSettingsSelector, isCabalsInitializedSelector } from '../selectors'



function LayoutScreen(props) {
  const [showMemberList, setShowMemberList] = useState(false)

  const toggleMemberList = () => {
    setShowMemberList(
      !showMemberList
    )
  }

  if (!props.cabalInitialized) {
    return (
      <div className='loading'>
        <div className='status'> </div>
        <img src='static/images/cabal-logo-white.svg' />
        <div className='status'>Loading hypercores and swarming...</div>
      </div>
    )
  }

  return (
    <div className={`client ${props.darkMode ? 'darkmode' : ''}`}>
      <CabalsList />
      <Sidebar />
      <MainPanel toggleMemberList={toggleMemberList} />
      {props.channelPanelVisible && <ChannelPanel addr={props.addr} />}
      {props.profilePanelVisible && <ProfilePanel addr={props.addr} userKey={props.profilePanelUser} />}
    </div>
  )
}

const mapStateToProps = state => {
  return {
    addr: state.currentCabal,
    cabalInitialized: isCabalsInitializedSelector(state),
    channelPanelVisible: state.channelPanelVisible[state.currentCabal],
    profilePanelVisible: state.profilePanelVisible[state.currentCabal],
    profilePanelUser: state.profilePanelUser[state.currentCabal],
    settings: cabalSettingsSelector(state),
    darkMode: state?.globalSettings?.darkMode || false
  }
}

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen, addr }) => dispatch(changeScreen({ screen, addr })),
  viewCabal: ({ addr }) => dispatch(viewCabal({ addr }))
})

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
