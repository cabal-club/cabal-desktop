import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'

import AddCabalContainer from './containers/addCabal'
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
    const {screen} = this.props
    return (
      <Fragment>
        {screen === 'addCabal'
          ? <AddCabalContainer />
          : <Layout />
        }
      </Fragment>
    )
  }
}

const App = connect(mapStateToProps, mapDispatchToProps)(AppScreen)

export default App
