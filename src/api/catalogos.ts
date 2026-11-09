import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'

export interface PoliticaCancelacion {
  id: string
  nombre: string
}

export interface Servicio {
  id: string
  nombre: string
}

export function listarPoliticasCancelacion() {
  return solicitarApi<PoliticaCancelacion[]>({
    ruta: '/api/anfitrion/politicas-cancelacion',
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function listarServicios() {
  return solicitarApi<Servicio[]>({
    ruta: '/api/anfitrion/servicios',
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}
