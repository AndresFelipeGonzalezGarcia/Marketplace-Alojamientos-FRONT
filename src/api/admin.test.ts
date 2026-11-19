import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import {
  aprobarPublicacion,
  listarPendientes,
  obtenerPublicacionRevision,
  ordenarPorEnvio,
  rechazarPublicacion,
  type PublicacionRevision,
} from './admin'

const BASE = 'http://api.prueba/api/admin/publicaciones'
const CON_TOKEN = { Authorization: 'Bearer token-admin' }

function respuestaJson(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status })
}

function fila(id: string, fechaEnvio: string): PublicacionRevision {
  return {
    id,
    titulo: id,
    ciudad: 'Cali',
    tipo: 'CASA',
    capacidad: 2,
    precioNoche: 100,
    estado: 'PENDIENTE_REVISION',
    anfitrionId: 'a',
    anfitrionNombre: 'Ana',
    fechaEnvio,
  }
}

describe('API de administración', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', 'http://api.prueba')
    iniciarSesionDePrueba('ADMINISTRADOR', { token: 'token-admin' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('lista las pendientes con GET y el token', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson([], 200))

    await expect(listarPendientes()).resolves.toEqual({ estado: 'ok', datos: [] })
    expect(fetchSimulado).toHaveBeenCalledWith(BASE, {
      method: 'GET',
      headers: CON_TOKEN,
    })
  })

  it('consulta el detalle codificando el id', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson({ id: 'a/b' }, 200))

    await obtenerPublicacionRevision('a/b')
    expect(fetchSimulado).toHaveBeenCalledWith(`${BASE}/a%2Fb`, {
      method: 'GET',
      headers: CON_TOKEN,
    })
  })

  it('aprueba con POST sin cuerpo', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson({ id: 'p1', estado: 'ACTIVA' }, 200))

    await expect(aprobarPublicacion('p1')).resolves.toMatchObject({ estado: 'ok' })
    expect(fetchSimulado).toHaveBeenCalledWith(`${BASE}/p1/aprobar`, {
      method: 'POST',
      headers: CON_TOKEN,
    })
  })

  it('rechaza con POST y el motivo en JSON', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson({ id: 'p1', estado: 'BORRADOR' }, 200))

    await rechazarPublicacion('p1', 'Faltan fotos del baño.')
    expect(fetchSimulado).toHaveBeenCalledWith(`${BASE}/p1/rechazar`, {
      method: 'POST',
      headers: { ...CON_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: 'Faltan fotos del baño.' }),
    })
  })

  it('devuelve el 409 ESTADO_PUBLICACION_INVALIDO como error', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson({ codigo: 'ESTADO_PUBLICACION_INVALIDO', mensaje: 'x' }, 409),
    )

    const resultado = await aprobarPublicacion('p1')
    expect(resultado).toMatchObject({
      estado: 'error',
      error: { codigo: 'ESTADO_PUBLICACION_INVALIDO' },
    })
  })

  it('ordena de la más antigua a la más reciente', () => {
    const ordenadas = ordenarPorEnvio([
      fila('c', '2026-11-17T10:00:00Z'),
      fila('a', '2026-11-10T10:00:00Z'),
      fila('b', '2026-11-15T10:00:00Z'),
    ])
    expect(ordenadas.map((f) => f.id)).toEqual(['a', 'b', 'c'])
  })
})
