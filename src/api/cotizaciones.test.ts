import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerSesion } from '../auth/sesion'
import { iniciarSesionDePrueba } from '../test/sesion'
import { cotizarEstadia } from './cotizaciones'

const SOLICITUD = {
  alojamientoId: 'a-1',
  fechaLlegada: '2030-04-10',
  fechaSalida: '2030-04-14',
  numeroHuespedes: 2,
}

describe('API de cotización', () => {
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

  it('envía la solicitud con POST y el token del huésped', async () => {
    iniciarSesionDePrueba('HUESPED', { token: 'token-huesped' })
    fetchSimulado.mockResolvedValue(new Response(JSON.stringify({ total: 1 }), { status: 200 }))

    await expect(cotizarEstadia(SOLICITUD)).resolves.toEqual({ estado: 'ok', datos: { total: 1 } })
    expect(fetchSimulado).toHaveBeenCalledWith('http://api.prueba/api/huesped/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-huesped' },
      body: JSON.stringify(SOLICITUD),
    })
  })

  it('un 401 cierra la sesión vencida', async () => {
    iniciarSesionDePrueba('HUESPED', { token: 'token-huesped' })
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify({ codigo: 'NO_AUTENTICADO', mensaje: 'x' }), { status: 401 }),
    )

    await cotizarEstadia(SOLICITUD)
    expect(obtenerSesion()).toBeNull()
  })
})
