import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import RutaProtegida from './RutaProtegida'
import { obtenerRolSesion } from './sesion'

vi.mock('./sesion', () => ({ obtenerRolSesion: vi.fn() }))

function renderProtegida() {
  const router = createMemoryRouter([
    {
      element: <RutaProtegida rolesPermitidos={['ANFITRION']} />,
      children: [{ path: '/', element: <p>Contenido</p> }],
    },
  ])
  render(<RouterProvider router={router} />)
}

describe('RutaProtegida', () => {
  it('deja pasar mientras no se conoce el rol', () => {
    vi.mocked(obtenerRolSesion).mockReturnValue(null)
    renderProtegida()

    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('deja pasar a un rol permitido', () => {
    vi.mocked(obtenerRolSesion).mockReturnValue('ANFITRION')
    renderProtegida()

    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('bloquea a un rol no permitido', () => {
    vi.mocked(obtenerRolSesion).mockReturnValue('HUESPED')
    renderProtegida()

    expect(
      screen.getByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })
})
