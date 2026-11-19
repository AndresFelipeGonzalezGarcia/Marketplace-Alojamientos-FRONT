import { obtenerTokenSesion } from '../auth/sesion'
import { solicitarApi } from './cliente'

// PROPUESTA en docs/contrato-api-marketplace.yaml. Rol ADMINISTRADOR.
const RUTA_TARIFA = '/api/admin/configuracion/tarifa-servicio'

// TarifaServicio del contrato: porcentaje sobre el subtotal (p. ej. 8.5).
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
