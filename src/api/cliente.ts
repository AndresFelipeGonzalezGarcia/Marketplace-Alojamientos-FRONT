import { invalidarSesion } from '../auth/sesion'
import {
  errorDeConexion,
  interpretarRespuestaError,
  type ErrorApi,
} from './errores'

export type ResultadoApi<T> =
  | { estado: 'ok'; datos: T }
  | { estado: 'error'; error: ErrorApi }

interface SolicitudApi {
  ruta: string
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE'
  estadoExito: number
  cuerpo?: unknown
  token?: string | null
}

export async function solicitarApi<T>({
  ruta,
  metodo,
  estadoExito,
  cuerpo,
  token,
}: SolicitudApi): Promise<ResultadoApi<T>> {
  const urlBase: string | undefined = import.meta.env.VITE_API_URL

  if (!urlBase) {
    return { estado: 'error', error: errorDeConexion() }
  }

  const cabeceras: Record<string, string> = {}
  if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json'
  }
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`
  }

  try {
    const respuesta = await fetch(`${urlBase.replace(/\/+$/, '')}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {}),
    })

    if (respuesta.status !== estadoExito) {
      const error = await interpretarRespuestaError(respuesta)
      // El token caducó o fue rechazado: se cierra la sesión y las rutas
      // protegidas llevan al login recordando a dónde se iba.
      if (
        respuesta.status === 401 &&
        error.codigo === 'NO_AUTENTICADO' &&
        token
      ) {
        invalidarSesion(token)
      }
      return { estado: 'error', error }
    }

    const datos = (
      respuesta.status === 204 ? undefined : await respuesta.json()
    ) as T
    return { estado: 'ok', datos }
  } catch {
    return { estado: 'error', error: errorDeConexion() }
  }
}
