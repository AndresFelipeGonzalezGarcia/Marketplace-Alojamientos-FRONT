import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('routes', () => {
  it('muestra la página de inicio en /', () => {
    renderAt('/')

    expect(
      screen.getByRole('heading', { name: 'Marketplace de Alojamientos' }),
    ).toBeInTheDocument()
  })

  it('muestra el formulario de registro en /registro', () => {
    renderAt('/registro')

    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' }),
    ).toBeInTheDocument()
  })

  it('permite volver al inicio desde una ruta inexistente', async () => {
    renderAt('/ruta-inexistente')

    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Marketplace de Alojamientos',
      }),
    ).toBeInTheDocument()
  })
})
