import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listarPoliticasCancelacion,
  listarServicios,
} from '../../api/catalogos'
import type { ResultadoApi } from '../../api/cliente'
import { interpretarRespuestaError } from '../../api/errores'
import {
  actualizarPublicacion,
  enviarPublicacion,
  obtenerPublicacion,
  type EstadoPublicacion,
  type Publicacion,
} from '../../api/publicaciones'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/publicaciones', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/publicaciones')>()),
  obtenerPublicacion: vi.fn(),
  actualizarPublicacion: vi.fn(),
  enviarPublicacion: vi.fn(),
}))
vi.mock('../../api/catalogos', () => ({
  listarPoliticasCancelacion: vi.fn(),
  listarServicios: vi.fn(),
}))

const obtener = vi.mocked(obtenerPublicacion)
const actualizar = vi.mocked(actualizarPublicacion)
const enviar = vi.mocked(enviarPublicacion)

function publicacion(
  estado: EstadoPublicacion,
  cambios: Partial<Publicacion> = {},
): Publicacion {
  return {
    id: 'p-7',
    estado,
    titulo: 'Casa de campo',
    descripcion: 'Con vista',
    ciudad: 'Medellín',
    ubicacionTextual: 'El Poblado',
    tipo: 'CABANA',
    capacidad: 4,
    imagenes: ['/fotos/1.jpg'],
    precioNoche: 200000,
    politicaCancelacionId: 'pol-1',
    modoReserva: 'INMEDIATA',
    reglas: '',
    serviciosIds: [],
    serviciosAdicionales: [],
    ...cambios,
  }
}

// Construye el error con el manejador único, como lo haría el cliente.
async function errorDelServidor(
  cuerpo: object,
  status: number,
): Promise<ResultadoApi<Publicacion>> {
  return {
    estado: 'error',
    error: await interpretarRespuestaError(
      new Response(JSON.stringify(cuerpo), { status }),
    ),
  }
}

async function abrir(estado: EstadoPublicacion, cambios = {}) {
  obtener.mockResolvedValue({
    estado: 'ok',
    datos: publicacion(estado, cambios),
  })
  const app = renderizarApp('/publicaciones/p-7/editar')
  await screen.findByRole('heading', { name: 'Editar publicación' })
  return app
}

const botonEnviar = () =>
  screen.getByRole('button', { name: 'Enviar a revisión' })
const campoTitulo = () => screen.getByLabelText('Título')

beforeEach(() => {
  iniciarSesionDePrueba('ANFITRION')
  obtener.mockReset()
  actualizar.mockReset()
  enviar.mockReset()
  vi.mocked(listarPoliticasCancelacion).mockResolvedValue({
    estado: 'ok',
    datos: [{ id: 'pol-1', nombre: 'Flexible' }],
  })
  vi.mocked(listarServicios).mockResolvedValue({ estado: 'ok', datos: [] })
})

describe('enviar a revisión', () => {
  it('muestra el estado actual de forma legible', async () => {
    await abrir('BORRADOR')

    const insignia = screen.getByText('Borrador')
    expect(insignia).toHaveClass('insignia-estado')
    expect(insignia).toHaveTextContent('Estado: Borrador')
    expect(botonEnviar()).toBeEnabled()
  })

  describe('envío correcto', () => {
    it('pasa a En revisión y deja la publicación en solo lectura', async () => {
      const { usuario } = await abrir('BORRADOR')
      enviar.mockResolvedValue({
        estado: 'ok',
        datos: publicacion('PENDIENTE_REVISION'),
      })

      await usuario.click(botonEnviar())

      expect(enviar).toHaveBeenCalledExactlyOnceWith('p-7')
      const confirmacion = await screen.findByRole('status')
      expect(confirmacion).toHaveTextContent('Enviada a revisión')
      expect(confirmacion).toHaveTextContent(
        'Un administrador la está revisando. Mientras tanto no se puede editar.',
      )
      expect(confirmacion).toHaveFocus()

      expect(screen.getByText('En revisión')).toHaveClass('insignia-estado')
      expect(
        screen.queryByRole('button', { name: 'Enviar a revisión' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Guardar borrador' }),
      ).not.toBeInTheDocument()
      expect(campoTitulo()).toBeDisabled()
      expect(campoTitulo()).toHaveValue('Casa de campo')
      expect(screen.getByLabelText('Descripción')).toBeDisabled()
      expect(screen.getByLabelText('Política de cancelación')).toBeDisabled()
      expect(
        screen.getByRole('radio', { name: /reserva inmediata/i }),
      ).toBeDisabled()
    })

    it('muestra Enviando… y bloquea los botones mientras espera', async () => {
      const { usuario } = await abrir('BORRADOR')
      enviar.mockReturnValue(new Promise(() => {}))

      await usuario.click(botonEnviar())

      expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
      expect(
        screen.getByRole('button', { name: 'Guardar borrador' }),
      ).toBeDisabled()
    })

    it('no deja enviar con cambios sin guardar', async () => {
      const { usuario } = await abrir('BORRADOR')
      actualizar.mockResolvedValue({
        estado: 'ok',
        datos: publicacion('BORRADOR', { titulo: 'Casa de campo nueva' }),
      })

      await usuario.type(campoTitulo(), ' nueva')

      expect(botonEnviar()).toBeDisabled()
      expect(botonEnviar()).toHaveAccessibleDescription(
        'Guarda los cambios antes de enviarla a revisión.',
      )

      await usuario.click(
        screen.getByRole('button', { name: 'Guardar borrador' }),
      )

      expect(await screen.findByText('Borrador guardado')).toBeInTheDocument()
      expect(botonEnviar()).toBeEnabled()
      expect(enviar).not.toHaveBeenCalled()
    })
  })

  describe('errores', () => {
    it('400 PUBLICACION_INCOMPLETA: marca cada detalle junto a su campo', async () => {
      const { usuario } = await abrir('BORRADOR')
      enviar.mockResolvedValue(
        await errorDelServidor(
          {
            codigo: 'PUBLICACION_INCOMPLETA',
            mensaje: 'Publication incomplete',
            detalles: [
              { campo: 'descripcion', mensaje: 'Escribe una descripción.' },
              {
                campo: 'precioNoche',
                mensaje: 'El precio debe ser mayor que 0.',
              },
            ],
          },
          400,
        ),
      )

      await usuario.click(botonEnviar())

      const descripcion = screen.getByLabelText('Descripción')
      expect(await screen.findByText('Escribe una descripción.')).toBeVisible()
      expect(descripcion).toHaveAttribute('aria-invalid', 'true')
      expect(descripcion).toHaveAccessibleDescription(
        'Escribe una descripción.',
      )
      expect(descripcion).toHaveFocus()

      const precio = screen.getByLabelText('Precio por noche (COP)')
      expect(precio).toHaveAttribute('aria-invalid', 'true')
      expect(precio).toHaveAccessibleDescription(
        'El precio debe ser mayor que 0.',
      )

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Completa los datos de la publicación. Revisa los campos marcados.',
      )
      // Sigue en borrador y editable para corregir.
      expect(screen.getByText('Borrador')).toHaveClass('insignia-estado')
      expect(campoTitulo()).toBeEnabled()
    })

    it('409 ESTADO_PUBLICACION_INVALIDO: lo explica como aviso general', async () => {
      const { usuario } = await abrir('BORRADOR')
      enviar.mockResolvedValue(
        await errorDelServidor(
          {
            codigo: 'ESTADO_PUBLICACION_INVALIDO',
            mensaje: 'Invalid state',
            correlationId: '6f1c2d3e-0000-4000-8000-000000000002',
          },
          409,
        ),
      )

      await usuario.click(botonEnviar())

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'La publicación no se puede modificar en su estado actual. Ya no está en borrador; recarga la página para ver su estado actual. Código de referencia: 6f1c2d3e-0000-4000-8000-000000000002.',
      )
      expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(0)
      expect(campoTitulo()).toBeEnabled()
    })

    it('403 ACCESO_DENEGADO bloquea la pantalla', async () => {
      const { usuario } = await abrir('BORRADOR')
      enviar.mockResolvedValue(
        await errorDelServidor(
          { codigo: 'ACCESO_DENEGADO', mensaje: 'x' },
          403,
        ),
      )

      await usuario.click(botonEnviar())

      expect(
        await screen.findByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument()
    })
  })

  describe('según el estado al abrir', () => {
    it('En revisión: solo lectura, sin envío ni controles de edición', async () => {
      await abrir('PENDIENTE_REVISION')

      expect(screen.getByText('En revisión')).toHaveClass('insignia-estado')
      expect(
        screen.queryByRole('button', { name: 'Enviar a revisión' }),
      ).not.toBeInTheDocument()
      expect(campoTitulo()).toBeDisabled()
      // Deshabilitado por el fieldset; el CSS además lo oculta.
      expect(
        screen.getByRole('button', { name: '+ Agregar foto' }),
      ).toBeDisabled()
      const aviso = screen
        .getByText(
          'Un administrador la está revisando. Mientras tanto no se puede editar.',
        )
        .closest('.aviso-estado')
      // Al abrirla ya en revisión no hay nada que confirmar.
      expect(aviso).not.toHaveAttribute('role')
      expect(aviso).not.toHaveTextContent('Enviada a revisión')
    })

    it('Bloqueada: solo lectura y muestra el motivo', async () => {
      await abrir('BLOQUEADA', { motivoEstado: 'Fotos que no son del lugar.' })

      expect(screen.getByText('Bloqueada')).toHaveClass('insignia-estado')
      expect(
        screen.getByText('Fotos que no son del lugar.'),
      ).toBeInTheDocument()
      expect(campoTitulo()).toBeDisabled()
    })

    it.each<EstadoPublicacion>(['ACTIVA', 'PAUSADA'])(
      '%s: se puede editar pero no enviar a revisión',
      async (estado) => {
        await abrir(estado)

        expect(campoTitulo()).toBeEnabled()
        expect(
          screen.queryByRole('button', { name: 'Enviar a revisión' }),
        ).not.toBeInTheDocument()
        expect(
          within(screen.getByRole('complementary')).getByRole('button', {
            name: 'Guardar borrador',
          }),
        ).toBeEnabled()
      },
    )
  })
})
