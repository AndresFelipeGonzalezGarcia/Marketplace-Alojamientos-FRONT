import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'

// Tarifa de servicio
const RUTA_TARIFA = '/api/admin/configuracion/tarifa-servicio'

// Tarifa de servicio
export interface TarifaServicio {
  porcentaje: number
}

export function obtenerTarifaServicio() {
  return solicitarApi<TarifaServicio>({
    ruta: RUTA_TARIFA,
    metodo: 'GET',
    estadoExito: 200,
    token: obtenerTokenSesion(),
  })
}

export function actualizarTarifaServicio(porcentaje: number) {
  return solicitarApi<TarifaServicio>({
    ruta: RUTA_TARIFA,
    metodo: 'PUT',
    estadoExito: 200,
    cuerpo: { porcentaje },
    token: obtenerTokenSesion(),
  })
}
