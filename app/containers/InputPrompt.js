import React from 'react'
import form from 'get-form-data'

export default class InputPrompt extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showInput: false
    }
  }

  onsubmit (e) {
    e.preventDefault()
    var data = form(e.target)
    this.props.onSubmit(data.channel)
    this.setState({showInput: false})
  }

  onBlur (e) {
    this.setState({showInput: false})
  }

  onClick (e) {
    e.preventDefault()
    this.setState({showInput: true})
  }

  render () {
    var self = this
    const { showInput } = self.state
    const { placeholder, children, prompt } = self.props

    if (showInput) {
      return (
        <form className="inputprompt" onSubmit={self.onsubmit.bind(self)}>
          <input
            name='channel'
            id="add-channel"
            type="text"
            placeholder={placeholder}
            onBlur={self.onBlur.bind(self)} />
        </form>
       )
    }
    return (
      <button onClick={self.onClick.bind(self)}>{prompt}</button>
    )
  }

}
