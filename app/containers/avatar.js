import React, { Component } from 'react'
import Identicon from 'react-blockies'

export default class Avatar extends Component {
  render () {
    return (
      <span title={this.props.name} className={this.props.className}>
        <Identicon
          bgColor='#fff'
          scale={this.props.scale}
          seed={this.props.name || ''}
        />
      </span>
    )
  }
}
