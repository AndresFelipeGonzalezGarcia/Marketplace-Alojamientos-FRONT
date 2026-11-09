import { describe, expect, it } from 'vitest'
import {
  errorDeConexion,
  interpretarRespuestaError,
  mensajeConReferencia,
} from './errores'

function respuesta(
  cuerpo: unknown,
  status: number,
  cabeceras?: Record<string, string>,
) {
  return new Response(JSON.stringify(cuerpo), { status, headers: cabeceras })
}

describe('interpretarRespuestaError', () => {
  it('muestra un mensaje claro y marca el campo con CORREO_YA_REGISTRADO', async () => {
    const error = await interpretarRespuestaError(
      respuesta(
        {
          codigo: 'CORREO_YA_REGISTRADO',
          mensaje: 'duplicate key',
          correlationId: 'abc',
        },
        409,
      ),
    )

    expect(error.codigo).toBe('CORREO_YA_REGISTRADO')
    expect(error.mensaje).toBe(
      'Este correo ya está registrado. Usa otro correo o inicia sesión.',
    )
    expect(error.erroresPorCampo).toEqual({ correo: error.mensaje })
    expect(error.correlationId).toBe('abc')
  })

  it('agrupa los detalles por campo', async () => {
    const error = await interpretarRespuestaError(
      respuesta(
        {
          codigo: 'SOLICITUD_INVALIDA',
          mensaje: 'Inválido',
          detalles: [
            { campo: 'contrasena', mensaje: 'Falta una mayúscula.' },
            { campo: 'contrasena', mensaje: 'Falta un número.' },
            { campo: 'telefono', mensaje: 'Muy largo.' },
          ],
        },
        400,
      ),
    )

    expect(error.erroresPorCampo).toEqual({
      contrasena: 'Falta una mayúscula. Falta un número.',
      telefono: 'Muy largo.',
    })
  })

  it('no toma como campos los detalles de otra forma', async () => {
    const reservas = [{ id: 'r1', estado: 'CONFIRMADA' }]
    const error = await interpretarRespuestaError(
      respuesta(
        {
          codigo: 'PERIODO_CON_RESERVAS',
          mensaje: 'Con reservas',
          detalles: reservas,
        },
        409,
      ),
    )

    expect(error.erroresPorCampo).toEqual({})
    expect(error.detalles).toEqual(reservas)
  })

  it('usa el mensaje del servidor con un código desconocido', async () => {
    const error = await interpretarRespuestaError(
      respuesta({ codigo: 'NUEVO_CODIGO', mensaje: 'Algo nuevo' }, 400),
    )

    expect(error.mensaje).toBe('Algo nuevo')
  })

  it('toma el correlationId de la cabecera si no viene en el cuerpo', async () => {
    const error = await interpretarRespuestaError(
      respuesta({ codigo: 'ERROR_INTERNO', mensaje: 'x' }, 500, {
        'X-Correlation-Id': 'cab-1',
      }),
    )

    expect(error.correlationId).toBe('cab-1')
  })

  it('tolera una respuesta que no es JSON', async () => {
    const error = await interpretarRespuestaError(
      new Response('<html>', { status: 502 }),
    )

    expect(error.codigo).toBe('ERROR_DESCONOCIDO')
    expect(error.mensaje).toContain('error inesperado')
    expect(error.erroresPorCampo).toEqual({})
  })
})

describe('mensajeConReferencia', () => {
  it('agrega el código de referencia si existe', () => {
    expect(
      mensajeConReferencia({
        codigo: 'X',
        mensaje: 'Falló.',
        erroresPorCampo: {},
        correlationId: 'abc',
      }),
    ).toBe('Falló. Código de referencia: abc.')
  })

  it('deja el mensaje igual si no hay referencia', () => {
    const error = errorDeConexion()

    expect(mensajeConReferencia(error)).toBe(error.mensaje)
  })
})
