import {
  TAMANO_PAGINA,
  type ConsultaAlojamientos,
} from '../../api/alojamientos'
import {
  TIPOS_ALOJAMIENTO,
  type TipoAlojamiento,
} from '../../api/publicaciones'
import { hoyEnBogota } from '../disponibilidad/validacionPeriodo'

// La URL es la fuente de verdad de la búsqueda: lo que está en la barra de
// direcciones es lo que se ve. Así se puede recargar, compartir o volver
// desde el detalle sin perder nada.

export interface FiltrosBusqueda {
  ciudad: string
  // yyyy-MM-dd, o '' si no hay fechas. Siempre vienen las dos o ninguna.
  llegada: string
  // Exclusiva: es el día en que se sale, esa noche no se cuenta.
  salida: string
  huespedes: number | null
  precioMin: number | null
  precioMax: number | null
  tipo: TipoAlojamiento | null
  servicios: string[]
  // Empieza en 1, como lo lee una persona (la API empieza en 0).
  pagina: number
}

export const FILTROS_VACIOS: FiltrosBusqueda = {
  ciudad: '',
  llegada: '',
  salida: '',
  huespedes: null,
  precioMin: null,
  precioMax: null,
  tipo: null,
  servicios: [],
  pagina: 1,
}

export const MAXIMO_CIUDAD = 80
export const MAXIMO_HUESPEDES = 50

const FECHA = /^\d{4}-\d{2}-\d{2}$/

export function esFechaValida(valor: string) {
  if (!FECHA.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().startsWith(valor)
}

function leerEntero(valor: string | null, minimo: number): number | null {
  if (valor === null || !/^\d+$/.test(valor)) return null
  const numero = Number(valor)
  return numero >= minimo ? numero : null
}

function leerPrecio(valor: string | null): number | null {
  if (valor === null || !/^\d+(\.\d{1,2})?$/.test(valor)) return null
  return Number(valor)
}

// Lectura tolerante: lo que no se entiende (un enlace editado a mano) se ignora.
export function leerFiltros(parametros: URLSearchParams): FiltrosBusqueda {
  const llegada = parametros.get('llegada') ?? ''
  const salida = parametros.get('salida') ?? ''
  const fechasValidas = esFechaValida(llegada) && esFechaValida(salida)
  const tipo = parametros.get('tipo')
  const servicios = (parametros.get('servicios') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  return {
    ciudad: (parametros.get('ciudad') ?? '').trim().slice(0, MAXIMO_CIUDAD),
    // Una salida anterior a la llegada sí se conserva: la API responde
    // FECHAS_INVALIDAS y se muestra junto a las fechas.
    llegada: fechasValidas ? llegada : '',
    salida: fechasValidas ? salida : '',
    huespedes: leerEntero(parametros.get('huespedes'), 1),
    precioMin: leerPrecio(parametros.get('precioMin')),
    precioMax: leerPrecio(parametros.get('precioMax')),
    tipo: TIPOS_ALOJAMIENTO.some((opcion) => opcion.valor === tipo)
      ? (tipo as TipoAlojamiento)
      : null,
    servicios: [...new Set(servicios)],
    pagina: leerEntero(parametros.get('pagina'), 1) ?? 1,
  }
}

// Solo lo que tiene valor, en un orden fijo, para que la URL sea estable.
export function escribirFiltros(filtros: FiltrosBusqueda): URLSearchParams {
  const parametros = new URLSearchParams()
  if (filtros.ciudad) parametros.set('ciudad', filtros.ciudad)
  if (filtros.llegada && filtros.salida) {
    parametros.set('llegada', filtros.llegada)
    parametros.set('salida', filtros.salida)
  }
  if (filtros.huespedes !== null)
    parametros.set('huespedes', String(filtros.huespedes))
  if (filtros.precioMin !== null)
    parametros.set('precioMin', String(filtros.precioMin))
  if (filtros.precioMax !== null)
    parametros.set('precioMax', String(filtros.precioMax))
  if (filtros.tipo) parametros.set('tipo', filtros.tipo)
  if (filtros.servicios.length > 0)
    parametros.set('servicios', filtros.servicios.join(','))
  if (filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina))
  return parametros
}

export function aConsulta(filtros: FiltrosBusqueda): ConsultaAlojamientos {
  return {
    ciudad: filtros.ciudad || undefined,
    fechaLlegada: filtros.llegada || undefined,
    fechaSalida: filtros.salida || undefined,
    huespedes: filtros.huespedes ?? undefined,
    precioMin: filtros.precioMin ?? undefined,
    precioMax: filtros.precioMax ?? undefined,
    tipo: filtros.tipo ?? undefined,
    serviciosIds: filtros.servicios,
    pagina: filtros.pagina - 1,
    tamano: TAMANO_PAGINA,
  }
}

// ¿Hay algo que limpiar? La página no cuenta como filtro.
export function hayFiltros(filtros: FiltrosBusqueda) {
  return escribirFiltros({ ...filtros, pagina: 1 }).size > 0
}

// ---------- Fechas: la salida es exclusiva ----------

const DIA_MS = 24 * 60 * 60 * 1000

// Del 10 al 14 son 4 noches (10, 11, 12 y 13). null si no tiene sentido.
export function contarNoches(llegada: string, salida: string): number | null {
  if (!esFechaValida(llegada) || !esFechaValida(salida)) return null
  const noches = Math.round(
    (Date.parse(`${salida}T00:00:00Z`) - Date.parse(`${llegada}T00:00:00Z`)) /
      DIA_MS,
  )
  return noches > 0 ? noches : null
}

export function textoNoches(noches: number) {
  return `${noches} ${noches === 1 ? 'noche' : 'noches'}`
}

const DIA_CORTO = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatearDia(fecha: string) {
  return DIA_CORTO.format(new Date(`${fecha}T00:00:00Z`))
}

// «4 noches: llegas el mié, 10 de dic. y sales el dom, 14 de dic.»
export function describirEstadia(
  llegada: string,
  salida: string,
): string | null {
  const noches = contarNoches(llegada, salida)
  if (noches === null) return null
  return `${textoNoches(noches)}: llegas el ${formatearDia(llegada)} y sales el ${formatearDia(salida)}`
}

// ---------- Validación del buscador principal ----------

export interface BorradorBusqueda {
  ciudad: string
  llegada: string
  salida: string
  huespedes: string
}

export type ErroresBusqueda = Partial<
  Record<'ciudad' | 'fechas' | 'huespedes', string>
>

export const MENSAJE_FECHAS_INVALIDAS =
  'La salida debe ser al menos un día después de la llegada.'

export function validarBusqueda(
  borrador: BorradorBusqueda,
  hoy = hoyEnBogota(),
): ErroresBusqueda {
  const errores: ErroresBusqueda = {}
  if (borrador.ciudad.trim().length > MAXIMO_CIUDAD) {
    errores.ciudad = `La ciudad admite máximo ${MAXIMO_CIUDAD} caracteres.`
  }

  const { llegada, salida } = borrador
  if (llegada && !salida) {
    errores.fechas = 'Elige también la fecha de salida.'
  } else if (!llegada && salida) {
    errores.fechas = 'Elige también la fecha de llegada.'
  } else if (llegada && salida) {
    if (!esFechaValida(llegada) || !esFechaValida(salida)) {
      errores.fechas = 'Revisa las fechas: alguna no es válida.'
    } else if (llegada < hoy) {
      errores.fechas = 'La llegada no puede ser en el pasado.'
    } else if (salida <= llegada) {
      errores.fechas = MENSAJE_FECHAS_INVALIDAS
    }
  }

  const huespedes = borrador.huespedes.trim()
  if (huespedes) {
    const numero = Number(huespedes)
    if (!Number.isInteger(numero) || numero < 1 || numero > MAXIMO_HUESPEDES) {
      errores.huespedes = `Indica entre 1 y ${MAXIMO_HUESPEDES} huéspedes.`
    }
  }
  return errores
}

// ---------- Validación del rango de precio ----------

// '' → null; válido → número; inválido → undefined. Acepta «150.000»
// (punto de miles) y «95000,50» (coma decimal), como se escribe en Colombia.
export function leerPrecioEscrito(texto: string): number | null | undefined {
  const limpio = texto.trim().replaceAll('.', '').replace(',', '.')
  if (!limpio) return null
  return /^\d{1,10}(\.\d{1,2})?$/.test(limpio) ? Number(limpio) : undefined
}

export function validarPrecios(minimo: string, maximo: string): string | null {
  const min = leerPrecioEscrito(minimo)
  const max = leerPrecioEscrito(maximo)
  if (min === undefined || max === undefined) {
    return 'Escribe el precio solo con números, por ejemplo 150000.'
  }
  if (min !== null && max !== null && min > max) {
    return 'El precio mínimo no puede ser mayor que el máximo.'
  }
  return null
}

// ---------- Paginación ----------

// Páginas a mostrar: la primera, la última y dos a cada lado de la actual;
// el resto se resume con «…».
export function paginasVisibles(
  pagina: number,
  total: number,
): (number | '…')[] {
  const paginas: (number | '…')[] = []
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - pagina) <= 2) {
      paginas.push(n)
    } else if (paginas[paginas.length - 1] !== '…') {
      paginas.push('…')
    }
  }
  return paginas
}
