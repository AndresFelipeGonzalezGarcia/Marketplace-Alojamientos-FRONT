import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarPendientes } from '../../api/admin'
import type { ResultadoApi } from '../../api/cliente'
import {
  actualizarTarifaServicio,
  obtenerTarifaServicio,
  type TarifaServicio,
} from '../../api/configuracion'
import { interpretarRespuestaError } from '../../api/errores'
import { renderizarApp } from '../../test/renderizarApp'
import { iniciarSesionDePrueba } from '../../test/sesion'

vi.mock('../../api/admin', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../../api/admin')>()),
  listarPendientes: vi.fn(),
}))
vi.mock('../../api/configuracion', () => ({
  obtenerTarifaServicio: vi.fn(),
  actualizarTarifaServicio: vi.fn(),
}))

const obtener = vi.mocked(obtenerTarifaServicio)
const actualizar = vi.mocked(actualizarTarifaServicio)

async function errorDelServidor(
  cuerpo: object,
  status: number,
): Promise<ResultadoApi<TarifaServicio>> {
  return {
    estado: 'error',
    error: await interpretarRespuestaError(
      new Response(JSON.stringify(cuerpo), { status }),
    ),
  }
}

function diferida<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((r) => {
    resolver = r
  })
  return { promesa, resolver }
}

const seccion = () =>
  within(screen.getByRole('region', { name: 'Tarifa de servicio' }))
const campo = () => seccion().getByLabelText('Porcentaje sobre el subtotal')
const guardar = () => seccion().getByRole('button', { name: 'Guardar tarifa' })

async function abrir() {
  const app = renderizarApp('/admin')
  await seccion().findByText(/Tarifa vigente/)
  return app
}

beforeEach(() => {
  iniciarSesionDePrueba('ADMINISTRADOR')
  vi.mocked(listarPendientes).mockResolvedValue({ estado: 'ok', datos: [] })
  obtener.mockReset()
  actualizar.mockReset()
  obtener.mockResolvedValue({ estado: 'ok', datos: { porcentaje: 8.5 } })
})

describe('tarifa de servicio', () => {
  describe('cargado', () => {
    it('muestra el estado de carga', () => {
      obtener.mockReturnValue(new Promise(() => {}))
      renderizarApp('/admin')

      expect(
        seccion().getByText('Cargando la tarifa de servicio…'),
      ).toHaveAttribute('role', 'status')
    })

    it('muestra el valor vigente y aclara a qué afecta el cambio', async () => {
      await abrir()

      expect(seccion().getByText(/Tarifa vigente/)).toHaveTextContent(
        'Tarifa vigente: 8,5 %',
      )
      expect(campo()).toHaveValue('8,5')
      expect(
        seccion().getByText(
          /solo afecta a las cotizaciones y reservas nuevas\. Las que ya se crearon conservan/,
        ),
      ).toBeInTheDocument()
      // Tarifa y bandeja
      expect(
        await screen.findByText('No hay publicaciones por revisar'),
      ).toBeInTheDocument()
    })

    it('si falla la carga permite reintentar', async () => {
      obtener.mockResolvedValueOnce(
        await errorDelServidor(
          { codigo: 'ERROR_INTERNO', mensaje: 'x', correlationId: 'ref-3' },
          500,
        ),
      )
      const { usuario } = renderizarApp('/admin')

      const alerta = await seccion().findByRole('alert')
      expect(alerta).toHaveTextContent(
        'No pudimos cargar la tarifa de servicio.',
      )
      expect(alerta).toHaveTextContent('Código de referencia: ref-3')

      await usuario.click(
        within(alerta).getByRole('button', { name: 'Reintentar' }),
      )

      expect(await seccion().findByText(/Tarifa vigente/)).toBeInTheDocument()
      expect(obtener).toHaveBeenCalledTimes(2)
    })

    it('si la consulta se rechaza muestra el error de conexión y permite reintentar', async () => {
      obtener.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      const { usuario } = renderizarApp('/admin')

      const alerta = await seccion().findByRole('alert')
      expect(alerta).toHaveTextContent('No pudimos cargar la tarifa de servicio.')
      expect(alerta).toHaveTextContent('No pudimos conectar con el servidor')

      await usuario.click(
        within(alerta).getByRole('button', { name: 'Reintentar' }),
      )

      expect(await seccion().findByText(/Tarifa vigente/)).toBeInTheDocument()
      expect(obtener).toHaveBeenCalledTimes(2)
    })

    it('no aparece para otros roles', () => {
      iniciarSesionDePrueba('ANFITRION')
      renderizarApp('/admin')

      expect(
        screen.queryByRole('region', { name: 'Tarifa de servicio' }),
      ).not.toBeInTheDocument()
      expect(obtener).not.toHaveBeenCalled()
    })
  })

  describe('guardado', () => {
    it('bloquea mientras guarda y confirma con el valor del servidor', async () => {
      const respuesta = diferida<ResultadoApi<TarifaServicio>>()
      actualizar.mockReturnValue(respuesta.promesa)
      const { usuario } = await abrir()

      await usuario.clear(campo())
      await usuario.type(campo(), '9,5')
      await usuario.click(guardar())

      expect(actualizar).toHaveBeenCalledExactlyOnceWith(9.5)
      const boton = seccion().getByRole('button', { name: 'Guardando…' })
      expect(boton).toBeDisabled()
      expect(campo()).toBeDisabled()

      respuesta.resolver({ estado: 'ok', datos: { porcentaje: 9.5 } })

      expect(await seccion().findByRole('status')).toHaveTextContent(
        'Tarifa guardada: 9,5 %.',
      )
      expect(seccion().getByText(/Tarifa vigente/)).toHaveTextContent(
        'Tarifa vigente: 9,5 %',
      )
      expect(guardar()).toBeEnabled()
    })

    it('acepta punto decimal y 0', async () => {
      actualizar.mockResolvedValue({ estado: 'ok', datos: { porcentaje: 0 } })
      const { usuario } = await abrir()

      await usuario.clear(campo())
      await usuario.type(campo(), '0')
      await usuario.click(guardar())

      expect(actualizar).toHaveBeenCalledWith(0)
      await usuario.clear(campo())
      await usuario.type(campo(), '12.5')
      await usuario.click(guardar())
      expect(actualizar).toHaveBeenLastCalledWith(12.5)
    })

    it('muestra el 400 del backend junto al campo', async () => {
      actualizar.mockResolvedValue(
        await errorDelServidor(
          {
            codigo: 'SOLICITUD_INVALIDA',
            mensaje: 'x',
            detalles: [
              {
                campo: 'porcentaje',
                mensaje: 'Debe ser un número entre 0 y 100.',
              },
            ],
          },
          400,
        ),
      )
      const { usuario } = await abrir()

      await usuario.click(guardar())

      expect(
        await seccion().findByText('Debe ser un número entre 0 y 100.'),
      ).toBeInTheDocument()
      expect(campo()).toHaveAttribute('aria-invalid', 'true')
      expect(campo()).toHaveAccessibleDescription(
        /Debe ser un número entre 0 y 100\./,
      )
      expect(seccion().queryByRole('status')).not.toBeInTheDocument()
    })

    it('otro error se muestra como aviso y deja reintentar', async () => {
      actualizar.mockResolvedValueOnce(
        await errorDelServidor({ codigo: 'ERROR_INTERNO', mensaje: 'x' }, 500),
      )
      actualizar.mockResolvedValueOnce({
        estado: 'ok',
        datos: { porcentaje: 8.5 },
      })
      const { usuario } = await abrir()

      await usuario.click(guardar())
      expect(await seccion().findByRole('alert')).toHaveTextContent(
        'Ocurrió un error inesperado',
      )

      await usuario.click(guardar())
      expect(await seccion().findByRole('status')).toHaveTextContent(
        'Tarifa guardada',
      )
    })
  })

  describe('validación en el cliente', () => {
    it.each([
      ['', 'Escribe el porcentaje.'],
      ['100,5', 'El porcentaje debe estar entre 0 y 100.'],
      ['-1', 'El porcentaje debe estar entre 0 y 100.'],
      ['8,55', 'Usa máximo un decimal, por ejemplo 8,5.'],
      ['ocho', 'Escribe solo números, por ejemplo 8,5.'],
    ])('«%s» no se guarda: %s', async (valor, mensaje) => {
      const { usuario } = await abrir()

      await usuario.clear(campo())
      if (valor) await usuario.type(campo(), valor)
      await usuario.click(guardar())

      expect(actualizar).not.toHaveBeenCalled()
      expect(campo()).toHaveAttribute('aria-invalid', 'true')
      expect(campo()).toHaveAccessibleDescription(
        new RegExp(mensaje.replace(/[.()]/g, '\\$&')),
      )
    })

    it('acepta el límite de 100 y el error se quita al corregir', async () => {
      actualizar.mockResolvedValue({ estado: 'ok', datos: { porcentaje: 100 } })
      const { usuario } = await abrir()

      await usuario.clear(campo())
      await usuario.type(campo(), '101')
      await usuario.click(guardar())
      expect(campo()).toHaveAttribute('aria-invalid', 'true')

      await usuario.clear(campo())
      await usuario.type(campo(), '100')
      expect(campo()).not.toHaveAttribute('aria-invalid')

      await usuario.click(guardar())
      expect(actualizar).toHaveBeenCalledWith(100)
    })
  })
})
