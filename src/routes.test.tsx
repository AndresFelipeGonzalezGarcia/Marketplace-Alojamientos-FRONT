import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion, type RolUsuario } from './auth/sesion'
import { renderizarApp } from './test/renderizarApp'
import { iniciarSesionDePrueba } from './test/sesion'

function accesos() {
  return within(screen.getByRole('list', { name: 'Accesos rápidos' }))
}

describe('routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('pantallas de anfitrión', () => {
    it('muestra el formulario de nueva publicación', () => {
      vi.stubEnv('VITE_API_URL', '')
      iniciarSesionDePrueba('ANFITRION')
      renderizarApp('/publicaciones/nueva')

      expect(
        screen.getByRole('heading', { name: 'Nueva publicación' }),
      ).toBeInTheDocument()
    })

    it('abre la ruta de disponibilidad de una publicación', async () => {
      vi.stubEnv('VITE_API_URL', '')
      iniciarSesionDePrueba('ANFITRION')
      renderizarApp('/publicaciones/7/disponibilidad')

      expect(
        await screen.findByRole('heading', {
          name: 'No pudimos cargar la disponibilidad',
        }),
      ).toBeInTheDocument()
    })

    it('abre la ruta de edición de una publicación', async () => {
      vi.stubEnv('VITE_API_URL', '')
      iniciarSesionDePrueba('ANFITRION')
      renderizarApp('/publicaciones/7/editar')

      expect(
        await screen.findByRole('heading', {
          name: 'No pudimos cargar la publicación',
        }),
      ).toBeInTheDocument()
    })

    it('muestra el marcador de posición de Mis publicaciones', () => {
      iniciarSesionDePrueba('ANFITRION')
      renderizarApp('/publicaciones')

      expect(
        screen.getByRole('heading', { name: 'Mis publicaciones' }),
      ).toBeInTheDocument()
    })

    it.each<RolUsuario>(['HUESPED', 'ADMINISTRADOR'])(
      'niega /publicaciones/nueva a %s',
      (rol) => {
        iniciarSesionDePrueba(rol)
        renderizarApp('/publicaciones/nueva')

        expect(
          screen.getByRole('heading', { name: 'Acceso denegado' }),
        ).toBeInTheDocument()
      },
    )

    it('sin sesión lleva al login', () => {
      const { router } = renderizarApp('/publicaciones/7/editar')

      expect(router.state.location.pathname).toBe('/login')
      expect(router.state.location.state).toEqual({
        desde: '/publicaciones/7/editar',
      })
      expect(
        screen.getByText('Inicia sesión para continuar donde ibas.'),
      ).toBeInTheDocument()
    })

    it('si el API responde 401 cierra la sesión y lleva al login', async () => {
      vi.stubEnv('VITE_API_URL', 'http://api.prueba')
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockImplementation(async () =>
          new Response(
            JSON.stringify({ codigo: 'NO_AUTENTICADO', mensaje: 'x' }),
            { status: 401 },
          ),
        ),
      )
      iniciarSesionDePrueba('ANFITRION')
      const { router } = renderizarApp('/publicaciones/7/editar')

      const aviso = await screen.findByText('Tu sesión expiró.')
      expect(aviso.closest('[role="status"]')).toHaveTextContent(
        'Tu sesión expiró. Inicia sesión de nuevo para continuar.',
      )
      expect(router.state.location.pathname).toBe('/login')
      expect(router.state.location.state).toEqual({
        desde: '/publicaciones/7/editar',
        motivo: 'expirada',
      })
      expect(obtenerSesion()).toBeNull()
    })
  })

  describe('pantallas de administración', () => {
    it('muestra el marcador de posición de /admin al administrador', () => {
      iniciarSesionDePrueba('ADMINISTRADOR')
      renderizarApp('/admin')

      expect(
        screen.getByRole('heading', { name: 'Publicaciones pendientes' }),
      ).toBeInTheDocument()
    })

    it.each<RolUsuario>(['HUESPED', 'ANFITRION'])(
      'niega /admin a %s',
      (rol) => {
        iniciarSesionDePrueba(rol)
        renderizarApp('/admin')

        expect(
          screen.getByRole('heading', { name: 'Acceso denegado' }),
        ).toBeInTheDocument()
      },
    )
  })

  describe('inicio', () => {
    it('sin sesión ofrece crear cuenta e iniciar sesión', () => {
      renderizarApp('/')

      expect(
        screen.getByRole('heading', { name: 'Marketplace de Alojamientos' }),
      ).toBeInTheDocument()
      expect(
        accesos().getByRole('link', { name: 'Registrarme' }),
      ).toHaveAttribute('href', '/registro')
      expect(accesos().getByRole('link', { name: 'Entrar' })).toHaveAttribute(
        'href',
        '/login',
      )
    })

    it('al anfitrión le ofrece crear una publicación', () => {
      iniciarSesionDePrueba('ANFITRION', { usuario: { nombre: 'Laura Ríos' } })
      renderizarApp('/')

      expect(
        screen.getByRole('heading', { name: 'Hola, Laura Ríos' }),
      ).toBeInTheDocument()
      expect(
        accesos().getByRole('link', { name: 'Crear publicación' }),
      ).toHaveAttribute('href', '/publicaciones/nueva')
      expect(
        accesos().getByRole('heading', { name: 'Mis publicaciones' }),
      ).toBeInTheDocument()
    })

    it('al administrador le muestra las publicaciones pendientes', () => {
      iniciarSesionDePrueba('ADMINISTRADOR')
      renderizarApp('/')

      expect(
        accesos().getByRole('heading', { name: 'Publicaciones pendientes' }),
      ).toBeInTheDocument()
      expect(
        accesos().queryByRole('link', { name: 'Crear publicación' }),
      ).not.toBeInTheDocument()
    })

    it('al huésped le muestra que pronto podrá buscar', () => {
      iniciarSesionDePrueba('HUESPED')
      renderizarApp('/')

      expect(
        screen.getByRole('heading', {
          name: 'Muy pronto podrás buscar alojamientos',
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('list', { name: 'Accesos rápidos' }),
      ).not.toBeInTheDocument()
    })
  })

  it.each<[RolUsuario | null, RegExp, string]>([
    [
      null,
      /inicio\.jpg/,
      'Cabaña de madera con techo alto junto a una piscina',
    ],
    [
      'HUESPED',
      /portada-huesped\.jpg/,
      'Piscina de un hotel entre palmeras al atardecer',
    ],
    [
      'ANFITRION',
      /portada-anfitrion\.jpg/,
      'Terraza con mesa y sillas frente a cabañas de techo de paja en el desierto',
    ],
    [
      'ADMINISTRADOR',
      /portada-administrador\.jpg/,
      'Campamento de cabañas de paja junto a un lago',
    ],
  ])('el inicio de %s usa su propia foto de portada', (rol, archivo, alt) => {
    if (rol) iniciarSesionDePrueba(rol)
    renderizarApp('/')

    expect(screen.getByRole('img', { name: alt })).toHaveAttribute(
      'src',
      expect.stringMatching(archivo),
    )
  })

  it('muestra la pantalla de inicio de sesión en /login', () => {
    renderizarApp('/login')

    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
  })

  it('muestra el formulario de registro en /registro', () => {
    renderizarApp('/registro')

    expect(
      screen.getByRole('heading', { name: 'Crear cuenta' }),
    ).toBeInTheDocument()
  })

  it('pone el encabezado en todas las pantallas', () => {
    renderizarApp('/ruta-inexistente')

    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('permite volver al inicio desde una ruta inexistente', async () => {
    const { usuario } = renderizarApp('/ruta-inexistente')

    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole('link', { name: 'Volver al inicio' }))

    expect(
      await screen.findByRole('heading', {
        name: 'Marketplace de Alojamientos',
      }),
    ).toBeInTheDocument()
  })
})
