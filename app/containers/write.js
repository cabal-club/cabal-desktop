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
  addr: state.currentMesh,
  mesh: state.meshes[state.currentMesh]
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
    e.target.value = ''
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
    const { mesh, show, addr } = this.props

    if (!show || !mesh) {
      return (
        <Fragment>
          <div />
        </Fragment>
      )
    }
    return (
      <form onSubmit={this.onsubmit.bind(this)}>
        <input type='text'
          name='message'
          className='composer'
          aria-label="Enter a message and press enter"
          placeholder='' />
      </form>
    )
  }
}

const WriteContainer = connect(mapStateToProps, mapDispatchToProps)(writeScreen)

export default WriteContainer
