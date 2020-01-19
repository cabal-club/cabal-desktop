import React, { useState } from 'react'
import Modal from 'react-awesome-modal'
import Select from 'react-select/creatable'

const JoinChannelModal = ({ visible, closeModal, channels, joinChannel }) => {
  const [channel, selectChannel] = useState('')
  const channelList = channels.map(i => ({ label: i, value: i }))

  const onChange = (val) => {
    selectChannel(val.value)
  }

  const add = () => {
    if (!channel.strip()) return
    joinChannel(channel)
    hideModal()
  }

  const hideModal = () => {
    selectChannel('')
    closeModal()
  }

  return (
    <Modal visible={visible} width='50%' height='200px' effect='fadeInUp' onClickAway={closeModal}>
      <h2 className='modal___title'> join channel</h2>
      <Select options={channelList} onChange={onChange} />
      <button onClick={add}> Join</button>
      <button onClick={hideModal}> Cancel </button>
    </Modal>
  )
}

export default JoinChannelModal
