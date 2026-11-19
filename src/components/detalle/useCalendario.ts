import { useEffect, useMemo, useRef, useState } from 'react'
import { obtenerCalendario, type DiaCalendario } from '../../api/alojamientos'
import type { ResultadoApi } from '../../api/cliente'
import type { ErrorApi } from '../../api/errores'
import { mesDe, primerDia, ultimoDia } from './fechasCalendario'
import type { Disponibilidad } from './seleccionEstadia'

interface Carga {
  // Con qué intento se pidió: un error de un intento anterior se vuelve a pedir.
  intento: number
  resultado: ResultadoApi<DiaCalendario[]>
}

export type EstadoMes =
  | { fase: 'cargando' }
  | { fase: 'listo' }
  // 400: el rango pedido no es válido; reintentar no lo arregla.
  | { fase: 'rango_invalido'; error: ErrorApi }
  | { fase: 'error'; error: ErrorApi }

const CODIGOS_RANGO = new Set(['FECHAS_INVALIDAS', 'RANGO_EXCESIVO', 'SOLICITUD_INVALIDA'])

// Carga por meses: pide de una vez los meses que falten de `meses` (que debe
// ser una lista contigua y ordenada, de no más de 365 días) y guarda lo que
// ya llegó, para que volver a un mes no lo pida otra vez.
export function useCalendario(alojamientoId: string, meses: string[]) {
  const [cargas, setCargas] = useState<Record<string, Carga>>({})
  const [intento, setIntento] = useState(0)
  const enCurso = useRef(new Set<string>())
  const montado = useRef(true)
  const clave = meses.join(',')

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    const pendientes = clave.split(',').filter((mes) => {
      if (enCurso.current.has(mes)) return false
      const carga = cargas[mes]
      return !carga || (carga.resultado.estado === 'error' && carga.intento < intento)
    })
    if (pendientes.length === 0) return

    pendientes.forEach((mes) => enCurso.current.add(mes))
    // Los meses de la lista son contiguos: un solo rango los cubre todos.
    const desde = primerDia(pendientes[0])
    const hasta = ultimoDia(pendientes[pendientes.length - 1])
    obtenerCalendario(alojamientoId, desde, hasta).then((resultado) => {
      pendientes.forEach((mes) => enCurso.current.delete(mes))
      if (!montado.current) return
      setCargas((anteriores) => {
        const siguientes = { ...anteriores }
        for (const mes of pendientes) {
          siguientes[mes] = {
            intento,
            resultado:
              resultado.estado === 'ok'
                ? {
                    estado: 'ok',
                    datos: resultado.datos.filter((dia) => mesDe(dia.fecha) === mes),
                  }
                : resultado,
          }
        }
        return siguientes
      })
    })
  }, [alojamientoId, clave, intento, cargas])

  const dias = useMemo(() => {
    const mapa = new Map<string, boolean>()
    for (const carga of Object.values(cargas)) {
      if (carga.resultado.estado !== 'ok') continue
      for (const dia of carga.resultado.datos) mapa.set(dia.fecha, dia.disponible)
    }
    return mapa
  }, [cargas])

  const disponible: Disponibilidad = (fecha) => dias.get(fecha)

  function estadoMes(mes: string): EstadoMes {
    const carga = cargas[mes]
    if (!carga) return { fase: 'cargando' }
    const { resultado } = carga
    if (resultado.estado === 'ok') return { fase: 'listo' }
    if (carga.intento < intento) return { fase: 'cargando' }
    return CODIGOS_RANGO.has(resultado.error.codigo)
      ? { fase: 'rango_invalido', error: resultado.error }
      : { fase: 'error', error: resultado.error }
  }

  return {
    disponible,
    estadoMes,
    reintentar: () => setIntento((actual) => actual + 1),
  }
}
