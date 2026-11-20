import type { EstadoPublicacion } from '../../api/publicaciones'

export type TonoEstado = 'neutro' | 'marca' | 'exito' | 'error'

interface PresentacionEstado {
  etiqueta: string
  tono: TonoEstado
  // Descripción
  descripcion: string
}

export const PRESENTACION_ESTADO: Record<
  EstadoPublicacion,
  PresentacionEstado
> = {
  BORRADOR: {
    etiqueta: 'Borrador',
    tono: 'neutro',
    descripcion: 'Solo tú la ves. Envíala a revisión cuando esté completa.',
  },
  PENDIENTE_REVISION: {
    etiqueta: 'En revisión',
    tono: 'marca',
    descripcion:
      'Un administrador la está revisando. Mientras tanto no se puede editar.',
  },
  ACTIVA: {
    etiqueta: 'Activa',
    tono: 'exito',
    descripcion: 'Los huéspedes ya pueden verla y reservarla.',
  },
  PAUSADA: {
    etiqueta: 'Pausada',
    tono: 'neutro',
    descripcion: 'No aparece para los huéspedes hasta que la reactives.',
  },
  BLOQUEADA: {
    etiqueta: 'Bloqueada',
    tono: 'error',
    descripcion:
      'Un administrador la bloqueó. Mientras tanto no se puede editar.',
  },
}

// Estados editables
const EDITABLES: readonly EstadoPublicacion[] = [
  'BORRADOR',
  'ACTIVA',
  'PAUSADA',
]

// Publicación nueva
export function sePuedeEditar(estado: EstadoPublicacion | undefined): boolean {
  return estado === undefined || EDITABLES.includes(estado)
}

export function presentacionDe(estado: EstadoPublicacion): PresentacionEstado {
  // Estado desconocido
  return (
    PRESENTACION_ESTADO[estado] ?? {
      etiqueta: estado,
      tono: 'neutro',
      descripcion: '',
    }
  )
}
