import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerTokenSesion } from '../auth/sesion'
import {
  actualizarPublicacion,
  crearPublicacion,
  enviarPublicacion,
  listarPublicaciones,
  obtenerPublicacion,
  type DatosPublicacion,
} from './publicaciones'

vi.mock('../auth/sesion', () => ({ obtenerTokenSesion: vi.fn() }))

const datos: DatosPublicacion = {
  titulo: 'Casa de campo',
  descripcion: 'Con vista',
  ciudad: 'Medellín',
  ubicacionTextual: 'El Poblado',
  tipo: 'CABANA',
  capacidad: 4,
  imagenes: ['/fotos/1.jpg'],
  precioNoche: 200000.5,
  tarifaLimpieza: 0,
  politicaCancelacionId: 'pol-1',
  modoReserva: 'INMEDIATA',
  reglas: '',
  serviciosIds: ['s1'],
  serviciosAdicionales: [{ nombre: 'Desayuno', costo: 15000 }],
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

  it('crea con POST, token y las condiciones comerciales', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(publicacion, 201))

    await expect(crearPublicacion(datos)).resolves.toEqual({
      estado: 'ok',
      datos: publicacion,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/anfitrion/publicaciones',
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
      datos: publicacion,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/anfitrion/publicaciones/7',
      { method: 'GET', headers: { Authorization: 'Bearer token-123' } },
    )
  })

  it('lista con GET', async () => {
    const resumen = {
      id: '7',
      titulo: 'Casa de campo',
      ciudad: 'Medellín',
      estado: 'BORRADOR',
      capacidad: 4,
      precioNoche: 200000.5,
    }
    fetchSimulado.mockResolvedValue(respuestaJson([resumen], 200))

    await expect(listarPublicaciones()).resolves.toEqual({
      estado: 'ok',
      datos: [resumen],
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/anfitrion/publicaciones',
      { method: 'GET', headers: { Authorization: 'Bearer token-123' } },
    )
  })

  it('envía a revisión con POST y sin cuerpo', async () => {
    const enviada = { ...publicacion, estado: 'PENDIENTE_REVISION' }
    fetchSimulado.mockResolvedValue(respuestaJson(enviada, 200))

    await expect(enviarPublicacion('7')).resolves.toEqual({
      estado: 'ok',
      datos: enviada,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/anfitrion/publicaciones/7/enviar',
      { method: 'POST', headers: { Authorization: 'Bearer token-123' } },
    )
  })

  it('actualiza con PUT', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(publicacion, 200))

    await actualizarPublicacion('7', datos)

    expect(fetchSimulado.mock.calls[0][0]).toBe(
      'http://api.prueba/api/anfitrion/publicaciones/7',
    )
    expect(fetchSimulado.mock.calls[0][1]?.method).toBe('PUT')
  })

  it('devuelve los detalles por campo con el manejador único', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          codigo: 'SOLICITUD_INVALIDA',
          mensaje: 'Inválido',
          detalles: [
            { campo: 'precioNoche', mensaje: 'Debe ser positivo.' },
            { campo: 'serviciosAdicionales[0].nombre', mensaje: 'Muy largo.' },
          ],
        },
        400,
      ),
    )

    const resultado = await crearPublicacion(datos)

    expect(resultado.estado === 'error' && resultado.error.erroresPorCampo).toEqual({
      precioNoche: 'Debe ser positivo.',
      'serviciosAdicionales[0].nombre': 'Muy largo.',
    })
  })

  it('devuelve el código del backend', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ codigo: 'ACCESO_DENEGADO', mensaje: 'x' }, 403),
    )

    const resultado = await actualizarPublicacion('7', datos)

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(
      'ACCESO_DENEGADO',
    )
  })

  it('devuelve error de conexión si falla la red', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))

    const resultado = await crearPublicacion(datos)

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(
      'ERROR_CONEXION',
    )
  })
})
