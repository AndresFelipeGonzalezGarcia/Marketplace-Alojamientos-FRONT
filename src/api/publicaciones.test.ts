import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerTokenSesion } from '../auth/sesion'
import {
  actualizarPublicacion,
  crearPublicacion,
  obtenerPublicacion,
  type DatosPublicacion,
} from './publicaciones'

vi.mock('../auth/sesion', () => ({ obtenerTokenSesion: vi.fn() }))

const datos: DatosPublicacion = {
  titulo: 'Casa de campo',
  descripcion: '',
  ciudad: 'Medellín',
  ubicacion: '',
  tipo: 'Casa',
  capacidad: 4,
  precioNoche: 200000,
  servicios: ['Wi-Fi'],
  reglas: '',
  imagenes: ['/fotos/1.jpg'],
}

const publicacion = { ...datos, id: '7', estado: 'BORRADOR' }

function respuestaJson(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status })
}

describe('API de publicaciones', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba/')
    vi.mocked(obtenerTokenSesion).mockReturnValue('token-123')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('crea con POST, token y cuerpo', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(publicacion, 201))

    await expect(crearPublicacion(datos)).resolves.toEqual({
      estado: 'ok',
      publicacion,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/publicaciones',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify(datos),
      },
    )
  })

  it('carga con GET y sin cuerpo', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(publicacion, 200))

    await expect(obtenerPublicacion('7')).resolves.toEqual({
      estado: 'ok',
      publicacion,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/publicaciones/7',
      { method: 'GET', headers: { Authorization: 'Bearer token-123' } },
    )
  })

  it('actualiza con PUT', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(publicacion, 200))

    await actualizarPublicacion('7', datos)

    expect(fetchSimulado.mock.calls[0][0]).toBe(
      'http://api.prueba/api/publicaciones/7',
    )
    expect(fetchSimulado.mock.calls[0][1]?.method).toBe('PUT')
  })

  it('no envía Authorization si no hay token', async () => {
    vi.mocked(obtenerTokenSesion).mockReturnValue(null)
    fetchSimulado.mockResolvedValue(respuestaJson(publicacion, 200))

    await obtenerPublicacion('7')

    expect(fetchSimulado.mock.calls[0][1]?.headers).toEqual({})
  })

  it.each([
    [401, 'sesion_invalida'],
    [403, 'acceso_denegado'],
    [404, 'no_encontrada'],
    [500, 'error'],
  ])('traduce la respuesta %i a %s', async (status, estado) => {
    fetchSimulado.mockResolvedValue(new Response(null, { status }))

    await expect(actualizarPublicacion('7', datos)).resolves.toEqual({ estado })
  })

  it.each([400, 422])('devuelve los errores por campo con %i', async (status) => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ errores: { titulo: 'Título repetido', otro: 'x' } }, status),
    )

    await expect(crearPublicacion(datos)).resolves.toEqual({
      estado: 'validacion',
      errores: { titulo: 'Título repetido' },
    })
  })

  it('devuelve error si falla la red', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(crearPublicacion(datos)).resolves.toEqual({ estado: 'error' })
  })

  it('devuelve error si falta VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '')

    await expect(crearPublicacion(datos)).resolves.toEqual({ estado: 'error' })
    expect(fetchSimulado).not.toHaveBeenCalled()
  })
})
