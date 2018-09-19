import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'

import AddCabalContainer from './containers/addCabal'
import AppSettingsContainer from './containers/settings'
import Layout from './containers/layout'
import { loadFromDisk } from './actions'

import styles from './styles/style.scss'

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
      <Fragment>
        <Container />
      </Fragment>
    )
  }
}

const App = connect(mapStateToProps, mapDispatchToProps)(AppScreen)

export default App
