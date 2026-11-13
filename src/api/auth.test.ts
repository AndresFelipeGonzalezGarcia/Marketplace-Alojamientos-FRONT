import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import { iniciarSesion, obtenerUsuarioActual } from './auth'

const API = 'http://api.prueba'

describe('API de autenticación', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', API)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('inicia sesión con POST /api/auth/login sin token', async () => {
    iniciarSesionDePrueba('ANFITRION')
    const respuesta = {
      token: 'jwt',
      tipo: 'Bearer',
      expiraEn: '2026-11-12T11:00:00Z',
      usuario: { id: 'u1', nombre: 'Ana', correo: 'a@b.co', rol: 'HUESPED' },
    }
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify(respuesta), { status: 200 }),
    )

    const resultado = await iniciarSesion({
      correo: 'a@b.co',
      contrasena: 'clave',
    })

    expect(resultado).toEqual({ estado: 'ok', datos: respuesta })
    expect(fetchSimulado).toHaveBeenCalledWith(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: 'a@b.co', contrasena: 'clave' }),
    })
  })

  it.each([
    [401, 'CREDENCIALES_INVALIDAS'],
    [403, 'CUENTA_RESTRINGIDA'],
    [403, 'CUENTA_DESACTIVADA'],
  ])('devuelve el error %i %s', async (status, codigo) => {
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify({ codigo, mensaje: 'x' }), { status }),
    )

    const resultado = await iniciarSesion({ correo: 'a@b.co', contrasena: 'c' })

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(codigo)
  })

  it('consulta GET /api/auth/me con el token de la sesión', async () => {
    const sesion = iniciarSesionDePrueba('ANFITRION', { token: 'jwt-123' })
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify(sesion.usuario), { status: 200 }),
    )

    const resultado = await obtenerUsuarioActual()

    expect(resultado).toEqual({ estado: 'ok', datos: sesion.usuario })
    expect(fetchSimulado).toHaveBeenCalledWith(`${API}/api/auth/me`, {
      method: 'GET',
      headers: { Authorization: 'Bearer jwt-123' },
    })
  })
})
