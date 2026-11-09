import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerTokenSesion } from '../auth/sesion'
import { listarPoliticasCancelacion, listarServicios } from './catalogos'

vi.mock('../auth/sesion', () => ({ obtenerTokenSesion: vi.fn() }))

describe('API de catálogos', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba')
    vi.mocked(obtenerTokenSesion).mockReturnValue('token-123')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it.each([
    ['/api/anfitrion/politicas-cancelacion', listarPoliticasCancelacion],
    ['/api/anfitrion/servicios', listarServicios],
  ])('consulta %s con el token', async (ruta, listar) => {
    const items = [{ id: '1', nombre: 'Uno' }]
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify(items), { status: 200 }),
    )

    await expect(listar()).resolves.toEqual({ estado: 'ok', datos: items })
    expect(fetchSimulado).toHaveBeenCalledWith(`http://api.prueba${ruta}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer token-123' },
    })
  })

  it('devuelve el error del manejador único', async () => {
    fetchSimulado.mockResolvedValue(
      new Response(
        JSON.stringify({ codigo: 'NO_AUTENTICADO', mensaje: 'x' }),
        { status: 401 },
      ),
    )

    const resultado = await listarServicios()

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(
      'NO_AUTENTICADO',
    )
  })
})
