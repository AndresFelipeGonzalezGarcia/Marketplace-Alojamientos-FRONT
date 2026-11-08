import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registrarUsuario, type DatosRegistro } from './registro'

const datos: DatosRegistro = {
  nombreCompleto: 'Ana Pérez',
  correo: 'ana@correo.com',
  contrasena: 'clave-segura',
  rol: 'ANFITRION',
}

describe('registrarUsuario', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('envía los datos a la URL configurada', async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 201 }))

    await expect(registrarUsuario(datos)).resolves.toEqual({ estado: 'ok' })

    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/usuarios/registro',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      },
    )
  })

  it.each([
    [409, 'correo_duplicado'],
    [400, 'contrasena_invalida'],
    [422, 'contrasena_invalida'],
    [500, 'error'],
  ])('traduce la respuesta %i a %s', async (status, estado) => {
    fetchSimulado.mockResolvedValue(new Response(null, { status }))

    await expect(registrarUsuario(datos)).resolves.toEqual({ estado })
  })

  it('devuelve error si falla la red', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(registrarUsuario(datos)).resolves.toEqual({ estado: 'error' })
  })

  it('devuelve error si falta VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '')

    await expect(registrarUsuario(datos)).resolves.toEqual({ estado: 'error' })
    expect(fetchSimulado).not.toHaveBeenCalled()
  })
})
