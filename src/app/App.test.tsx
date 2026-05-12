import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

vi.mock('../services/storageService', () => ({
  loadAppData: vi.fn(async () => ({
    schemaVersion: 1,
    records: {
      weights: [],
      injections: []
    },
    settings: {
      unit: 'kg',
      defaultMedicineName: 'Tirzepatide'
    }
  })),
  saveAppData: vi.fn(async () => undefined)
}))

import { App } from './App'

it('renders the loaded home page', async () => {
  render(<App />)

  expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
})
