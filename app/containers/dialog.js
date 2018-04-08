import {
  confirmDeleteMesh,
  cancelDeleteMesh
} from '../actions'
import { connect } from 'react-redux'

export const ConfirmContainer = connect(
  state => ({
    mesh: state.dialogs.delete.mesh
  }),
  dispatch => ({
    onConfirm: addr => dispatch(confirmDeleteMesh(addr)),
    onExit: () => dispatch(cancelDeleteMesh())
  })
)(Confirm)

const Confirm = ({ addr, onConfirm, onExit }) => (
  <div
    className='modal fixed items-center justify-center top-0 left-0 h-100 w-100 z-9999'
    style={{ display: addr ? 'flex' : 'none' }}>
    <div className='relative flex flex-column justify-center'>
      <h3 className='f4'>Leave Mesh </h3>
      <p className='mt3 mb4 f7 color-neutral-70'>
        Are you sure you want to leave this mesh?
        <br />
        This can’t be undone.
      </p>
      <p>
        <button
          className='fr ml3 confirm-button'
          onClick={() => onConfirm(addr)}
        >
          Yes, Leave Mesh
        </button>
        <button className='fr cancel-button' onClick={onExit} autoFocus>
          No, Cancel
        </button>
      </p>
      <button
        onClick={onExit}
        className='absolute pointer pa0 top-0 right-0 h2 w2 bg-transparent tc exit'
        aria-label='Close Modal' />
    </div>
  </div>

)
