import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'
import type { ErrorApi } from './errores'

export interface DatosPeriodo {
  fechaInicio: string
  fechaFin: string
}

export interface Periodo extends DatosPeriodo {
  id: string
  publicacionId: string
}

export interface ReservaResumen {
  id: string
  fechaLlegada: string
  fechaSalida: string
  numeroHuespedes: number
  estado: string
}

function rutaPeriodos(publicacionId: string) {
  return `/api/anfitrion/publicaciones/${encodeURIComponent(publicacionId)}/periodos`
}

function rutaPeriodo(publicacionId: string, periodoId: string) {
  return `${rutaPeriodos(publicacionId)}/${encodeURIComponent(periodoId)}`
}

export function listarPeriodos(publicacionId: string) {
  return solicitarApi<Periodo[]>({
    ruta: rutaPeriodos(publicacionId),
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function crearPeriodo(publicacionId: string, datos: DatosPeriodo) {
  return solicitarApi<Periodo>({
    ruta: rutaPeriodos(publicacionId),
    metodo: 'POST',
    estadoExito: 201,
    cuerpo: datos,
    token: obtenerTokenSesion(),
  })
}

export function actualizarPeriodo(
  publicacionId: string,
  periodoId: string,
  datos: DatosPeriodo,
) {
  return solicitarApi<Periodo>({
    ruta: rutaPeriodo(publicacionId, periodoId),
    metodo: 'PUT',
    estadoExito: 200,
    cuerpo: datos,
    token: obtenerTokenSesion(),
  })
}

export function eliminarPeriodo(publicacionId: string, periodoId: string) {
  return solicitarApi<void>({
    ruta: rutaPeriodo(publicacionId, periodoId),
    metodo: 'DELETE',
    estadoExito: 204,
    token: obtenerTokenSesion(),
  })
}

export function reservasAfectadas(error: ErrorApi): ReservaResumen[] {
  return error.codigo === 'PERIODO_CON_RESERVAS' &&
    Array.isArray(error.detalles)
    ? (error.detalles as ReservaResumen[])
    : []
}
