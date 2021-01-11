import React from 'react'

const CustomLink = ({ href = '', children, ...props }) => {
  return (
    <a
      href={href}
      className='link'
      {...props}
    >
      {children}
    </a>
  )
}

export default CustomLink
