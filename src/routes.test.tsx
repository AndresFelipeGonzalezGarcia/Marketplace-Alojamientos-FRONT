import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { routes } from './routes'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
}

describe('routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('muestra el formulario de nueva publicación', () => {
    vi.stubEnv('VITE_API_URL', '')
    renderAt('/publicaciones/nueva')

    expect(
      screen.getByRole('heading', { name: 'Nueva publicación' }),
    ).toBeInTheDocument()
  })

  it('abre la ruta de disponibilidad de una publicación', async () => {
    vi.stubEnv('VITE_API_URL', '')
    renderAt('/publicaciones/7/disponibilidad')

    expect(
      await screen.findByRole('heading', {
        name: 'No pudimos cargar la disponibilidad',
      }),
    ).toBeInTheDocument()
  })

  it('abre la ruta de edición de una publicación', async () => {
    vi.stubEnv('VITE_API_URL', '')
    renderAt('/publicaciones/7/editar')

    expect(
      await screen.findByRole('heading', {
        name: 'No pudimos cargar la publicación',
      }),
    ).toBeInTheDocument()
  })

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
