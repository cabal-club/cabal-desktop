import React from 'react'
import {
  confirmDeleteCabal,
  cancelDeleteCabal
} from '../actions'
import { connect } from 'react-redux'

const Confirm = ({ addr, onConfirm, onExit }) => (
  <div
    className='modal fixed items-center justify-center top-0 left-0 h-100 w-100 z-9999'
    style={{ display: addr ? 'flex' : 'none' }}
  >
    <div className='relative flex flex-column justify-center'>
      <h3 className='f4'>Leave Cabal </h3>
      <p className='mt3 mb4 f7 color-neutral-70'>
        Are you sure you want to leave this cabal?
        <br />
        This can’t be undone.
      </p>
      <p>
        <button
          className='fr ml3 confirm-button'
          onClick={() => onConfirm(addr)}
        >
          Yes, Leave Cabal
        </button>
        <button className='fr cancel-button' onClick={onExit} autoFocus>
          No, Cancel
        </button>
      </p>
      <button
        onClick={onExit}
        className='absolute pointer pa0 top-0 right-0 h2 w2 bg-transparent tc exit'
        aria-label='Close Modal'
      />
    </div>
  </div>

)

export const ConfirmContainer = connect(
  state => ({
    cabal: state.dialogs.delete.cabal
  }),
  dispatch => ({
    onConfirm: addr => dispatch(confirmDeleteCabal(addr)),
    onExit: () => dispatch(cancelDeleteCabal())
  })
)(Confirm)
