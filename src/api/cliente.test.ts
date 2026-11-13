import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerMotivoUltimoCierre, obtenerSesion } from '../auth/sesion'
import { iniciarSesionDePrueba } from '../test/sesion'
import { solicitarApi } from './cliente'

function respuestaError(codigo: string, status: number) {
  return new Response(JSON.stringify({ codigo, mensaje: 'x' }), { status })
}

describe('cliente del API y sesión', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('cierra la sesión si el token recibe 401 NO_AUTENTICADO', async () => {
    const { token } = iniciarSesionDePrueba('ANFITRION')
    fetchSimulado.mockResolvedValue(respuestaError('NO_AUTENTICADO', 401))

    const resultado = await solicitarApi({
      ruta: '/api/auth/me',
      metodo: 'GET',
      estadoExito: 200,
      token,
    })

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(
      'NO_AUTENTICADO',
    )
    expect(obtenerSesion()).toBeNull()
    expect(obtenerMotivoUltimoCierre()).toBe('expirada')
  })

  it('no toca la sesión con un 401 de una petición sin token', async () => {
    const sesion = iniciarSesionDePrueba('ANFITRION')
    fetchSimulado.mockResolvedValue(
      respuestaError('CREDENCIALES_INVALIDAS', 401),
    )

    await solicitarApi({
      ruta: '/api/auth/login',
      metodo: 'POST',
      estadoExito: 200,
      cuerpo: {},
    })

    expect(obtenerSesion()).toEqual(sesion)
  })

  it('no cierra una sesión nueva por un 401 de un token anterior', async () => {
    const sesion = iniciarSesionDePrueba('ANFITRION', { token: 'nuevo' })
    fetchSimulado.mockResolvedValue(respuestaError('NO_AUTENTICADO', 401))

    await solicitarApi({
      ruta: '/api/auth/me',
      metodo: 'GET',
      estadoExito: 200,
      token: 'viejo',
    })

    expect(obtenerSesion()).toEqual(sesion)
  })

  it('no cierra la sesión con un 403 ACCESO_DENEGADO', async () => {
    const sesion = iniciarSesionDePrueba('HUESPED')
    fetchSimulado.mockResolvedValue(respuestaError('ACCESO_DENEGADO', 403))

    await solicitarApi({
      ruta: '/api/anfitrion/publicaciones',
      metodo: 'GET',
      estadoExito: 200,
      token: sesion.token,
    })

    expect(obtenerSesion()).toEqual(sesion)
  })
})
