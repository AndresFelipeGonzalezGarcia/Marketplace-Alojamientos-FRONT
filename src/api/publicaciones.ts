import { obtenerTokenSesion } from '../auth/sesion'

// Contrato provisional: ajustar aquí cuando la API esté definida.
const RUTA_PUBLICACIONES = '/api/publicaciones'

export const TIPOS_ALOJAMIENTO = [
  'Apartamento',
  'Casa',
  'Habitación',
  'Cabaña',
]

export const SERVICIOS_DISPONIBLES = [
  'Wi-Fi',
  'Cocina',
  'Parqueadero',
  'Lavadora',
  'Aire acondicionado',
]

export interface DatosPublicacion {
  titulo: string
  descripcion: string
  ciudad: string
  ubicacion: string
  tipo: string
  capacidad: number
  precioNoche: number | null
  servicios: string[]
  reglas: string
  imagenes: string[]
}

export interface Publicacion extends DatosPublicacion {
  id: string
  estado: string
}

export type ErroresPublicacion = Partial<Record<keyof DatosPublicacion, string>>

export type ResultadoPublicacion =
  | { estado: 'ok'; publicacion: Publicacion }
  | { estado: 'validacion'; errores: ErroresPublicacion }
  | { estado: 'sesion_invalida' }
  | { estado: 'acceso_denegado' }
  | { estado: 'no_encontrada' }
  | { estado: 'error' }

const CAMPOS: (keyof DatosPublicacion)[] = [
  'titulo',
  'descripcion',
  'ciudad',
  'ubicacion',
  'tipo',
  'capacidad',
  'precioNoche',
  'servicios',
  'reglas',
  'imagenes',
]

async function leerErrores(respuesta: Response): Promise<ErroresPublicacion> {
  try {
    const cuerpo: { errores?: Record<string, unknown> } = await respuesta.json()
    const errores: ErroresPublicacion = {}
    for (const campo of CAMPOS) {
      const mensaje = cuerpo.errores?.[campo]
      if (typeof mensaje === 'string') {
        errores[campo] = mensaje
      }
    }
    return errores
  } catch {
    return {}
  }
}

async function solicitar(
  ruta: string,
  metodo: 'GET' | 'POST' | 'PUT',
  estadoExito: number,
  datos?: DatosPublicacion,
): Promise<ResultadoPublicacion> {
  const urlBase: string | undefined = import.meta.env.VITE_API_URL

  if (!urlBase) {
    return { estado: 'error' }
  }

  const token = obtenerTokenSesion()
  const cabeceras: Record<string, string> = {}
  if (datos) {
    cabeceras['Content-Type'] = 'application/json'
  }
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`
  }

  try {
    const respuesta = await fetch(`${urlBase.replace(/\/+$/, '')}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      ...(datos ? { body: JSON.stringify(datos) } : {}),
    })

    if (respuesta.status === estadoExito) {
      const publicacion: Publicacion = await respuesta.json()
      return { estado: 'ok', publicacion }
    }

    switch (respuesta.status) {
      case 400:
      case 422:
        return { estado: 'validacion', errores: await leerErrores(respuesta) }
      case 401:
        return { estado: 'sesion_invalida' }
      case 403:
        return { estado: 'acceso_denegado' }
      case 404:
        return { estado: 'no_encontrada' }
      default:
        return { estado: 'error' }
    }
  } catch {
    return { estado: 'error' }
  }
}

function rutaPublicacion(id: string) {
  return `${RUTA_PUBLICACIONES}/${encodeURIComponent(id)}`
}

export function crearPublicacion(datos: DatosPublicacion) {
  return solicitar(RUTA_PUBLICACIONES, 'POST', 201, datos)
}

export function obtenerPublicacion(id: string) {
  return solicitar(rutaPublicacion(id), 'GET', 200)
}

export function actualizarPublicacion(id: string, datos: DatosPublicacion) {
  return solicitar(rutaPublicacion(id), 'PUT', 200, datos)
}
