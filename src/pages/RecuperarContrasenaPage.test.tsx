import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderizarApp } from '../test/renderizarApp'

const API = 'http://api.prueba'
const fetchSimulado = vi.fn<typeof fetch>()

function responder(cuerpo: unknown, status: number) {
  fetchSimulado.mockResolvedValue(
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

const campoCorreo = () => screen.getByLabelText('Correo')
const botonEnviar = () => screen.getByRole('button', { name: 'Enviar enlace' })

async function llenarYEnviar(usuario: UserEvent, correo = 'laura@correo.com') {
  await usuario.type(campoCorreo(), correo)
  await usuario.click(botonEnviar())
}

beforeEach(() => {
  fetchSimulado.mockReset()
  vi.stubGlobal('fetch', fetchSimulado)
  vi.stubEnv('VITE_API_URL', API)
  vi.stubEnv('VITE_SESION_DEMO', undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('RecuperarContrasenaPage', () => {
  it('se abre desde «¿Olvidaste tu contraseña?» en el login', async () => {
    const { router, usuario } = renderizarApp('/login')

    await usuario.click(
      screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }),
    )

    expect(router.state.location.pathname).toBe('/recuperar-contrasena')
    expect(
      screen.getByRole('heading', { name: 'Recuperar contraseña' }),
    ).toBeInTheDocument()
  })

  it('envía el correo y muestra una confirmación neutra', async () => {
    responder({ mensaje: 'Solicitud recibida' }, 202)
    const { usuario } = renderizarApp('/recuperar-contrasena')

    await llenarYEnviar(usuario, '  laura@correo.com ')

    expect(
      await screen.findByRole('heading', { name: 'Revisa tu correo' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Si laura@correo.com está registrado, te llegará un enlace para crear una contraseña nueva.',
    )
    expect(fetchSimulado).toHaveBeenCalledWith(
      `${API}/api/auth/recuperar-contrasena`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: 'laura@correo.com' }),
      },
    )
    // Sin perfil de desarrollo no aparece ningún enlace simulado.
    expect(
      screen.queryByText('Solo en desarrollo: correo simulado'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver a iniciar sesión' }),
    ).toHaveAttribute('href', '/login')
  })

  it('acepta un 202 sin cuerpo', async () => {
    responder(undefined, 202)
    const { usuario } = renderizarApp('/recuperar-contrasena')

    await llenarYEnviar(usuario)

    expect(
      await screen.findByRole('heading', { name: 'Revisa tu correo' }),
    ).toBeInTheDocument()
  })

  it('en desarrollo muestra enlaceSimulado como enlace directo', async () => {
    const enlace = 'http://localhost:5173/restablecer-contrasena?token=abc123'
    responder({ mensaje: 'ok', enlaceSimulado: enlace }, 202)
    const { usuario } = renderizarApp('/recuperar-contrasena')

    await llenarYEnviar(usuario)

    const panel = await screen.findByRole('region', {
      name: 'Solo en desarrollo: correo simulado',
    })
    expect(panel).toHaveTextContent('en producción no aparece')
    expect(
      within(panel).getByRole('link', {
        name: 'Abrir enlace para restablecer la contraseña',
      }),
    ).toHaveAttribute('href', enlace)
  })

  it('no muestra un enlaceSimulado con un esquema que no sea http(s)', async () => {
    responder({ enlaceSimulado: 'javascript:alert(1)' }, 202)
    const { usuario } = renderizarApp('/recuperar-contrasena')

    await llenarYEnviar(usuario)

    expect(
      await screen.findByRole('heading', { name: 'Revisa tu correo' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: 'Abrir enlace para restablecer la contraseña',
      }),
    ).not.toBeInTheDocument()
  })

  it('«Usar otro correo» vuelve al formulario', async () => {
    responder({}, 202)
    const { usuario } = renderizarApp('/recuperar-contrasena')

    await llenarYEnviar(usuario)
    await usuario.click(
      await screen.findByRole('button', { name: 'Usar otro correo' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Recuperar contraseña' }),
    ).toBeInTheDocument()
  })

  it('muestra el estado de carga mientras espera al servidor', async () => {
    let resolver: (respuesta: Response) => void = () => {}
    fetchSimulado.mockReturnValue(
      new Promise<Response>((r) => {
        resolver = r
      }),
    )
    const { usuario } = renderizarApp('/recuperar-contrasena')

    await llenarYEnviar(usuario)

    const cargando = screen.getByRole('button', { name: 'Enviando enlace…' })
    expect(cargando).toBeDisabled()
    expect(cargando).toHaveAttribute('aria-busy', 'true')

    resolver(new Response(JSON.stringify({}), { status: 202 }))
    expect(
      await screen.findByRole('heading', { name: 'Revisa tu correo' }),
    ).toBeInTheDocument()
  })

  describe('errores', () => {
    it('valida el correo vacío sin llamar al servidor', async () => {
      const { usuario } = renderizarApp('/recuperar-contrasena')

      await usuario.click(botonEnviar())

      expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
      expect(campoCorreo()).toHaveFocus()
      expect(campoCorreo()).toHaveAttribute('aria-invalid', 'true')
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it('rechaza un correo con formato inválido', async () => {
      const { usuario } = renderizarApp('/recuperar-contrasena')

      await llenarYEnviar(usuario, 'laura@correo')

      expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it('400 SOLICITUD_INVALIDA: muestra el detalle junto al correo', async () => {
      responder(
        {
          codigo: 'SOLICITUD_INVALIDA',
          mensaje: 'x',
          detalles: [{ campo: 'correo', mensaje: 'Correo no permitido.' }],
        },
        400,
      )
      const { usuario } = renderizarApp('/recuperar-contrasena')

      await llenarYEnviar(usuario)

      expect(
        await screen.findByText('Correo no permitido.'),
      ).toBeInTheDocument()
      expect(campoCorreo()).toHaveFocus()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('500 muestra el mensaje genérico con el código de referencia', async () => {
      responder(
        {
          codigo: 'ERROR_INTERNO',
          mensaje: 'x',
          correlationId: '6f1c2d3e-0000-4000-8000-000000000002',
        },
        500,
      )
      const { usuario } = renderizarApp('/recuperar-contrasena')

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos. Código de referencia: 6f1c2d3e-0000-4000-8000-000000000002.',
      )
    })

    it('sin conexión avisa y permite reintentar', async () => {
      fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))
      const { usuario } = renderizarApp('/recuperar-contrasena')

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor.',
      )
      expect(botonEnviar()).toBeEnabled()
    })
  })
})
