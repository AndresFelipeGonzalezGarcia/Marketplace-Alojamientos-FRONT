import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CLAVE_SESION,
  obtenerSesion,
  type RolUsuario,
} from '../auth/sesion'
import { renderizarApp } from '../test/renderizarApp'
import { crearSesionDePrueba, iniciarSesionDePrueba } from '../test/sesion'

const API = 'http://api.prueba'
const fetchSimulado = vi.fn<typeof fetch>()

function responder(cuerpo: unknown, status: number) {
  fetchSimulado.mockResolvedValue(
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function responderLogin(rol: RolUsuario = 'ANFITRION') {
  const sesion = crearSesionDePrueba(rol, { usuario: { nombre: 'Laura Ríos' } })
  responder({ ...sesion, tipo: 'Bearer' }, 200)
  return sesion
}

function responderError(codigo: string, status: number, extra = {}) {
  responder({ codigo, mensaje: 'Mensaje del servidor', ...extra }, status)
}

const campoCorreo = () => screen.getByLabelText('Correo')
const campoContrasena = () => screen.getByLabelText('Contraseña')
const botonEntrar = () =>
  within(screen.getByRole('main')).getByRole('button', {
    name: 'Iniciar sesión',
  })

async function llenarYEnviar(
  usuario: UserEvent,
  correo = 'laura@correo.com',
  contrasena = 'Clave-de-prueba',
) {
  await usuario.type(campoCorreo(), correo)
  await usuario.type(campoContrasena(), contrasena)
  await usuario.click(botonEntrar())
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

describe('LoginPage', () => {
  describe('login correcto', () => {
    it('envía las credenciales, guarda la sesión y va al inicio del rol', async () => {
      const sesion = responderLogin('ANFITRION')
      const { router, usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario, '  laura@correo.com ')

      expect(
        await screen.findByRole('heading', { name: 'Hola, Laura Ríos' }),
      ).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/')
      expect(fetchSimulado).toHaveBeenCalledWith(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: 'laura@correo.com',
          contrasena: 'Clave-de-prueba',
        }),
      })
      expect(obtenerSesion()).toEqual(sesion)
      // Se guarda lo que define la capa de sesión, sin `tipo`.
      expect(JSON.parse(localStorage.getItem(CLAVE_SESION) ?? '{}')).toEqual(
        sesion,
      )
      expect(
        within(screen.getByRole('banner')).getByText('Laura Ríos'),
      ).toBeInTheDocument()
    })

    it('muestra el estado de carga mientras espera al servidor', async () => {
      let resolver: (respuesta: Response) => void = () => {}
      fetchSimulado.mockReturnValue(
        new Promise<Response>((r) => {
          resolver = r
        }),
      )
      const { usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario)

      const cargando = screen.getByRole('button', { name: 'Iniciando sesión…' })
      expect(cargando).toBeDisabled()
      expect(cargando).toHaveAttribute('aria-busy', 'true')

      resolver(
        new Response(
          JSON.stringify({ codigo: 'ERROR_INTERNO', mensaje: 'x' }),
          { status: 500 },
        ),
      )
      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(botonEntrar()).toBeEnabled()
    })

    it('si ya hay sesión, sale del login hacia el inicio del rol', () => {
      iniciarSesionDePrueba('HUESPED')
      const { router } = renderizarApp('/login')

      expect(router.state.location.pathname).toBe('/')
    })
  })

  describe('regreso a la ruta de origen', () => {
    it('vuelve a la ruta protegida desde la que llegó', async () => {
      responderLogin('ANFITRION')
      const { router, usuario } = renderizarApp('/publicaciones/nueva?paso=2')
      expect(router.state.location.pathname).toBe('/login')

      await llenarYEnviar(usuario)

      expect(
        await screen.findByRole('heading', { name: 'Nueva publicación' }),
      ).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/publicaciones/nueva')
      expect(router.state.location.search).toBe('?paso=2')
    })

    it('tras una sesión expirada vuelve a donde estaba', async () => {
      responderLogin('ADMINISTRADOR')
      const { router, usuario } = renderizarApp({
        pathname: '/login',
        state: { desde: '/admin', motivo: 'expirada' },
      })

      expect(screen.getByText('Tu sesión expiró.')).toBeInTheDocument()
      await llenarYEnviar(usuario)

      expect(
        await screen.findByRole('heading', { name: 'Publicaciones pendientes' }),
      ).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/admin')
    })

    it.each(['//sitio-externo.test/robar', '/\\sitio-externo.test', '/login'])(
      'ignora un desde no válido (%s) y va al inicio',
      async (desde) => {
        responderLogin('HUESPED')
        const { router, usuario } = renderizarApp({
          pathname: '/login',
          state: { desde },
        })

        await llenarYEnviar(usuario)

        expect(
          await screen.findByRole('heading', { name: 'Hola, Laura Ríos' }),
        ).toBeInTheDocument()
        expect(router.state.location.pathname).toBe('/')
      },
    )
  })

  describe('errores', () => {
    it('valida en el navegador sin llamar al servidor', async () => {
      const { usuario } = renderizarApp('/login')

      await usuario.click(botonEntrar())

      expect(screen.getByText('Ingresa tu correo.')).toBeInTheDocument()
      expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
      expect(campoCorreo()).toHaveFocus()
      expect(campoCorreo()).toHaveAttribute('aria-invalid', 'true')
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it('rechaza un correo con formato inválido', async () => {
      const { usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario, 'laura@correo')

      expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it('401 CREDENCIALES_INVALIDAS: avisa, conserva el correo y pide de nuevo la contraseña', async () => {
      responderError('CREDENCIALES_INVALIDAS', 401)
      const { usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.',
      )
      expect(campoCorreo()).toHaveValue('laura@correo.com')
      expect(campoContrasena()).toHaveValue('')
      expect(campoContrasena()).toHaveFocus()
      expect(obtenerSesion()).toBeNull()
    })

    it.each([
      [
        'CUENTA_RESTRINGIDA',
        'Tu cuenta está restringida y por ahora no puede iniciar sesión. Comunícate con soporte para revisarla.',
      ],
      [
        'CUENTA_DESACTIVADA',
        'Tu cuenta está desactivada. Comunícate con soporte si quieres volver a activarla.',
      ],
    ])('403 %s: explica el estado de la cuenta', async (codigo, mensaje) => {
      responderError(codigo, 403, {
        correlationId: '6f1c2d3e-0000-4000-8000-000000000001',
      })
      const { router, usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        `${mensaje} Código de referencia: 6f1c2d3e-0000-4000-8000-000000000001.`,
      )
      expect(router.state.location.pathname).toBe('/login')
      expect(obtenerSesion()).toBeNull()
    })

    it('400 SOLICITUD_INVALIDA: muestra cada detalle junto a su campo', async () => {
      responderError('SOLICITUD_INVALIDA', 400, {
        detalles: [{ campo: 'correo', mensaje: 'Correo no permitido.' }],
      })
      const { usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario)

      expect(await screen.findByText('Correo no permitido.')).toBeInTheDocument()
      expect(campoCorreo()).toHaveFocus()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('sin conexión muestra el mensaje del manejador único', async () => {
      fetchSimulado.mockRejectedValue(new TypeError('Failed to fetch'))
      const { usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'No pudimos conectar con el servidor.',
      )
    })

    it('no guarda una respuesta 200 con formato inesperado', async () => {
      responder({ token: 'x' }, 200)
      const { router, usuario } = renderizarApp('/login')

      await llenarYEnviar(usuario)

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'respuesta inesperada del servidor',
      )
      expect(router.state.location.pathname).toBe('/login')
      expect(obtenerSesion()).toBeNull()
    })
  })

  describe('modo de desarrollo', () => {
    it('está apagado cuando la variable no existe', () => {
      renderizarApp('/login')

      expect(
        screen.queryByRole('button', {
          name: 'Entrar con una sesión de prueba',
        }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('Modo de desarrollo: sesión simulada'),
      ).not.toBeInTheDocument()
    })

    it.each(['false', 'TRUE', '1', ''])(
      'está apagado con VITE_SESION_DEMO=%j',
      (valor) => {
        vi.stubEnv('VITE_SESION_DEMO', valor)
        renderizarApp('/login')

        expect(
          screen.queryByRole('button', {
            name: 'Entrar con una sesión de prueba',
          }),
        ).not.toBeInTheDocument()
      },
    )

    it.each<[RolUsuario, string, string]>([
      ['ANFITRION', 'Entrar como anfitrión de prueba', 'Anfitrión de prueba'],
      ['HUESPED', 'Entrar como huésped de prueba', 'Huésped de prueba'],
      [
        'ADMINISTRADOR',
        'Entrar como administrador de prueba',
        'Administrador de prueba',
      ],
    ])(
      'con VITE_SESION_DEMO=true entra como %s sin llamar al backend',
      async (rol, boton, nombre) => {
        vi.stubEnv('VITE_SESION_DEMO', 'true')
        const { router, usuario } = renderizarApp('/login')

        expect(
          screen.getByText('Modo de desarrollo: sesión simulada'),
        ).toBeInTheDocument()

        const abrir = screen.getByRole('button', {
          name: 'Entrar con una sesión de prueba',
        })
        expect(abrir).toHaveAttribute('aria-expanded', 'false')
        await usuario.click(abrir)
        expect(abrir).toHaveAttribute('aria-expanded', 'true')

        const antes = Date.now()
        await usuario.click(screen.getByRole('button', { name: new RegExp(boton) }))

        const sesion = obtenerSesion()
        expect(sesion?.usuario).toMatchObject({ rol, nombre })
        const vence = Date.parse(sesion?.expiraEn ?? '') - antes
        expect(vence).toBeGreaterThan(59 * 60 * 1000)
        expect(vence).toBeLessThanOrEqual(60 * 60 * 1000 + 1000)
        expect(fetchSimulado).not.toHaveBeenCalled()
        expect(router.state.location.pathname).toBe('/')
        expect(
          within(screen.getByRole('banner')).getByText(nombre),
        ).toBeInTheDocument()
        // El aviso sigue visible mientras dura el modo.
        expect(
          screen.getByText('Modo de desarrollo: sesión simulada'),
        ).toBeInTheDocument()
      },
    )
  })
})
