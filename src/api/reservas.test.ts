import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import { crearReserva, obtenerReserva } from './reservas'

const SOLICITUD = {
  alojamientoId: 'a-1',
  fechaLlegada: '2030-04-10',
  fechaSalida: '2030-04-14',
  numeroHuespedes: 2,
}
const CLAVE = '6f1c2a9e-3b4d-4e5f-8a7b-9c0d1e2f3a4b'
const RESERVA = { id: 'r-1', estado: 'PENDIENTE_PAGO' }

const json = (cuerpo: unknown, status: number) =>
  new Response(JSON.stringify(cuerpo), { status })

describe('API de reservas', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba')
    iniciarSesionDePrueba('HUESPED', { token: 'token-huesped' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('crea la reserva con POST, el token y la cabecera Idempotency-Key', async () => {
    fetchSimulado.mockResolvedValue(json(RESERVA, 201))

    await expect(crearReserva(SOLICITUD, CLAVE)).resolves.toEqual({ estado: 'ok', datos: RESERVA })
    expect(fetchSimulado).toHaveBeenCalledWith('http://api.prueba/api/huesped/reservas', {
      method: 'POST',
      headers: {
        'Idempotency-Key': CLAVE,
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-huesped',
      },
      body: JSON.stringify(SOLICITUD),
    })
  })

  it('un 200 (ya existía con esa clave) también es un éxito', async () => {
    fetchSimulado.mockResolvedValue(json(RESERVA, 200))
    await expect(crearReserva(SOLICITUD, CLAVE)).resolves.toEqual({ estado: 'ok', datos: RESERVA })
  })

  it.each([
    [409, 'PERIODO_NO_DISPONIBLE'],
    [409, 'IDEMPOTENCIA_CONFLICTO'],
    [422, 'CAPACIDAD_EXCEDIDA'],
    [400, 'IDEMPOTENCIA_REQUERIDA'],
  ])('un %i %s es un error con su código', async (status, codigo) => {
    fetchSimulado.mockResolvedValue(json({ codigo, mensaje: 'x' }, status))
    const resultado = await crearReserva(SOLICITUD, CLAVE)
    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(codigo)
  })

  it('consulta una reserva por su id', async () => {
    fetchSimulado.mockResolvedValue(json(RESERVA, 200))

    await expect(obtenerReserva('r/1')).resolves.toEqual({ estado: 'ok', datos: RESERVA })
    expect(fetchSimulado).toHaveBeenCalledWith('http://api.prueba/api/huesped/reservas/r%2F1', {
      method: 'GET',
      headers: { Authorization: 'Bearer token-huesped' },
    })
  })
})
