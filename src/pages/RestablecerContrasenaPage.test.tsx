import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderizarApp } from '../test/renderizarApp'

const API = 'http://api.prueba'
const RUTA = '/restablecer-contrasena?token=tok-123'
const CONTRASENA = 'Nueva-Clave1'
const fetchSimulado = vi.fn<typeof fetch>()

function responder(cuerpo: unknown, status: number) {
  fetchSimulado.mockResolvedValue(
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function responderError(codigo: string, extra = {}) {
  responder({ codigo, mensaje: 'Mensaje del servidor', ...extra }, 400)
}

const campoNueva = () => screen.getByLabelText('Nueva contraseña')
const campoConfirmar = () => screen.getByLabelText('Confirmar nueva contraseña')
const botonGuardar = () =>
  screen.getByRole('button', { name: 'Guardar contraseña' })

async function llenarYEnviar(
  usuario: UserEvent,
  nueva = CONTRASENA,
  confirmar = nueva,
) {
  if (nueva) await usuario.type(campoNueva(), nueva)
  if (confirmar) await usuario.type(campoConfirmar(), confirmar)
  await usuario.click(botonGuardar())
}

async function esperarEnlaceInvalido() {
  expect(
    await screen.findByRole('heading', { name: 'Este enlace ya no sirve' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Pedir un enlace nuevo' }),
  ).toHaveAttribute('href', '/recuperar-contrasena')
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

describe('RestablecerContrasenaPage', () => {
  it('envía el token de la URL y la nueva contraseña, y lleva al login con aviso', async () => {
    responder(undefined, 204)
    const { router, usuario } = renderizarApp(RUTA)

    expect(
      screen.getByRole('heading', { name: 'Crea una contraseña nueva' }),
    ).toBeInTheDocument()
    await llenarYEnviar(usuario)

    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tu contraseña quedó actualizada. Ya puedes iniciar sesión con la nueva.',
    )
    expect(fetchSimulado).toHaveBeenCalledWith(
      `${API}/api/auth/restablecer-contrasena`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok-123', nuevaContrasena: CONTRASENA }),
      },
    )
  })

  it('muestra la política de contraseña como ayuda', () => {
    renderizarApp(RUTA)

    expect(campoNueva()).toHaveAccessibleDescription(
      'De 8 a 128 caracteres, con mayúscula, minúscula, número y símbolo.',
    )
  })

  it('muestra el estado de carga mientras espera al servidor', async () => {
    let resolver: (respuesta: Response) => void = () => {}
    fetchSimulado.mockReturnValue(
      new Promise<Response>((r) => {
        resolver = r
      }),
    )
    const { router, usuario } = renderizarApp(RUTA)

    await llenarYEnviar(usuario)

    const cargando = screen.getByRole('button', {
      name: 'Guardando contraseña…',
    })
    expect(cargando).toBeDisabled()
    expect(cargando).toHaveAttribute('aria-busy', 'true')

    resolver(new Response(null, { status: 204 }))
    await screen.findByRole('heading', { name: 'Iniciar sesión' })
    expect(router.state.location.pathname).toBe('/login')
  })

  describe('enlace inválido', () => {
    it.each([
      '/restablecer-contrasena',
      '/restablecer-contrasena?token=',
      `/restablecer-contrasena?token=${'a'.repeat(201)}`,
    ])(
      'sin token utilizable (%s) ofrece pedir otro sin llamar al servidor',
      async (ruta) => {
        renderizarApp(ruta)

        await esperarEnlaceInvalido()
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Este enlace para restablecer la contraseña está incompleto.',
        )
        expect(
          screen.queryByLabelText('Nueva contraseña'),
        ).not.toBeInTheDocument()
        expect(fetchSimulado).not.toHaveBeenCalled()
      },
    )

    it('400 ENLACE_INVALIDO: explica que venció, se usó o no existe y ofrece pedir otro', async () => {
      responderError('ENLACE_INVALIDO', {
        correlationId: '6f1c2d3e-0000-4000-8000-000000000003',
      })
      const { router, usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario)

      await esperarEnlaceInvalido()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Este enlace para restablecer la contraseña venció, ya se usó o no existe. Pide uno nuevo para continuar.',
      )
      expect(router.state.location.pathname).toBe('/restablecer-contrasena')

      await usuario.click(
        screen.getByRole('link', { name: 'Pedir un enlace nuevo' }),
      )
      expect(
        screen.getByRole('heading', { name: 'Recuperar contraseña' }),
      ).toBeInTheDocument()
    })

    it('400 SOLICITUD_INVALIDA sobre el token también se trata como enlace inválido', async () => {
      responderError('SOLICITUD_INVALIDA', {
        detalles: [{ campo: 'token', mensaje: 'no debe estar vacío' }],
      })
      const { usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario)

      await esperarEnlaceInvalido()
    })
  })

  describe('errores de la contraseña', () => {
    it('valida los campos vacíos sin llamar al servidor', async () => {
      const { usuario } = renderizarApp(RUTA)

      await usuario.click(botonGuardar())

      expect(
        screen.getByText('Ingresa tu nueva contraseña.'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('Confirma tu nueva contraseña.'),
      ).toBeInTheDocument()
      expect(campoNueva()).toHaveFocus()
      expect(campoNueva()).toHaveAttribute('aria-invalid', 'true')
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it.each([
      ['corta', 'Ab1*'],
      ['sin mayúscula', 'nueva-clave1'],
      ['sin minúscula', 'NUEVA-CLAVE1'],
      ['sin número', 'Nueva-Clave'],
      ['sin símbolo', 'NuevaClave1'],
      ['demasiado larga', `Aa1*${'x'.repeat(125)}`],
    ])('rechaza una contraseña %s', async (_caso, contrasena) => {
      const { usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario, contrasena)

      expect(
        screen.getByText(
          'La contraseña debe tener de 8 a 128 caracteres, con mayúscula, minúscula, número y símbolo.',
        ),
      ).toBeInTheDocument()
      expect(campoNueva()).toHaveFocus()
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it('avisa cuando las contraseñas no coinciden', async () => {
      const { usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario, CONTRASENA, 'Otra-Clave1')

      expect(
        screen.getByText('Las contraseñas no coinciden.'),
      ).toBeInTheDocument()
      expect(campoConfirmar()).toHaveFocus()
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it('400 SOLICITUD_INVALIDA: muestra el detalle junto a la nueva contraseña', async () => {
      responderError('SOLICITUD_INVALIDA', {
        detalles: [
          {
            campo: 'nuevaContrasena',
            mensaje: 'La contraseña no cumple la política.',
          },
        ],
      })
      const { usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario)

      expect(
        await screen.findByText('La contraseña no cumple la política.'),
      ).toBeInTheDocument()
      expect(campoNueva()).toHaveFocus()
      expect(campoNueva()).toHaveAttribute('aria-invalid', 'true')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Este enlace ya no sirve' }),
      ).not.toBeInTheDocument()
    })

    it('400 SOLICITUD_INVALIDA sin detalles muestra el mensaje general', async () => {
      responderError('SOLICITUD_INVALIDA')
      const { usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Revisa los datos ingresados.',
      )
    })

    it('sin conexión avisa y permite reintentar', async () => {
      fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))
      const { usuario } = renderizarApp(RUTA)

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor.',
      )
      expect(botonGuardar()).toBeEnabled()
    })
  })
})
