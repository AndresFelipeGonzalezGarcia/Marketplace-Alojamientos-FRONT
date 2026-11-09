import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registrarUsuario, type DatosRegistro } from './registro'

const datos: DatosRegistro = {
  nombre: 'Ana Pérez',
  correo: 'ana@correo.com',
  telefono: '3001234567',
  contrasena: 'Segura123*',
  rol: 'ANFITRION',
}

const usuario = {
  id: 'u1',
  nombre: 'Ana Pérez',
  correo: 'ana@correo.com',
  rol: 'ANFITRION',
}

function respuestaJson(cuerpo: unknown, status: number) {
  return new Response(JSON.stringify(cuerpo), { status })
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

  it('envía los datos a POST /api/auth/registro sin token', async () => {
    fetchSimulado.mockResolvedValue(respuestaJson(usuario, 201))

    await expect(registrarUsuario(datos)).resolves.toEqual({
      estado: 'ok',
      datos: usuario,
    })

    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://api.prueba/api/auth/registro',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      },
    )
  })

  it('devuelve CORREO_YA_REGISTRADO como error del campo correo', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        { codigo: 'CORREO_YA_REGISTRADO', mensaje: 'Duplicado' },
        409,
      ),
    )

    const resultado = await registrarUsuario(datos)

    expect(resultado.estado).toBe('error')
    if (resultado.estado === 'error') {
      expect(resultado.error.codigo).toBe('CORREO_YA_REGISTRADO')
      expect(resultado.error.erroresPorCampo.correo).toContain('ya está registrado')
    }
  })

  it('devuelve los detalles por campo de SOLICITUD_INVALIDA', async () => {
    fetchSimulado.mockResolvedValue(
      respuestaJson(
        {
          codigo: 'SOLICITUD_INVALIDA',
          mensaje: 'Inválido',
          detalles: [{ campo: 'contrasena', mensaje: 'No cumple la política.' }],
        },
        400,
      ),
    )

    const resultado = await registrarUsuario(datos)

    expect(resultado.estado === 'error' && resultado.error.erroresPorCampo).toEqual({
      contrasena: 'No cumple la política.',
    })
  })

  it('devuelve error de conexión si falla la red', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))

    const resultado = await registrarUsuario(datos)

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(
      'ERROR_CONEXION',
    )
  })

  it('devuelve error de conexión si falta VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '')

    const resultado = await registrarUsuario(datos)

    expect(resultado.estado === 'error' && resultado.error.codigo).toBe(
      'ERROR_CONEXION',
    )
    expect(fetchSimulado).not.toHaveBeenCalled()
  })
})
