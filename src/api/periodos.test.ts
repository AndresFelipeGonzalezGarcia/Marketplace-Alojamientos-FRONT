import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import {
  actualizarPeriodo,
  crearPeriodo,
  eliminarPeriodo,
  listarPeriodos,
  reservasAfectadas,
} from './periodos'

const BASE = 'http://api.prueba/api/anfitrion/publicaciones/p1/periodos'
const datos = { fechaInicio: '2026-12-01', fechaFin: '2026-12-10' }
const periodo = { ...datos, id: 'x1', publicacionId: 'p1' }
const JSON_CON_TOKEN = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer token-123',
}

function respuestaJson(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status })
}

describe('API de periodos', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba')
    iniciarSesionDePrueba('ANFITRION', { token: 'token-123' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('lista con GET', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson([periodo], 200))

    await expect(listarPeriodos('p1')).resolves.toEqual({
      estado: 'ok',
      datos: [periodo],
    })
    expect(fetchSimulado).toHaveBeenCalledWith(BASE, {
      method: 'GET',
      headers: { Authorization: 'Bearer token-123' },
    })
  })

  it('crea con POST', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(periodo, 201))

    await expect(crearPeriodo('p1', datos)).resolves.toEqual({
      estado: 'ok',
      datos: periodo,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(BASE, {
      method: 'POST',
      headers: JSON_CON_TOKEN,
      body: JSON.stringify(datos),
    })
  })

  it('edita con PUT', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(periodo, 200))

    await expect(actualizarPeriodo('p1', 'x1', datos)).resolves.toEqual({
      estado: 'ok',
      datos: periodo,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(`${BASE}/x1`, {
      method: 'PUT',
      headers: JSON_CON_TOKEN,
      body: JSON.stringify(datos),
    })
  })

  it('elimina con DELETE y acepta 204 sin cuerpo', async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(eliminarPeriodo('p1', 'x1')).resolves.toEqual({
      estado: 'ok',
      datos: undefined,
    })
    expect(fetchSimulado).toHaveBeenCalledWith(`${BASE}/x1`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-123' },
    })
  })

  it.each([
    [401, 'NO_AUTENTICADO'],
    [403, 'ACCESO_DENEGADO'],
    [404, 'PUBLICACION_NO_ENCONTRADA'],
    [409, 'PERIODO_CRUZADO'],
    [422, 'PERIODO_EN_EL_PASADO'],
  ])('devuelve el error %i con código %s', async (status, codigo) => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ codigo, mensaje: 'x' }, status),
    )

    const resultado = await crearPeriodo('p1', datos)

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(codigo)
  })

  it('expone las reservas afectadas de PERIODO_CON_RESERVAS', async () => {
    const reservas = [
      {
        id: 'r1',
        fechaLlegada: '2026-12-02',
        fechaSalida: '2026-12-04',
        numeroHuespedes: 2,
        estado: 'CONFIRMADA',
      },
    ]
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        { codigo: 'PERIODO_CON_RESERVAS', mensaje: 'x', detalles: reservas },
        409,
      ),
    )

    const resultado = await eliminarPeriodo('p1', 'x1')

    expect(resultado.estado).toBe('error')
    if (resultado.estado === 'error') {
      expect(reservasAfectadas(resultado.error)).toEqual(reservas)
    }
  })
})
