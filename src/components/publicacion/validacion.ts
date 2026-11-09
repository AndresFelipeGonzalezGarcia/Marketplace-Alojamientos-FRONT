import type {
  DatosPublicacion,
  ModoReserva,
  Publicacion,
  TipoAlojamiento,
} from '../../api/publicaciones'

export const MAXIMO_SERVICIOS_ADICIONALES = 20
export const MAXIMO_IMAGENES = 15
const LONGITUD_MAXIMA_TITULO = 150
const LONGITUD_MAXIMA_CIUDAD = 80
const LONGITUD_MAXIMA_UBICACION = 255
const LONGITUD_MAXIMA_REGLAS = 4000
const LONGITUD_MAXIMA_NOMBRE_ADICIONAL = 80
const LONGITUD_MAXIMA_IMAGEN = 500

export interface FilaServicioAdicional {
  nombre: string
  costo: string
}

export interface ValoresPublicacion {
  titulo: string
  descripcion: string
  ciudad: string
  ubicacionTextual: string
  tipo: TipoAlojamiento | ''
  capacidad: string
  imagenes: string[]
  precioNoche: string
  tarifaLimpieza: string
  politicaCancelacionId: string
  modoReserva: ModoReserva | ''
  reglas: string
  serviciosIds: string[]
  serviciosAdicionales: FilaServicioAdicional[]
}

export type ErroresFormulario = Record<string, string>

export const VALORES_VACIOS: ValoresPublicacion = {
  titulo: '',
  descripcion: '',
  ciudad: '',
  ubicacionTextual: '',
  tipo: '',
  capacidad: '',
  imagenes: [],
  precioNoche: '',
  tarifaLimpieza: '',
  politicaCancelacionId: '',
  modoReserva: '',
  reglas: '',
  serviciosIds: [],
  serviciosAdicionales: [],
}

function esEnteroPositivo(texto: string) {
  const limpio = texto.trim()
  return /^\d+$/.test(limpio) && Number(limpio) > 0
}

// Acepta coma o punto decimal. "200.000" se rechaza para no leerlo como 200.
function aDecimal(texto: string) {
  return texto.trim().replace(',', '.')
}

function esDecimalValido(texto: string) {
  return /^\d+(\.\d{1,2})?$/.test(aDecimal(texto))
}

function esDecimalPositivo(texto: string) {
  return esDecimalValido(texto) && Number(aDecimal(texto)) > 0
}

function esCostoValido(texto: string) {
  return /^\d{1,10}(\.\d{1,2})?$/.test(aDecimal(texto))
}

export function rutaErrorAdicional(
  indice: number,
  campo: keyof FilaServicioAdicional,
) {
  return `serviciosAdicionales[${indice}].${campo}`
}

export function rutaErrorImagen(indice: number) {
  return `imagenes[${indice}]`
}

export function quitarFilasVacias(
  valores: ValoresPublicacion,
): ValoresPublicacion {
  return {
    ...valores,
    imagenes: valores.imagenes.filter((imagen) => imagen.trim()),
    serviciosAdicionales: valores.serviciosAdicionales.filter(
      ({ nombre, costo }) => nombre.trim() || costo.trim(),
    ),
  }
}

function validarTextoObligatorio(
  errores: ErroresFormulario,
  campo: string,
  valor: string,
  mensajeVacio: string,
  maximo?: { longitud: number; mensaje: string },
) {
  const limpio = valor.trim()
  if (!limpio) {
    errores[campo] = mensajeVacio
  } else if (maximo && limpio.length > maximo.longitud) {
    errores[campo] = maximo.mensaje
  }
}

export function validarPublicacion(
  valores: ValoresPublicacion,
): ErroresFormulario {
  const errores: ErroresFormulario = {}

  validarTextoObligatorio(
    errores,
    'titulo',
    valores.titulo,
    'Ingresa el título de la publicación.',
    {
      longitud: LONGITUD_MAXIMA_TITULO,
      mensaje: `El título admite máximo ${LONGITUD_MAXIMA_TITULO} caracteres.`,
    },
  )
  validarTextoObligatorio(
    errores,
    'descripcion',
    valores.descripcion,
    'Ingresa la descripción.',
  )
  validarTextoObligatorio(errores, 'ciudad', valores.ciudad, 'Ingresa la ciudad.', {
    longitud: LONGITUD_MAXIMA_CIUDAD,
    mensaje: `La ciudad admite máximo ${LONGITUD_MAXIMA_CIUDAD} caracteres.`,
  })
  validarTextoObligatorio(
    errores,
    'ubicacionTextual',
    valores.ubicacionTextual,
    'Ingresa la ubicación.',
    {
      longitud: LONGITUD_MAXIMA_UBICACION,
      mensaje: `La ubicación admite máximo ${LONGITUD_MAXIMA_UBICACION} caracteres.`,
    },
  )

  if (!valores.tipo) {
    errores.tipo = 'Selecciona el tipo de alojamiento.'
  }
  if (!esEnteroPositivo(valores.capacidad)) {
    errores.capacidad = 'La capacidad debe ser un número entero mayor que 0.'
  }
  if (!valores.precioNoche.trim()) {
    errores.precioNoche = 'Ingresa el precio por noche.'
  } else if (!esDecimalPositivo(valores.precioNoche)) {
    errores.precioNoche =
      'El precio debe ser mayor que 0 y tener máximo 2 decimales.'
  }
  if (valores.tarifaLimpieza.trim() && !esDecimalValido(valores.tarifaLimpieza)) {
    errores.tarifaLimpieza =
      'La tarifa de limpieza debe ser 0 o mayor, con máximo 2 decimales.'
  }
  if (!valores.politicaCancelacionId) {
    errores.politicaCancelacionId = 'Selecciona una política de cancelación.'
  }
  if (!valores.modoReserva) {
    errores.modoReserva = 'Selecciona el modo de reserva.'
  }
  if (valores.reglas.trim().length > LONGITUD_MAXIMA_REGLAS) {
    errores.reglas = `Las reglas admiten máximo ${LONGITUD_MAXIMA_REGLAS} caracteres.`
  }

  if (valores.imagenes.length > MAXIMO_IMAGENES) {
    errores.imagenes = `Puedes agregar máximo ${MAXIMO_IMAGENES} imágenes.`
  }
  valores.imagenes.forEach((imagen, indice) => {
    if (imagen.trim().length > LONGITUD_MAXIMA_IMAGEN) {
      errores[rutaErrorImagen(indice)] =
        `La ruta o URL admite máximo ${LONGITUD_MAXIMA_IMAGEN} caracteres.`
    }
  })

  if (valores.serviciosAdicionales.length > MAXIMO_SERVICIOS_ADICIONALES) {
    errores.serviciosAdicionales = `Puedes agregar máximo ${MAXIMO_SERVICIOS_ADICIONALES} servicios adicionales.`
  }
  valores.serviciosAdicionales.forEach(({ nombre, costo }, indice) => {
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) {
      errores[rutaErrorAdicional(indice, 'nombre')] =
        'Ingresa el nombre del servicio.'
    } else if (nombreLimpio.length > LONGITUD_MAXIMA_NOMBRE_ADICIONAL) {
      errores[rutaErrorAdicional(indice, 'nombre')] =
        `El nombre admite máximo ${LONGITUD_MAXIMA_NOMBRE_ADICIONAL} caracteres.`
    }
    if (!esCostoValido(costo)) {
      errores[rutaErrorAdicional(indice, 'costo')] =
        'El costo debe ser 0 o mayor, con hasta 10 enteros y 2 decimales.'
    }
  })

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
      cumplido: esDecimalPositivo(valores.precioNoche),
    },
    {
      texto: 'Capacidad mayor que 0',
      cumplido: esEnteroPositivo(valores.capacidad),
    },
    {
      texto: 'Condiciones comerciales',
      cumplido: Boolean(valores.politicaCancelacionId && valores.modoReserva),
    },
  ]
}

// Solo se llama con valores que ya pasaron validarPublicacion.
export function aDatosPublicacion(
  valores: ValoresPublicacion,
): DatosPublicacion {
  return {
    politicaCancelacionId: valores.politicaCancelacionId,
    titulo: valores.titulo.trim(),
    descripcion: valores.descripcion.trim(),
    ciudad: valores.ciudad.trim(),
    ubicacionTextual: valores.ubicacionTextual.trim(),
    tipo: valores.tipo as TipoAlojamiento,
    capacidad: Number(valores.capacidad.trim()),
    precioNoche: Number(aDecimal(valores.precioNoche)),
    ...(valores.tarifaLimpieza.trim()
      ? { tarifaLimpieza: Number(aDecimal(valores.tarifaLimpieza)) }
      : {}),
    reglas: valores.reglas.trim(),
    modoReserva: valores.modoReserva as ModoReserva,
    serviciosIds: valores.serviciosIds,
    serviciosAdicionales: valores.serviciosAdicionales.map(
      ({ nombre, costo }) => ({
        nombre: nombre.trim(),
        costo: Number(aDecimal(costo)),
      }),
    ),
    imagenes: valores.imagenes.map((imagen) => imagen.trim()),
  }
}

function aTexto(numero: number | null | undefined) {
  return numero === null || numero === undefined ? '' : String(numero)
}

export function aValoresPublicacion(
  publicacion: Publicacion,
): ValoresPublicacion {
  return {
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    ciudad: publicacion.ciudad,
    ubicacionTextual: publicacion.ubicacionTextual,
    tipo: publicacion.tipo,
    capacidad: String(publicacion.capacidad),
    imagenes: publicacion.imagenes ?? [],
    precioNoche: aTexto(publicacion.precioNoche),
    tarifaLimpieza: aTexto(publicacion.tarifaLimpieza),
    politicaCancelacionId: publicacion.politicaCancelacionId ?? '',
    modoReserva: publicacion.modoReserva ?? '',
    reglas: publicacion.reglas ?? '',
    serviciosIds: publicacion.serviciosIds ?? [],
    serviciosAdicionales: (publicacion.serviciosAdicionales ?? []).map(
      ({ nombre, costo }) => ({ nombre, costo: String(costo) }),
    ),
  }
}
