import React, { Component } from 'react'
import { connect } from 'react-redux'

import AddCabalContainer from './containers/addCabal'
import AppSettingsContainer from './containers/appSettings'
import Layout from './containers/layout'
import { loadFromDisk } from './actions'

import './styles/react-contexify.css'
import './styles/style.scss'
import './styles/darkmode.scss'

const mapStateToProps = state => ({
  screen: state.screen
})

const mapDispatchToProps = dispatch => ({
  loadFromDisk: () => dispatch(loadFromDisk())
})

export class AppScreen extends Component {
  constructor (props) {
    super(props)
    props.loadFromDisk()
  }

  render () {
    const { screen } = this.props
    let Container = Layout
    if (screen === 'addCabal') {
      Container = AddCabalContainer
    } else if (screen === 'appSettings') {
      Container = AppSettingsContainer
    }
    return (
      <>
        <Container />
      </>
    )
  }
}

const App = connect(mapStateToProps, mapDispatchToProps)(AppScreen)

export default App
