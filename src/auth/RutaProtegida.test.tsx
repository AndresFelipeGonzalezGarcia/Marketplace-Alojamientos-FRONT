import { act, render, screen } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import RutaProtegida from './RutaProtegida'
import { invalidarSesion, limpiarSesion, type RolUsuario } from './sesion'

function EstadoLogin() {
  const location = useLocation()
  return <pre data-testid="estado-login">{JSON.stringify(location.state)}</pre>
}

function renderProtegida(
  rolesPermitidos: RolUsuario[],
  ruta = '/privada?pestana=2',
) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <h1>Inicio</h1> },
      { path: '/login', element: <EstadoLogin /> },
      {
        element: <RutaProtegida rolesPermitidos={rolesPermitidos} />,
        children: [{ path: '/privada', element: <p>Contenido</p> }],
      },
    ],
    { initialEntries: [ruta] },
  )
  render(<RouterProvider router={router} />)
  return router
}

function estadoLogin() {
  return JSON.parse(screen.getByTestId('estado-login').textContent ?? 'null')
}

afterEach(() => {
  vi.useRealTimers()
})

describe('RutaProtegida', () => {
  it('sin sesión redirige a /login recordando a dónde iba', () => {
    const router = renderProtegida(['ANFITRION'])

    expect(router.state.location.pathname).toBe('/login')
    expect(estadoLogin()).toEqual({ desde: '/privada?pestana=2' })
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })

  const CASOS: [RolUsuario[], RolUsuario, boolean][] = [
    [['ANFITRION'], 'ANFITRION', true],
    [['ANFITRION'], 'HUESPED', false],
    [['ANFITRION'], 'ADMINISTRADOR', false],
    [['ADMINISTRADOR'], 'ADMINISTRADOR', true],
    [['ADMINISTRADOR'], 'ANFITRION', false],
    [['ADMINISTRADOR'], 'HUESPED', false],
    [['HUESPED'], 'HUESPED', true],
    [['HUESPED', 'ANFITRION'], 'ANFITRION', true],
  ]

  it.each(CASOS)(
    'con roles %j y sesión de %s deja pasar: %s',
    (permitidos, rol, pasa) => {
      iniciarSesionDePrueba(rol)
      renderProtegida(permitidos)

      if (pasa) {
        expect(screen.getByText('Contenido')).toBeInTheDocument()
      } else {
        expect(
          screen.getByRole('heading', { name: 'Acceso denegado' }),
        ).toBeInTheDocument()
        expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
        expect(
          screen.getByRole('link', { name: 'Volver al inicio' }),
        ).toHaveAttribute('href', '/')
      }
    },
  )

  it('explica qué tipo de cuenta hace falta', () => {
    iniciarSesionDePrueba('HUESPED')
    renderProtegida(['ANFITRION'])

    expect(
      screen.getByText(
        'Esta página es solo para cuentas de tipo Anfitrión. Entraste como Huésped.',
      ),
    ).toBeInTheDocument()
  })

  it('lleva al login con motivo cuando el servidor rechaza el token', () => {
    const sesion = iniciarSesionDePrueba('ANFITRION')
    const router = renderProtegida(['ANFITRION'])
    expect(screen.getByText('Contenido')).toBeInTheDocument()

    act(() => {
      invalidarSesion(sesion.token)
    })

    expect(router.state.location.pathname).toBe('/login')
    expect(estadoLogin()).toEqual({
      desde: '/privada?pestana=2',
      motivo: 'expirada',
    })
  })

  it('lleva al login cuando el token vence estando en la página', () => {
    vi.useFakeTimers({ now: new Date('2026-11-12T10:00:00Z') })
    iniciarSesionDePrueba('ANFITRION', {
      expiraEn: '2026-11-12T11:00:00Z',
    })
    const router = renderProtegida(['ANFITRION'])

    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000)
    })

    expect(router.state.location.pathname).toBe('/login')
    expect(estadoLogin().motivo).toBe('expirada')
  })

  it('lleva al inicio cuando la persona cierra sesión', () => {
    iniciarSesionDePrueba('ANFITRION')
    const router = renderProtegida(['ANFITRION'])

    act(() => {
      limpiarSesion()
    })

    expect(router.state.location.pathname).toBe('/')
  })

  it('tras cerrar sesión, entrar de nuevo a una ruta protegida pide login', () => {
    iniciarSesionDePrueba('ANFITRION')
    limpiarSesion()

    const router = renderProtegida(['ANFITRION'])

    expect(router.state.location.pathname).toBe('/login')
  })
})
