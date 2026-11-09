import type {
  DatosPublicacion,
  ErroresPublicacion,
  Publicacion,
} from '../../api/publicaciones'

export interface ValoresPublicacion {
  titulo: string
  descripcion: string
  ciudad: string
  ubicacion: string
  tipo: string
  capacidad: string
  precioNoche: string
  servicios: string[]
  reglas: string
  imagenes: string[]
}

export const VALORES_VACIOS: ValoresPublicacion = {
  titulo: '',
  descripcion: '',
  ciudad: '',
  ubicacion: '',
  tipo: '',
  capacidad: '',
  precioNoche: '',
  servicios: [],
  reglas: '',
  imagenes: [],
}

function esEnteroPositivo(texto: string) {
  const limpio = texto.trim()
  return /^\d+$/.test(limpio) && Number(limpio) > 0
}

export function validarPublicacion(
  valores: ValoresPublicacion,
): ErroresPublicacion {
  const errores: ErroresPublicacion = {}

  if (!valores.titulo.trim()) {
    errores.titulo = 'Ingresa el título de la publicación.'
  }
  if (!esEnteroPositivo(valores.capacidad)) {
    errores.capacidad = 'La capacidad debe ser un número entero mayor que 0.'
  }
  if (valores.precioNoche.trim() && !esEnteroPositivo(valores.precioNoche)) {
    errores.precioNoche = 'El precio debe ser un número entero mayor que 0.'
  }

  return errores
}

export function evaluarRequisitos(valores: ValoresPublicacion) {
  return [
    {
      texto: 'Título y descripción',
      cumplido: Boolean(valores.titulo.trim() && valores.descripcion.trim()),
    },
    {
      texto: 'Precio por noche positivo',
      cumplido: esEnteroPositivo(valores.precioNoche),
    },
    {
      texto: 'Capacidad mayor que 0',
      cumplido: esEnteroPositivo(valores.capacidad),
    },
  ]
}

export function aDatosPublicacion(
  valores: ValoresPublicacion,
): DatosPublicacion {
  return {
    titulo: valores.titulo.trim(),
    descripcion: valores.descripcion.trim(),
    ciudad: valores.ciudad.trim(),
    ubicacion: valores.ubicacion.trim(),
    tipo: valores.tipo,
    capacidad: Number(valores.capacidad.trim()),
    precioNoche: valores.precioNoche.trim()
      ? Number(valores.precioNoche.trim())
      : null,
    servicios: valores.servicios,
    reglas: valores.reglas.trim(),
    imagenes: valores.imagenes
      .map((imagen) => imagen.trim())
      .filter((imagen) => imagen !== ''),
  }
}

export function aValoresPublicacion(
  publicacion: Publicacion,
): ValoresPublicacion {
  return {
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    ciudad: publicacion.ciudad,
    ubicacion: publicacion.ubicacion,
    tipo: publicacion.tipo,
    capacidad: String(publicacion.capacidad),
    precioNoche:
      publicacion.precioNoche === null ? '' : String(publicacion.precioNoche),
    servicios: publicacion.servicios,
    reglas: publicacion.reglas,
    imagenes: publicacion.imagenes,
  }
}
