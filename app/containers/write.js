import styled from 'styled-components'
import form from 'get-form-data'
import ReactDOM from 'react-dom'
import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { addMessage } from '../actions'

var WriteDiv = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: wheat;
  input {
    padding: 5px;
    width: 90%;
    margin: 5px;
  }
`

const mapStateToProps = state => ({
  show: state.screen === 'main',
  addr: state.currentCabal,
  cabal: state.cabales[state.currentCabal]
})

const mapDispatchToProps = dispatch => ({
  addMessage: ({addr, message}) => dispatch(addMessage({addr, message}))
})

class writeScreen extends Component {
  constructor (props) {
    super(props)
    this.minimumHeight = 48
    this.defaultHeight = 17 + this.minimumHeight
  }

  onsubmit (e) {
    const data = form(e.target)
    var el = document.querySelector('#message-bar')
    el.value = ''
    const {addr, addMessage} = this.props
    addMessage({message: data.message, addr})
    e.preventDefault()
    e.stopPropagation()
  }

  componentWillMount () {
    window.addEventListener('keydown', this.onkeydown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.onkeydown)
  }

  render () {
    const { cabal, show, addr } = this.props

    if (!show || !cabal) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    return (
      <form onSubmit={this.onsubmit.bind(this)}>
        <input type='text'
          id='message-bar'
          name='message'
          className='fun composer'
          aria-label="Enter a message and press enter"
          placeholder='' />
      </form>
    )
  }
}

const WriteContainer = connect(mapStateToProps, mapDispatchToProps)(writeScreen)

export default WriteContainer
