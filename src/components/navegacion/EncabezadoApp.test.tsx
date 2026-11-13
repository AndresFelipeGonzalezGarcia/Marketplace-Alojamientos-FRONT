import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLAVE_SESION, limpiarSesion } from '../../auth/sesion'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

function encabezado() {
  return within(screen.getByRole('banner'))
}

function menu() {
  return within(screen.getByRole('navigation', { name: 'Principal' }))
}

// Elemento deshabilitado («Próximamente») con ese texto dentro del encabezado.
function deshabilitado(texto: string) {
  const elemento = encabezado().getByText(texto)
  expect(elemento).toHaveAttribute('aria-disabled', 'true')
  expect(elemento).toHaveTextContent('Próximamente')
  expect(elemento.closest('a')).toBeNull()
  return elemento
}

function textosDelMenu() {
  return menu()
    .getAllByRole('listitem')
    .map((item) => item.firstElementChild?.firstChild?.textContent)
}

describe('EncabezadoApp', () => {
  beforeEach(() => {
    // Las pantallas de publicación consultan catálogos; sin API fallan rápido.
    vi.stubEnv('VITE_API_URL', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('enlaza el logo de Inversiones LR al inicio', () => {
    renderizarApp('/registro')

    expect(
      encabezado().getByRole('link', { name: 'Inversiones LR, ir al inicio' }),
    ).toHaveAttribute('href', '/')
  })

  describe('sin sesión', () => {
    it('muestra Crear cuenta e Iniciar sesión', () => {
      renderizarApp('/')

      expect(
        encabezado().getByRole('link', { name: 'Crear cuenta' }),
      ).toHaveAttribute('href', '/registro')
      deshabilitado('Iniciar sesión')
      expect(textosDelMenu()).toEqual(['Inicio'])
      expect(
        encabezado().queryByRole('button', { name: 'Cerrar sesión' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('con sesión de ANFITRION', () => {
    it('muestra sus secciones, su nombre y Cerrar sesión', () => {
      iniciarSesionDePrueba('ANFITRION', { usuario: { nombre: 'Laura Ríos' } })
      renderizarApp('/')

      expect(textosDelMenu()).toEqual([
        'Inicio',
        'Mis publicaciones',
        'Nueva publicación',
      ])
      expect(
        menu().getByRole('link', { name: 'Nueva publicación' }),
      ).toHaveAttribute('href', '/publicaciones/nueva')
      deshabilitado('Mis publicaciones')
      expect(encabezado().getByText('Laura Ríos')).toBeInTheDocument()
      expect(encabezado().getByText('Anfitrión')).toBeInTheDocument()
      expect(
        encabezado().getByRole('button', { name: 'Cerrar sesión' }),
      ).toBeInTheDocument()
      expect(
        encabezado().queryByRole('link', { name: 'Crear cuenta' }),
      ).not.toBeInTheDocument()
      expect(
        encabezado().queryByText('Publicaciones pendientes'),
      ).not.toBeInTheDocument()
    })
  })

  describe('con sesión de ADMINISTRADOR', () => {
    it('muestra Publicaciones pendientes y nada de anfitrión', () => {
      iniciarSesionDePrueba('ADMINISTRADOR')
      renderizarApp('/')

      expect(textosDelMenu()).toEqual(['Inicio', 'Publicaciones pendientes'])
      deshabilitado('Publicaciones pendientes')
      expect(
        encabezado().queryByText('Nueva publicación'),
      ).not.toBeInTheDocument()
    })
  })

  describe('con sesión de HUESPED', () => {
    it('solo muestra el inicio', () => {
      iniciarSesionDePrueba('HUESPED')
      renderizarApp('/')

      expect(textosDelMenu()).toEqual(['Inicio'])
      expect(encabezado().getByText('Huésped')).toBeInTheDocument()
    })
  })

  describe('sección activa', () => {
    it.each([
      ['/', 'Inicio'],
      ['/publicaciones/nueva', 'Nueva publicación'],
      ['/publicaciones/7/editar', 'Mis publicaciones'],
      ['/publicaciones/7/disponibilidad', 'Mis publicaciones'],
      ['/publicaciones', 'Mis publicaciones'],
    ])('en %s marca %s', (ruta, activa) => {
      iniciarSesionDePrueba('ANFITRION')
      renderizarApp(ruta)

      const actuales = menu()
        .getAllByRole('listitem')
        .map((item) => item.firstElementChild)
        .filter((el) => el?.getAttribute('aria-current') === 'page')

      expect(actuales).toHaveLength(1)
      expect(actuales[0]?.firstChild?.textContent).toBe(activa)
    })

    it('marca Publicaciones pendientes en /admin', () => {
      iniciarSesionDePrueba('ADMINISTRADOR')
      renderizarApp('/admin')

      expect(deshabilitado('Publicaciones pendientes')).toHaveAttribute(
        'aria-current',
        'page',
      )
    })

    it('marca Crear cuenta en /registro', () => {
      renderizarApp('/registro')

      expect(
        encabezado().getByRole('link', { name: 'Crear cuenta' }),
      ).toHaveAttribute('aria-current', 'page')
    })
  })

  it('cierra sesión, vuelve al inicio y muestra los accesos de invitado', async () => {
    iniciarSesionDePrueba('ANFITRION')
    const { router, usuario } = renderizarApp('/publicaciones/nueva')

    await usuario.click(
      encabezado().getByRole('button', { name: 'Cerrar sesión' }),
    )

    expect(router.state.location.pathname).toBe('/')
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
    expect(
      encabezado().getByRole('link', { name: 'Crear cuenta' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Marketplace de Alojamientos' }),
    ).toBeInTheDocument()
  })

  it('reacciona al iniciar y cerrar sesión sin recargar', () => {
    renderizarApp('/')
    expect(textosDelMenu()).toEqual(['Inicio'])

    act(() => {
      iniciarSesionDePrueba('ANFITRION', { usuario: { nombre: 'Laura Ríos' } })
    })
    expect(encabezado().getByText('Laura Ríos')).toBeInTheDocument()
    expect(textosDelMenu()).toContain('Nueva publicación')

    act(() => {
      limpiarSesion()
    })
    expect(encabezado().queryByText('Laura Ríos')).not.toBeInTheDocument()
    expect(textosDelMenu()).toEqual(['Inicio'])
  })
})
