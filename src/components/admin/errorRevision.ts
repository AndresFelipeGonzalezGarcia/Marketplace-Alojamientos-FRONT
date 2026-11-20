import type { ErrorApi } from '../../api/errores'

// Bloqueos de revisión
export type BloqueoRevision = 'acceso_denegado' | 'no_encontrada' | 'ya_revisada'

export function bloqueoDe(error: ErrorApi): BloqueoRevision | null {
  switch (error.codigo) {
    case 'ACCESO_DENEGADO':
      return 'acceso_denegado'
    case 'PUBLICACION_NO_ENCONTRADA':
    case 'RECURSO_NO_ENCONTRADO':
      return 'no_encontrada'
    case 'ESTADO_PUBLICACION_INVALIDO':
      return 'ya_revisada'
    default:
      return null
  }
}

export const MENSAJE_BLOQUEO: Record<
  BloqueoRevision,
  { titulo: string; mensaje: string }
> = {
  acceso_denegado: {
    titulo: 'Acceso denegado',
    mensaje:
      'Tu cuenta no tiene permiso para revisar publicaciones. Si crees que es un error, comunícate con soporte.',
  },
  no_encontrada: {
    titulo: 'Esta publicación ya no existe',
    mensaje:
      'Pudo haber sido eliminada mientras la revisabas. Vuelve a la bandeja para seguir con las demás.',
  },
  ya_revisada: {
    titulo: 'Otro administrador ya la revisó',
    mensaje:
      'Esta publicación ya no está pendiente, así que tu decisión no se guardó. Recarga la bandeja para ver las que siguen por revisar.',
  },
}
