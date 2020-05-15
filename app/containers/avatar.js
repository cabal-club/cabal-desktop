import React, { Component } from 'react'
import Identicon from 'react-blockies'

export default class Avatar extends Component {
  render () {
    return (
      <span title={this.props.name}>
        <Identicon
          seed={this.props.name}
          bgColor='#fff'
        />
      </span>
    )
  }
}
