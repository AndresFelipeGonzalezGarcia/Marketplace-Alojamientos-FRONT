import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { iniciarSesionDePrueba } from '../test/sesion'
import { restablecerContrasena, solicitarRecuperacion } from './recuperacion'

const API = 'http://api.prueba'

describe('API de recuperación de contraseña', () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    fetchSimulado.mockReset()
    vi.stubGlobal('fetch', fetchSimulado)
    vi.stubEnv('VITE_API_URL', API)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('pide el enlace con POST /api/auth/recuperar-contrasena y espera 202, sin token', async () => {
    iniciarSesionDePrueba('HUESPED')
    const respuesta = { mensaje: 'ok', enlaceSimulado: 'http://x/y?token=1' }
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify(respuesta), { status: 202 }),
    )

    const resultado = await solicitarRecuperacion('a@b.co')

    expect(resultado).toEqual({ estado: 'ok', datos: respuesta })
    expect(fetchSimulado).toHaveBeenCalledWith(
      `${API}/api/auth/recuperar-contrasena`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'a@b.co' }),
      },
    )
  })

  it('restablece con POST /api/auth/restablecer-contrasena y espera 204', async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }))

    const resultado = await restablecerContrasena({
      token: 't',
      nuevaContrasena: 'Clave-1a',
    })

    expect(resultado).toEqual({ estado: 'ok', datos: undefined })
    expect(fetchSimulado).toHaveBeenCalledWith(
      `${API}/api/auth/restablecer-contrasena`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 't', nuevaContrasena: 'Clave-1a' }),
      },
    )
  })

  it('devuelve 400 ENLACE_INVALIDO con su mensaje', async () => {
    fetchSimulado.mockResolvedValue(
      new Response(
        JSON.stringify({ codigo: 'ENLACE_INVALIDO', mensaje: 'x' }),
        {
          status: 400,
        },
      ),
    )

    const resultado = await restablecerContrasena({
      token: 't',
      nuevaContrasena: 'Clave-1a',
    })

    expect(resultado.estado === 'error' && resultado.error).toMatchObject({
      codigo: 'ENLACE_INVALIDO',
      mensaje:
        'Este enlace para restablecer la contraseña venció, ya se usó o no existe. Pide uno nuevo para continuar.',
    })
  })
})
