import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  aprobarPublicacion,
  listarPendientes,
  obtenerPublicacionRevision,
  rechazarPublicacion,
  type PublicacionRevision,
} from '../../api/admin'
import {
  listarPoliticasCancelacion,
  listarServicios,
} from '../../api/catalogos'
import type { ResultadoApi } from '../../api/cliente'
import { interpretarRespuestaError } from '../../api/errores'
import type { EstadoPublicacion, Publicacion } from '../../api/publicaciones'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/admin', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/admin')>()),
  listarPendientes: vi.fn(),
  obtenerPublicacionRevision: vi.fn(),
  aprobarPublicacion: vi.fn(),
  rechazarPublicacion: vi.fn(),
}))
vi.mock('../../api/catalogos', () => ({
  listarPoliticasCancelacion: vi.fn(),
  listarServicios: vi.fn(),
}))

const obtener = vi.mocked(obtenerPublicacionRevision)
const aprobar = vi.mocked(aprobarPublicacion)
const rechazar = vi.mocked(rechazarPublicacion)
const listar = vi.mocked(listarPendientes)

const RUTA = '/admin/publicaciones/p-7'
const MOTIVO_VALIDO = 'Las fotos no corresponden al alojamiento descrito.'

function publicacion(
  estado: EstadoPublicacion = 'PENDIENTE_REVISION',
  cambios: Partial<Publicacion> = {},
): Publicacion {
  return {
    id: 'p-7',
    estado,
    titulo: 'Cabaña entre pinos',
    descripcion: 'Cabaña de madera con terraza.\nCerca del embalse.',
    ciudad: 'Guatapé',
    ubicacionTextual: 'Vereda La Piedra, km 2',
    tipo: 'CABANA',
    capacidad: 5,
    precioNoche: 320000,
    tarifaLimpieza: 45000,
    politicaCancelacionId: 'pol-2',
    modoReserva: 'CON_APROBACION',
    reglas: 'No fumar.',
    serviciosIds: ['s-1', 's-2'],
    serviciosAdicionales: [{ nombre: 'Kayak por día', costo: 60000 }],
    imagenes: ['http://fotos.prueba/1.jpg', 'http://fotos.prueba/2.jpg'],
    ...cambios,
  }
}

const filaBandeja: PublicacionRevision = {
  id: 'p-7',
  titulo: 'Cabaña entre pinos',
  ciudad: 'Guatapé',
  tipo: 'CABANA',
  capacidad: 5,
  precioNoche: 320000,
  estado: 'PENDIENTE_REVISION',
  anfitrionId: 'a-1',
  anfitrionNombre: 'Carlos Mejía',
  fechaEnvio: '2026-11-12T15:00:00Z',
}

async function errorDelServidor<T = Publicacion>(
  cuerpo: object,
  status: number,
): Promise<ResultadoApi<T>> {
  return {
    estado: 'error',
    error: await interpretarRespuestaError(
      new Response(JSON.stringify(cuerpo), { status }),
    ),
  }
}

const error409 = () =>
  errorDelServidor(
    { codigo: 'ESTADO_PUBLICACION_INVALIDO', mensaje: 'No está en PENDIENTE_REVISION' },
    409,
  )
const error404 = () =>
  errorDelServidor({ codigo: 'PUBLICACION_NO_ENCONTRADA', mensaje: 'x' }, 404)
const error403 = () =>
  errorDelServidor({ codigo: 'ACCESO_DENEGADO', mensaje: 'x' }, 403)

// Promesa diferida
function diferida<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((r) => {
    resolver = r
  })
  return { promesa, resolver }
}

async function abrir(datos = publicacion(), estado?: unknown) {
  obtener.mockResolvedValue({ estado: 'ok', datos })
  const app = renderizarApp(estado ? { pathname: RUTA, state: estado } : RUTA)
  await screen.findByRole('heading', { level: 1, name: datos.titulo })
  return app
}

const boton = (nombre: string) => screen.getByRole('button', { name: nombre })
const panel = () => screen.getByRole('complementary', { name: 'Tu decisión' })
// Aviso de resultado
async function resultado(texto: RegExp) {
  const aviso = (await screen.findByText(texto)).closest('[role="status"]')
  expect(aviso).not.toBeNull()
  return aviso as HTMLElement
}
const campoMotivo = () => screen.getByLabelText('Motivo del rechazo')

beforeEach(() => {
  iniciarSesionDePrueba('ADMINISTRADOR')
  obtener.mockReset()
  aprobar.mockReset()
  rechazar.mockReset()
  listar.mockReset()
  listar.mockResolvedValue({ estado: 'ok', datos: [] })
  vi.mocked(listarServicios).mockResolvedValue({
    estado: 'ok',
    datos: [
      { id: 's-1', nombre: 'Wifi' },
      { id: 's-2', nombre: 'Chimenea' },
      { id: 's-3', nombre: 'Piscina' },
    ],
  })
  vi.mocked(listarPoliticasCancelacion).mockResolvedValue({
    estado: 'ok',
    datos: [
      { id: 'pol-1', nombre: 'Flexible' },
      { id: 'pol-2', nombre: 'Moderada', horasAntesLlegada: 120, porcentajeDevolucion: 50 },
    ],
  })
})

describe('detalle de revisión', () => {
  it('muestra el estado de carga', () => {
    obtener.mockReturnValue(new Promise(() => {}))
    renderizarApp(RUTA)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando publicación…')
    expect(obtener).toHaveBeenCalledWith('p-7')
  })

  it('muestra todo lo que llenó el anfitrión', async () => {
    await abrir(publicacion(), { fila: filaBandeja })

    expect(screen.getByText('En revisión')).toHaveTextContent('Estado: En revisión')
    expect(screen.getByText(/Enviada por/)).toHaveTextContent(
      /Enviada por Carlos Mejía el 12 de nov de 2026, 10:00/,
    )

    const seccion = (nombre: string) => screen.getByRole('region', { name: nombre })

    expect(seccion('Fotos (2)')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Foto 1 de Cabaña entre pinos' })).toHaveAttribute(
      'src',
      'http://fotos.prueba/1.jpg',
    )
    expect(screen.getByRole('img', { name: 'Foto 2 de Cabaña entre pinos' })).toBeInTheDocument()
    expect(within(seccion('Fotos (2)')).getByText('Portada')).toBeInTheDocument()

    expect(seccion('Descripción')).toHaveTextContent('Cabaña de madera con terraza.')
    expect(seccion('Alojamiento y precio')).toHaveTextContent('Cabaña')
    expect(seccion('Alojamiento y precio')).toHaveTextContent('5 huéspedes')
    expect(seccion('Alojamiento y precio')).toHaveTextContent(/\$\s?320\.000/)
    expect(seccion('Alojamiento y precio')).toHaveTextContent(/\$\s?45\.000/)
    expect(seccion('Alojamiento y precio')).toHaveTextContent('Con aprobación del anfitrión')
    expect(seccion('Ubicación')).toHaveTextContent('Guatapé')
    expect(seccion('Ubicación')).toHaveTextContent('Vereda La Piedra, km 2')

    const servicios = await within(seccion('Servicios')).findAllByRole('listitem')
    expect(servicios.map((s) => s.textContent)).toEqual(['Wifi', 'Chimenea'])

    expect(seccion('Servicios adicionales')).toHaveTextContent('Kayak por día')
    expect(seccion('Servicios adicionales')).toHaveTextContent(/\$\s?60\.000/)
    expect(seccion('Reglas de la casa')).toHaveTextContent('No fumar.')
    expect(seccion('Política de cancelación')).toHaveTextContent('Moderada')
    expect(seccion('Política de cancelación')).toHaveTextContent(
      'Devuelve el 50 % si se cancela hasta 120 horas antes de la llegada.',
    )

    expect(within(panel()).getByRole('button', { name: 'Aprobar' })).toBeEnabled()
    expect(within(panel()).getByRole('button', { name: 'Rechazar' })).toBeEnabled()
  })

  it('indica los datos que faltan y si los catálogos no cargan', async () => {
    vi.mocked(listarServicios).mockResolvedValue(
      await errorDelServidor({ codigo: 'ACCESO_DENEGADO', mensaje: 'x' }, 403),
    )
    vi.mocked(listarPoliticasCancelacion).mockResolvedValue(
      await errorDelServidor({ codigo: 'ACCESO_DENEGADO', mensaje: 'x' }, 403),
    )
    await abrir(
      publicacion('PENDIENTE_REVISION', {
        imagenes: [],
        reglas: '',
        serviciosAdicionales: [],
      }),
    )

    expect(screen.getByText('El anfitrión no agregó fotos.')).toBeInTheDocument()
    expect(screen.getByText('No indicó reglas.')).toBeInTheDocument()
    expect(
      screen.getByText('No ofrece servicios adicionales con costo.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/Marcó 2 servicios, pero no pudimos cargar sus nombres/),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No pudimos cargar el nombre de la política elegida.'),
    ).toBeInTheDocument()
    // Catálogo sin permiso
    expect(boton('Aprobar')).toBeEnabled()
  })

  it('si ya no está pendiente no ofrece decidir', async () => {
    await abrir(publicacion('ACTIVA'))

    expect(screen.getByRole('heading', { name: 'Ya no está pendiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
  })

  describe('al cargar', () => {
    it('un 404 dice que no existe', async () => {
      obtener.mockResolvedValue(await error404())
      renderizarApp(RUTA)

      expect(
        await screen.findByRole('heading', { name: 'Publicación no encontrada' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Volver a la bandeja' })).toHaveAttribute(
        'href',
        '/admin',
      )
    })

    it('un 403 es acceso denegado', async () => {
      obtener.mockResolvedValue(await error403())
      renderizarApp(RUTA)

      expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument()
    })

    it('otro error permite reintentar', async () => {
      obtener.mockResolvedValueOnce(
        await errorDelServidor({ codigo: 'ERROR_INTERNO', mensaje: 'x' }, 500),
      )
      obtener.mockResolvedValueOnce({ estado: 'ok', datos: publicacion() })
      const { usuario } = renderizarApp(RUTA)

      await usuario.click(await screen.findByRole('button', { name: 'Reintentar' }))

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Cabaña entre pinos' }),
      ).toBeInTheDocument()
    })
  })

  describe('aprobar', () => {
    it('pide confirmación antes de llamar al servidor', async () => {
      const { usuario } = await abrir()

      await usuario.click(boton('Aprobar'))

      expect(aprobar).not.toHaveBeenCalled()
      expect(panel()).toHaveTextContent('¿Aprobar «Cabaña entre pinos»?')
      expect(boton('Sí, aprobar')).toHaveFocus()

      await usuario.click(boton('Cancelar'))
      expect(boton('Aprobar')).toBeInTheDocument()
      expect(aprobar).not.toHaveBeenCalled()
    })

    it('bloquea los botones mientras envía y vuelve a la bandeja sin ella', async () => {
      const respuesta = diferida<ResultadoApi<Publicacion>>()
      aprobar.mockReturnValue(respuesta.promesa)
      listar.mockResolvedValue({
        estado: 'ok',
        datos: [{ ...filaBandeja, id: 'p-8', titulo: 'Otra pendiente' }],
      })
      const { router, usuario } = await abrir()

      await usuario.click(boton('Aprobar'))
      await usuario.click(boton('Sí, aprobar'))

      expect(aprobar).toHaveBeenCalledExactlyOnceWith('p-7')
      expect(boton('Aprobando…')).toBeDisabled()
      expect(boton('Cancelar')).toBeDisabled()

      respuesta.resolver({ estado: 'ok', datos: publicacion('ACTIVA') })

      expect(await resultado(/ya está activa/)).toHaveTextContent(
        '«Cabaña entre pinos» ya está activa y visible para los huéspedes.',
      )
      expect(router.state.location.pathname).toBe('/admin')
      expect(await screen.findByRole('link', { name: 'Otra pendiente' })).toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'Cabaña entre pinos' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('rechazar', () => {
    it('advierte que el anfitrión leerá el motivo', async () => {
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))

      expect(campoMotivo()).toHaveFocus()
      expect(campoMotivo()).toHaveAccessibleDescription(
        /El anfitrión leerá este texto tal como lo escribas/,
      )
      expect(screen.getByText('0 de 500 caracteres (mínimo 10)')).toBeInTheDocument()
    })

    it('sin motivo no envía y lo indica junto al campo', async () => {
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      await usuario.click(boton('Rechazar publicación'))

      expect(rechazar).not.toHaveBeenCalled()
      expect(campoMotivo()).toHaveAttribute('aria-invalid', 'true')
      expect(campoMotivo()).toHaveAccessibleDescription(/Escribe el motivo del rechazo\./)
      expect(campoMotivo()).toHaveFocus()
    })

    it('con un motivo de menos de 10 caracteres no envía', async () => {
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      // Espacios en los extremos
      await usuario.type(campoMotivo(), '   Corto    ')
      await usuario.click(boton('Rechazar publicación'))

      expect(rechazar).not.toHaveBeenCalled()
      expect(
        screen.getByText('El motivo debe tener al menos 10 caracteres.'),
      ).toBeInTheDocument()
    })

    it('con un motivo de más de 500 caracteres no envía', async () => {
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      await usuario.click(campoMotivo())
      await usuario.paste('a'.repeat(501))
      await usuario.click(boton('Rechazar publicación'))

      expect(rechazar).not.toHaveBeenCalled()
      expect(
        screen.getByText('El motivo no puede superar los 500 caracteres.'),
      ).toBeInTheDocument()
      expect(screen.getByText('501 de 500 caracteres (mínimo 10)')).toHaveClass(
        'panel-decision__conteo--excedido',
      )
    })

    it('el error desaparece al corregir el motivo', async () => {
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      await usuario.click(boton('Rechazar publicación'))
      await usuario.type(campoMotivo(), MOTIVO_VALIDO)

      expect(campoMotivo()).not.toHaveAttribute('aria-invalid')
      expect(screen.queryByText('Escribe el motivo del rechazo.')).not.toBeInTheDocument()
    })

    it('con motivo válido envía el texto limpio, bloquea y vuelve a la bandeja', async () => {
      const respuesta = diferida<ResultadoApi<Publicacion>>()
      rechazar.mockReturnValue(respuesta.promesa)
      const { router, usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      await usuario.type(campoMotivo(), `  ${MOTIVO_VALIDO}  `)
      await usuario.click(boton('Rechazar publicación'))

      expect(rechazar).toHaveBeenCalledExactlyOnceWith('p-7', MOTIVO_VALIDO)
      expect(boton('Rechazando…')).toBeDisabled()
      expect(boton('Cancelar')).toBeDisabled()
      expect(campoMotivo()).toBeDisabled()

      respuesta.resolver({
        estado: 'ok',
        datos: publicacion('BORRADOR', { motivoEstado: MOTIVO_VALIDO }),
      })

      expect(await resultado(/volvió a borrador/)).toHaveTextContent(
        '«Cabaña entre pinos» volvió a borrador. El anfitrión verá tu motivo para corregirla.',
      )
      expect(router.state.location.pathname).toBe('/admin')
    })

    it('muestra junto al campo el error de validación del servidor', async () => {
      rechazar.mockResolvedValue(
        await errorDelServidor(
          {
            codigo: 'SOLICITUD_INVALIDA',
            mensaje: 'x',
            detalles: [{ campo: 'motivo', mensaje: 'El motivo debe tener entre 10 y 500 caracteres.' }],
          },
          400,
        ),
      )
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      await usuario.type(campoMotivo(), MOTIVO_VALIDO)
      await usuario.click(boton('Rechazar publicación'))

      expect(
        await screen.findByText('El motivo debe tener entre 10 y 500 caracteres.'),
      ).toBeInTheDocument()
      expect(campoMotivo()).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('errores al decidir', () => {
    async function aprobarCon(resultado: ResultadoApi<Publicacion>) {
      aprobar.mockResolvedValue(resultado)
      const app = await abrir()
      await app.usuario.click(boton('Aprobar'))
      await app.usuario.click(boton('Sí, aprobar'))
      return app
    }

    it('409: otro administrador ya la revisó e indica recargar', async () => {
      const { router } = await aprobarCon(await error409())

      const aviso = await screen.findByRole('alert')
      expect(aviso).toHaveTextContent('Otro administrador ya la revisó')
      expect(aviso).toHaveTextContent('Recarga la bandeja')
      expect(within(aviso).getByRole('link', { name: 'Recargar la bandeja' })).toHaveAttribute(
        'href',
        '/admin',
      )
      expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Sí, aprobar/ })).not.toBeInTheDocument()
      // Ficha visible
      expect(screen.getByRole('heading', { level: 1, name: 'Cabaña entre pinos' })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe(RUTA)
    })

    it('409 también al rechazar', async () => {
      rechazar.mockResolvedValue(await error409())
      const { usuario } = await abrir()

      await usuario.click(boton('Rechazar'))
      await usuario.type(campoMotivo(), MOTIVO_VALIDO)
      await usuario.click(boton('Rechazar publicación'))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Otro administrador ya la revisó',
      )
      expect(screen.queryByLabelText('Motivo del rechazo')).not.toBeInTheDocument()
    })

    it('404: la publicación ya no existe', async () => {
      await aprobarCon(await error404())

      const aviso = await screen.findByRole('alert')
      expect(aviso).toHaveTextContent('Esta publicación ya no existe')
      expect(within(aviso).getByRole('link', { name: 'Recargar la bandeja' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument()
    })

    it('403: acceso denegado', async () => {
      await aprobarCon(await error403())

      expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument()
      expect(
        screen.getByText(/Tu cuenta no tiene permiso para revisar publicaciones/),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument()
    })

    it('otro error se muestra y deja reintentar', async () => {
      aprobar.mockResolvedValueOnce(
        await errorDelServidor(
          { codigo: 'ERROR_INTERNO', mensaje: 'x', correlationId: 'ref-9' },
          500,
        ),
      )
      aprobar.mockResolvedValueOnce({ estado: 'ok', datos: publicacion('ACTIVA') })
      const { router, usuario } = await abrir()

      await usuario.click(boton('Aprobar'))
      await usuario.click(boton('Sí, aprobar'))

      expect(await screen.findByRole('alert')).toHaveTextContent(/Código de referencia: ref-9/)
      expect(boton('Sí, aprobar')).toBeEnabled()

      await usuario.click(boton('Sí, aprobar'))
      await resultado(/ya está activa/)
      expect(router.state.location.pathname).toBe('/admin')
    })
  })
})
