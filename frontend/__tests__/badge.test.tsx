import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '@/components/ui/badge'

describe('<Badge />', () => {
  it('renders children', () => {
    render(<Badge>new</Badge>)
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('merges custom className', () => {
    render(<Badge className="custom-cls">x</Badge>)
    expect(screen.getByText('x').className).toMatch(/custom-cls/)
  })
})
