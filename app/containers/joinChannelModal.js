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
    if (!channel.trim()) return
    joinChannel(channel)
    hideModal()
  }

  const hideModal = () => {
    selectChannel('')
    closeModal()
  }

  return (
    <Modal visible={visible} width='500px' className='joinChannelModal' onClickAway={closeModal}>
      <h2 className='modal___title'> JOIN CHANNEL</h2>
      <div className='modal__body'>
        <Select options={channelList} onChange={onChange} className='modal__select' />
        <button className='modal__button green' onClick={add}> Join</button>
        <button className='modal__button red' onClick={hideModal}> Cancel </button>
      </div>
    </Modal>
  )
}

export default JoinChannelModal
