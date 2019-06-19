import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'

import { changeScreen, viewCabal } from '../actions'
import CabalsList from './cabalsList'
import Sidebar from './sidebar'
import MainPanel from './mainPanel'

const mapStateToProps = state => ({
  addr: state.currentCabal,
  cabal: state.cabals[state.currentCabal],
  cabals: state.cabals
})

const mapDispatchToProps = dispatch => ({
  changeScreen: ({ screen, addr }) => dispatch(changeScreen({ screen, addr })),
  viewCabal: ({ addr }) => dispatch(viewCabal({ addr }))
})

class LayoutScreen extends Component {
  constructor (props) {
    super(props)
    this.state = { showEmojiPicker: false }
    this.toggleEmoji = this.toggleEmoji.bind(this)
  }

  toggleEmoji (bool) {
    this.setState({ showEmojiPicker: bool === false ? false : !this.state.showEmojiPicker })
  }

  render () {
    const { cabal } = this.props
    var self = this

    if (!cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }

    var onscroll = (event) => {
      var node = event.target
      if (node.scrollHeight <= node.clientHeight + node.scrollTop) {
        self.shouldAutoScroll = true
      } else {
        self.shouldAutoScroll = false
      }
    }

    return (
      <div className='client'>
        <CabalsList toggleEmojis={this.toggleEmoji} />
        <Sidebar toggleEmojis={this.toggleEmoji} />
        <MainPanel toggleEmojis={this.toggleEmoji} />
      </div>
    )
  }
}

const Layout = connect(mapStateToProps, mapDispatchToProps)(LayoutScreen)

export default Layout
