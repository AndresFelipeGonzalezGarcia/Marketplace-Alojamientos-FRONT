import { useEffect, useState } from 'react'
import type { ResultadoApi } from '../../api/cliente'
import {
  listarPoliticasCancelacion,
  listarServicios,
  type PoliticaCancelacion,
  type Servicio,
} from '../../api/catalogos'
import type { ErrorApi } from '../../api/errores'

export type EstadoCatalogo<T> =
  | { fase: 'cargando' }
  | { fase: 'lista'; items: T[] }
  | { fase: 'error'; error: ErrorApi }

function aEstado<T>(resultado: ResultadoApi<T[]>): EstadoCatalogo<T> {
  return resultado.estado === 'ok'
    ? { fase: 'lista', items: resultado.datos }
    : { fase: 'error', error: resultado.error }
}

export function useCatalogos() {
  const [politicas, setPoliticas] = useState<
    EstadoCatalogo<PoliticaCancelacion>
  >({ fase: 'cargando' })
  const [servicios, setServicios] = useState<EstadoCatalogo<Servicio>>({
    fase: 'cargando',
  })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    listarPoliticasCancelacion().then((resultado) => {
      if (vigente) {
        setPoliticas(aEstado(resultado))
      }
    })
    listarServicios().then((resultado) => {
      if (vigente) {
        setServicios(aEstado(resultado))
      }
    })
    return () => {
      vigente = false
    }
  }, [intento])

  function reintentar() {
    setPoliticas({ fase: 'cargando' })
    setServicios({ fase: 'cargando' })
    setIntento((actual) => actual + 1)
  }

  return { politicas, servicios, reintentar }
}
