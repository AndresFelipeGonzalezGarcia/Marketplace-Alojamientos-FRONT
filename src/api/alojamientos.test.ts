import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../auth/sesion'
import { iniciarSesionDePrueba } from '../test/sesion'
import {
  buscarAlojamientos,
  construirConsulta,
  listarServiciosPublicos,
  obtenerAlojamiento,
} from './alojamientos'

const PAGINA_VACIA = { contenido: [], pagina: 0, tamano: 12, total: 0, totalPaginas: 0 }

function respuestaJson(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status })
}

describe('API de búsqueda', () => {
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

  it('arma la consulta solo con lo que tiene valor', () => {
    expect(construirConsulta({})).toBe('')
    expect(
      construirConsulta({
        ciudad: 'Santa Marta',
        fechaLlegada: '2030-12-10',
        fechaSalida: '2030-12-14',
        huespedes: 2,
        serviciosIds: ['a', 'b'],
        tipo: undefined,
        pagina: 0,
        tamano: 12,
      }),
    ).toBe(
      '?ciudad=Santa+Marta&fechaLlegada=2030-12-10&fechaSalida=2030-12-14&huespedes=2&serviciosIds=a%2Cb&pagina=0&tamano=12',
    )
    expect(construirConsulta({ serviciosIds: [] })).toBe('')
  })

  it('busca con GET y sin token, aunque haya sesión', async () => {
    iniciarSesionDePrueba('HUESPED', { token: 'token-huesped' })
    fetchSimulado.mockResolvedValue(respuestaJson(PAGINA_VACIA, 200))

    await expect(buscarAlojamientos({ ciudad: 'Cali', pagina: 0 })).resolves.toEqual({
      estado: 'ok',
      datos: PAGINA_VACIA,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/alojamientos?ciudad=Cali&pagina=0',
      { method: 'GET', headers: {} },
    )
  })

  it('un 401 de la búsqueda no cierra la sesión', async () => {
    iniciarSesionDePrueba('HUESPED')
    fetchSimulado.mockResolvedValue(
      respuestaJson({ codigo: 'NO_AUTENTICADO', mensaje: 'x' }, 401),
    )

    await buscarAlojamientos({})
    expect(obtenerSesion()).not.toBeNull()
  })

  it('devuelve FECHAS_INVALIDAS como error', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ codigo: 'FECHAS_INVALIDAS', mensaje: 'x' }, 400),
    )

    await expect(buscarAlojamientos({})).resolves.toMatchObject({
      estado: 'error',
      error: { codigo: 'FECHAS_INVALIDAS' },
    })
  })

  it('pide el catálogo público de servicios', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson([{ id: 's1', nombre: 'Wifi' }], 200))

    await listarServiciosPublicos()
    expect(fetchSimulado).toHaveBeenCalledWith('http://api.prueba/api/servicios', {
      method: 'GET',
      headers: {},
    })
  })

  it('pide el detalle con GET y sin token, aunque haya sesión', async () => {
    iniciarSesionDePrueba('HUESPED', { token: 'token-huesped' })
    fetchSimulado.mockResolvedValue(respuestaJson({ id: 'a 1' }, 200))

    await expect(obtenerAlojamiento('a 1')).resolves.toEqual({
      estado: 'ok',
      datos: { id: 'a 1' },
    })
    expect(fetchSimulado).toHaveBeenCalledWith('http://api.prueba/api/alojamientos/a%201', {
      method: 'GET',
      headers: {},
    })
  })

  it('devuelve ALOJAMIENTO_NO_ENCONTRADO con un mensaje propio', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ codigo: 'ALOJAMIENTO_NO_ENCONTRADO', mensaje: 'x' }, 404),
    )

    await expect(obtenerAlojamiento('a-1')).resolves.toMatchObject({
      estado: 'error',
      error: {
        codigo: 'ALOJAMIENTO_NO_ENCONTRADO',
        mensaje: 'Este alojamiento ya no está disponible o el enlace no es correcto.',
      },
    })
  })
})
