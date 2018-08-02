import React, { Component } from 'react'
import Identicon from 'react-blockies'

export default class Avatar extends Component {
  render () {
    return (
      <div className='avatar'>
        <Identicon
          seed={this.props.name}
          bgColor='#fff'
        />
      </div>
    )
  }
}
