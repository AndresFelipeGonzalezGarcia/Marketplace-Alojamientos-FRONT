export interface ApiError {
  codigo: string
  mensaje: string
  detalles?: unknown
  correlationId?: string
}

export interface ErrorApi extends ApiError {
  erroresPorCampo: Record<string, string>
}

const MENSAJE_GENERICO =
  'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.'

const MENSAJES = new Map<string, string>([
  [
    'CORREO_YA_REGISTRADO',
    'Este correo ya está registrado. Usa otro correo o inicia sesión.',
  ],
  ['ROL_NO_PERMITIDO', 'Ese tipo de cuenta no está permitido.'],
  ['SOLICITUD_INVALIDA', 'Revisa los datos ingresados.'],
  ['NO_AUTENTICADO', 'Tu sesión no es válida. Inicia sesión de nuevo.'],
  ['ACCESO_DENEGADO', 'No tienes permiso para realizar esta acción.'],
  ['PUBLICACION_NO_ENCONTRADA', 'La publicación no existe.'],
  ['PERIODO_NO_ENCONTRADO', 'El periodo no existe.'],
  ['FECHAS_INVALIDAS', 'La fecha final no puede ser anterior a la inicial.'],
  ['PERIODO_CRUZADO', 'Las fechas se cruzan con otro periodo.'],
  ['PERIODO_EN_EL_PASADO', 'El periodo no puede empezar en el pasado.'],
  ['PERIODO_CON_RESERVAS', 'El periodo tiene reservas activas.'],
  ['ERROR_INTERNO', MENSAJE_GENERICO],
])

const CAMPO_POR_CODIGO = new Map<string, string>([
  ['CORREO_YA_REGISTRADO', 'correo'],
  ['ROL_NO_PERMITIDO', 'rol'],
])

function esDetalleCampo(
  detalle: unknown,
): detalle is { campo: string; mensaje: string } {
  const posible = detalle as { campo?: unknown; mensaje?: unknown } | null
  return (
    typeof posible?.campo === 'string' && typeof posible.mensaje === 'string'
  )
}

function construirError(
  cuerpo: Partial<ApiError> | null,
  correlationIdCabecera: string | null,
): ErrorApi {
  const codigo =
    typeof cuerpo?.codigo === 'string' ? cuerpo.codigo : 'ERROR_DESCONOCIDO'
  const mensajeServidor =
    typeof cuerpo?.mensaje === 'string' ? cuerpo.mensaje : undefined
  const mensaje = MENSAJES.get(codigo) ?? mensajeServidor ?? MENSAJE_GENERICO

  const erroresPorCampo: Record<string, string> = {}
  if (Array.isArray(cuerpo?.detalles)) {
    for (const detalle of cuerpo.detalles.filter(esDetalleCampo)) {
      const anterior = erroresPorCampo[detalle.campo]
      erroresPorCampo[detalle.campo] = anterior
        ? `${anterior} ${detalle.mensaje}`
        : detalle.mensaje
    }
  }

  const campoDelCodigo = CAMPO_POR_CODIGO.get(codigo)
  if (campoDelCodigo) {
    erroresPorCampo[campoDelCodigo] = mensaje
  }

  return {
    codigo,
    mensaje,
    erroresPorCampo,
    detalles: cuerpo?.detalles,
    correlationId: cuerpo?.correlationId ?? correlationIdCabecera ?? undefined,
  }
}

export async function interpretarRespuestaError(
  respuesta: Response,
): Promise<ErrorApi> {
  const cuerpo: Partial<ApiError> | null = await respuesta
    .json()
    .catch(() => null)
  return construirError(cuerpo, respuesta.headers.get('X-Correlation-Id'))
}

export function errorDeConexion(): ErrorApi {
  return {
    codigo: 'ERROR_CONEXION',
    mensaje:
      'No pudimos conectar con el servidor. Inténtalo de nuevo en unos minutos.',
    erroresPorCampo: {},
  }
}

export function mensajeConReferencia(error: ErrorApi, mensaje = error.mensaje) {
  return error.correlationId
    ? `${mensaje} Código de referencia: ${error.correlationId}.`
    : mensaje
}
