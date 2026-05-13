import { fireEvent, render, screen } from '@testing-library/react'
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

  expect(await screen.findByRole('heading', { name: '首页' })).toBeVisible()
})

it('switches between bottom navigation tabs', async () => {
  render(<App />)

  expect(await screen.findByRole('heading', { name: '首页' })).toBeVisible()

  fireEvent.click(screen.getByRole('button', { name: '日历' }))
  expect(screen.getByRole('heading', { level: 1 })).toBeVisible()

  fireEvent.click(screen.getByRole('button', { name: '记录' }))
  expect(screen.getByRole('heading', { name: '记录' })).toBeVisible()

  fireEvent.click(screen.getByRole('button', { name: '设置' }))
  expect(screen.getByRole('heading', { name: '设置' })).toBeVisible()
})
