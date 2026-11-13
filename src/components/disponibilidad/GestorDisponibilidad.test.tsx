import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResultadoApi } from '../../api/cliente'
import type { ErrorApi } from '../../api/errores'
import {
  actualizarPeriodo,
  crearPeriodo,
  eliminarPeriodo,
  listarPeriodos,
  type Periodo,
} from '../../api/periodos'
import { routes } from '../../routes'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/periodos', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/periodos')>()),
  listarPeriodos: vi.fn(),
  crearPeriodo: vi.fn(),
  actualizarPeriodo: vi.fn(),
  eliminarPeriodo: vi.fn(),
}))

const listar = vi.mocked(listarPeriodos)
const crear = vi.mocked(crearPeriodo)
const actualizar = vi.mocked(actualizarPeriodo)
const eliminar = vi.mocked(eliminarPeriodo)

const diciembre: Periodo = {
  id: 'a',
  publicacionId: 'p1',
  fechaInicio: '2026-12-01',
  fechaFin: '2026-12-10',
}
const enero: Periodo = {
  id: 'b',
  publicacionId: 'p1',
  fechaInicio: '2027-01-05',
  fechaFin: '2027-01-08',
}

const reservas = [
  {
    id: 'r1',
    fechaLlegada: '2026-12-02',
    fechaSalida: '2026-12-04',
    numeroHuespedes: 2,
    estado: 'PENDIENTE_PAGO',
  },
]

function fallo<T>(parcial: Partial<ErrorApi>): ResultadoApi<T> {
  return {
    estado: 'error',
    error: {
      codigo: 'ERROR_INTERNO',
      mensaje: 'Falló el servidor.',
      erroresPorCampo: {},
      ...parcial,
    },
  }
}

function renderPantalla() {
  const router = createMemoryRouter(routes, {
    initialEntries: ['/publicaciones/p1/disponibilidad'],
  })
  render(<RouterProvider router={router} />)
  return userEvent.setup()
}

function llenarFechas(inicio: string, fin: string) {
  fireEvent.change(screen.getByLabelText('Fecha de inicio'), {
    target: { value: inicio },
  })
  fireEvent.change(screen.getByLabelText('Fecha final'), {
    target: { value: fin },
  })
}

function periodosMostrados() {
  return within(screen.getByRole('list', { name: 'Periodos disponibles' }))
    .getAllByRole('listitem')
    .map((fila) => fila.querySelector('.fila-periodo__rango')?.textContent)
}

async function esperarLista() {
  await screen.findByRole('heading', { name: 'Disponibilidad' })
}

describe('disponibilidad', () => {
  beforeEach(() => {
    iniciarSesionDePrueba('ANFITRION')
    vi.useFakeTimers({
      toFake: ['Date'],
      now: new Date('2026-11-10T15:00:00Z'),
    })
    listar.mockReset()
    crear.mockReset()
    actualizar.mockReset()
    eliminar.mockReset()
    listar.mockResolvedValue({ estado: 'ok', datos: [enero, diciembre] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('listado', () => {
    it('muestra el estado de carga y los periodos ordenados por inicio', async () => {
      renderPantalla()

      expect(screen.getByText('Cargando disponibilidad…')).toBeInTheDocument()
      await esperarLista()
      expect(listar).toHaveBeenCalledWith('p1')
      expect(periodosMostrados()).toEqual([
        '1 de diciembre de 2026 al 10 de diciembre de 2026',
        '5 de enero de 2027 al 8 de enero de 2027',
      ])
    })

    it('muestra el estado vacío', async () => {
      listar.mockResolvedValue({ estado: 'ok', datos: [] })
      renderPantalla()

      expect(
        await screen.findByText(
          'Aún no hay periodos disponibles. Agrega el primero.',
        ),
      ).toBeInTheDocument()
    })

    it('permite reintentar si falla la carga', async () => {
      listar.mockResolvedValueOnce(fallo({}))
      const usuario = renderPantalla()

      await usuario.click(
        await screen.findByRole('button', { name: 'Reintentar' }),
      )

      await esperarLista()
      expect(listar).toHaveBeenCalledTimes(2)
    })

    it('muestra Acceso denegado si la publicación no es del anfitrión', async () => {
      listar.mockResolvedValue(fallo({ codigo: 'ACCESO_DENEGADO' }))
      renderPantalla()

      expect(
        await screen.findByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument()
    })

    it('indica cuando la publicación no existe', async () => {
      listar.mockResolvedValue(fallo({ codigo: 'PUBLICACION_NO_ENCONTRADA' }))
      renderPantalla()

      expect(
        await screen.findByRole('heading', {
          name: 'Publicación no encontrada',
        }),
      ).toBeInTheDocument()
    })

    it('enlaza de vuelta a editar la publicación', async () => {
      renderPantalla()
      await esperarLista()

      expect(
        screen.getByRole('link', { name: '← Volver a la publicación' }),
      ).toHaveAttribute('href', '/publicaciones/p1/editar')
    })
  })

  describe('crear', () => {
    it('crea un periodo y lo ubica en orden', async () => {
      const noviembre: Periodo = {
        id: 'c',
        publicacionId: 'p1',
        fechaInicio: '2026-11-20',
        fechaFin: '2026-11-21',
      }
      crear.mockResolvedValue({ estado: 'ok', datos: noviembre })
      const usuario = renderPantalla()
      await esperarLista()

      llenarFechas('2026-11-20', '2026-11-21')
      await usuario.click(
        screen.getByRole('button', { name: 'Agregar periodo' }),
      )

      expect(await screen.findByText('Periodo creado')).toBeInTheDocument()
      expect(crear).toHaveBeenCalledExactlyOnceWith('p1', {
        fechaInicio: '2026-11-20',
        fechaFin: '2026-11-21',
      })
      expect(periodosMostrados()[0]).toBe(
        '20 de noviembre de 2026 al 21 de noviembre de 2026',
      )
      expect(screen.getByLabelText('Fecha de inicio')).toHaveValue('')
    })

    it.each([
      ['vacías', '', '', 'La fecha de inicio es obligatoria.'],
      [
        'con fin anterior',
        '2026-12-10',
        '2026-12-09',
        'La fecha final no puede ser anterior a la inicial.',
      ],
      [
        'en el pasado',
        '2026-11-09',
        '2026-11-20',
        'El periodo no puede empezar en el pasado.',
      ],
    ])('no llama a la API con fechas %s', async (_caso, inicio, fin, error) => {
      const usuario = renderPantalla()
      await esperarLista()

      llenarFechas(inicio, fin)
      await usuario.click(
        screen.getByRole('button', { name: 'Agregar periodo' }),
      )

      expect(screen.getByText(error)).toBeInTheDocument()
      expect(crear).not.toHaveBeenCalled()
    })

    it('muestra PERIODO_CRUZADO como aviso general', async () => {
      crear.mockResolvedValue(
        fallo({
          codigo: 'PERIODO_CRUZADO',
          mensaje: 'Las fechas se cruzan con otro periodo.',
        }),
      )
      const usuario = renderPantalla()
      await esperarLista()

      llenarFechas('2026-12-05', '2026-12-20')
      await usuario.click(
        screen.getByRole('button', { name: 'Agregar periodo' }),
      )

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Las fechas se cruzan con otro periodo.',
      )
    })

    it.each([
      ['PERIODO_EN_EL_PASADO', 'fechaInicio', 'Fecha de inicio'],
      ['FECHAS_INVALIDAS', 'fechaFin', 'Fecha final'],
    ])('muestra %s junto a su campo', async (codigo, campo, etiqueta) => {
      crear.mockResolvedValue(
        fallo({
          codigo,
          mensaje: 'Mensaje del manejador.',
          erroresPorCampo: { [campo]: 'Mensaje del manejador.' },
        }),
      )
      const usuario = renderPantalla()
      await esperarLista()

      llenarFechas('2026-12-20', '2026-12-21')
      await usuario.click(
        screen.getByRole('button', { name: 'Agregar periodo' }),
      )

      expect(
        await screen.findByText('Mensaje del manejador.'),
      ).toBeInTheDocument()
      expect(screen.getByLabelText(etiqueta)).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    })

    it('deshabilita el botón mientras guarda', async () => {
      let responder: (resultado: ResultadoApi<Periodo>) => void = () => {}
      crear.mockReturnValue(
        new Promise((resolver) => {
          responder = resolver
        }),
      )
      const usuario = renderPantalla()
      await esperarLista()

      llenarFechas('2026-12-20', '2026-12-21')
      await usuario.click(
        screen.getByRole('button', { name: 'Agregar periodo' }),
      )

      expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()

      responder(fallo({}))
      expect(await screen.findByRole('alert')).toBeInTheDocument()
    })
  })

  describe('editar', () => {
    async function abrirEdicion() {
      const usuario = renderPantalla()
      await esperarLista()
      await usuario.click(
        screen.getByRole('button', {
          name: /editar periodo del 1 de diciembre/i,
        }),
      )
      return usuario
    }

    it('carga las fechas y actualiza con PUT', async () => {
      actualizar.mockResolvedValue({
        estado: 'ok',
        datos: { ...diciembre, fechaFin: '2026-12-15' },
      })
      const usuario = await abrirEdicion()

      expect(screen.getByLabelText('Fecha de inicio')).toHaveValue('2026-12-01')
      expect(screen.getByLabelText('Fecha de inicio')).toHaveFocus()

      fireEvent.change(screen.getByLabelText('Fecha final'), {
        target: { value: '2026-12-15' },
      })
      await usuario.click(
        screen.getByRole('button', { name: 'Guardar cambios' }),
      )

      expect(await screen.findByText('Periodo actualizado')).toBeInTheDocument()
      expect(actualizar).toHaveBeenCalledExactlyOnceWith('p1', 'a', {
        fechaInicio: '2026-12-01',
        fechaFin: '2026-12-15',
      })
      expect(crear).not.toHaveBeenCalled()
      expect(periodosMostrados()[0]).toBe(
        '1 de diciembre de 2026 al 15 de diciembre de 2026',
      )
      expect(
        screen.getByRole('heading', { name: 'Nuevo periodo' }),
      ).toBeInTheDocument()
    })

    it('permite cancelar la edición', async () => {
      const usuario = await abrirEdicion()

      await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(
        screen.getByRole('heading', { name: 'Nuevo periodo' }),
      ).toBeInTheDocument()
      expect(screen.getByLabelText('Fecha de inicio')).toHaveValue('')
    })

    it('muestra las reservas afectadas al encoger un periodo', async () => {
      actualizar.mockResolvedValue(
        fallo({
          codigo: 'PERIODO_CON_RESERVAS',
          mensaje: 'El periodo tiene reservas activas.',
          detalles: reservas,
        }),
      )
      const usuario = await abrirEdicion()

      await usuario.click(
        screen.getByRole('button', { name: 'Guardar cambios' }),
      )

      const aviso = await screen.findByRole('alert')
      expect(aviso).toHaveTextContent('El periodo tiene reservas activas.')
      expect(aviso).toHaveTextContent(
        'Del 2 de diciembre de 2026 al 4 de diciembre de 2026 · 2 huéspedes · pendiente pago',
      )
    })
  })

  describe('eliminar', () => {
    async function pedirEliminar() {
      const usuario = renderPantalla()
      await esperarLista()
      await usuario.click(
        screen.getByRole('button', {
          name: /eliminar periodo del 1 de diciembre/i,
        }),
      )
      return usuario
    }

    it('pide confirmación y permite cancelar', async () => {
      const usuario = await pedirEliminar()

      expect(screen.getByText('¿Eliminar este periodo?')).toBeInTheDocument()
      expect(eliminar).not.toHaveBeenCalled()

      await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(
        screen.queryByText('¿Eliminar este periodo?'),
      ).not.toBeInTheDocument()
      expect(eliminar).not.toHaveBeenCalled()
    })

    it('elimina al confirmar', async () => {
      eliminar.mockResolvedValue({ estado: 'ok', datos: undefined })
      const usuario = await pedirEliminar()

      await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

      expect(await screen.findByText('Periodo eliminado')).toBeInTheDocument()
      expect(eliminar).toHaveBeenCalledExactlyOnceWith('p1', 'a')
      expect(periodosMostrados()).toEqual([
        '5 de enero de 2027 al 8 de enero de 2027',
      ])
    })

    it('muestra las reservas afectadas y conserva el periodo', async () => {
      eliminar.mockResolvedValue(
        fallo({
          codigo: 'PERIODO_CON_RESERVAS',
          mensaje: 'El periodo tiene reservas activas.',
          detalles: reservas,
        }),
      )
      const usuario = await pedirEliminar()

      await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Reservas afectadas:',
      )
      expect(periodosMostrados()).toHaveLength(2)
    })

    it('muestra Acceso denegado si la API responde 403', async () => {
      eliminar.mockResolvedValue(fallo({ codigo: 'ACCESO_DENEGADO' }))
      const usuario = await pedirEliminar()

      await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

      expect(
        await screen.findByRole('heading', { name: 'Acceso denegado' }),
      ).toBeInTheDocument()
    })
  })
})
