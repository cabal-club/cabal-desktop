import React, { useState } from 'react'

const CustomLink = ({ href = '', children, ...props }) => {
  const [isTooltipDisplayed, setIsTooltipDisplayed] = useState(false)
  const [coordinates, setCoordinates] = useState({})

  const onMouseEnter = e => {
    const rect = e.target.getBoundingClientRect()
    setCoordinates({
      top: rect.y + window.scrollY,
      left: rect.x + rect.width / 2
    })

    setIsTooltipDisplayed(true)
  }
  const onMouseLeave = () => setIsTooltipDisplayed(false)

  const tooltipText = href.length > 500 ? `${href.substring(0, 500)}...` : href

  return (
    <a
      href={href}
      className='link'
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
      {isTooltipDisplayed &&
        <span className='tooltip' style={coordinates}>
          {tooltipText}
        </span>}
    </a>
  )
}

export default CustomLink
