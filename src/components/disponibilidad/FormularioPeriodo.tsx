import { useEffect, useState, type FormEvent } from 'react'
import type { ResultadoApi } from '../../api/cliente'
import type { ErrorApi } from '../../api/errores'
import type { DatosPeriodo, Periodo } from '../../api/periodos'
import CampoFormulario from '../publicacion/CampoFormulario'
import AvisoError from './AvisoError'
import { validarPeriodo, type ErroresPeriodo } from './validacionPeriodo'

const ID_INICIO = 'periodo-fechaInicio'
const ID_FIN = 'periodo-fechaFin'

interface FormularioPeriodoProps {
  periodo: Periodo | null
  onGuardar: (datos: DatosPeriodo) => Promise<ResultadoApi<Periodo>>
  onGuardado: (periodo: Periodo) => void
  onBloqueado: (error: ErrorApi) => boolean
  onCancelar: () => void
}

function FormularioPeriodo({
  periodo,
  onGuardar,
  onGuardado,
  onBloqueado,
  onCancelar,
}: FormularioPeriodoProps) {
  const [fechaInicio, setFechaInicio] = useState(periodo?.fechaInicio ?? '')
  const [fechaFin, setFechaFin] = useState(periodo?.fechaFin ?? '')
  const [errores, setErrores] = useState<ErroresPeriodo>({})
  const [errorGeneral, setErrorGeneral] = useState<ErrorApi | null>(null)
  const [guardando, setGuardando] = useState(false)
  const editando = periodo !== null

  useEffect(() => {
    if (editando) {
      document.getElementById(ID_INICIO)?.focus()
    }
  }, [editando])

  function mostrarErrores(nuevos: ErroresPeriodo) {
    setErrores(nuevos)
    const id = nuevos.fechaInicio ? ID_INICIO : nuevos.fechaFin ? ID_FIN : null
    if (id) {
      document.getElementById(id)?.focus()
    }
  }

  function mostrarErrorApi(error: ErrorApi) {
    const { fechaInicio: errorInicio, fechaFin: errorFin } =
      error.erroresPorCampo
    if (errorInicio || errorFin) {
      mostrarErrores({
        ...(errorInicio ? { fechaInicio: errorInicio } : {}),
        ...(errorFin ? { fechaFin: errorFin } : {}),
      })
    } else {
      setErrorGeneral(error)
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (guardando) {
      return
    }

    setErrorGeneral(null)
    const datos = { fechaInicio, fechaFin }
    const erroresValidacion = validarPeriodo(datos)
    if (Object.keys(erroresValidacion).length > 0) {
      mostrarErrores(erroresValidacion)
      return
    }

    setErrores({})
    setGuardando(true)
    const resultado = await onGuardar(datos)
    setGuardando(false)

    if (resultado.estado === 'ok') {
      onGuardado(resultado.datos)
    } else if (!onBloqueado(resultado.error)) {
      mostrarErrorApi(resultado.error)
    }
  }

  const textoBoton = editando ? 'Guardar cambios' : 'Agregar periodo'

  return (
    <section className="publicacion-tarjeta" aria-labelledby="periodo-titulo">
      <h2 id="periodo-titulo" className="publicacion-tarjeta__titulo">
        {editando ? 'Editar periodo' : 'Nuevo periodo'}
      </h2>
      <form className="publicacion-campos" noValidate onSubmit={guardar}>
        <CampoFormulario
          id={ID_INICIO}
          etiqueta="Fecha de inicio"
          control="fecha"
          valor={fechaInicio}
          error={errores.fechaInicio}
          onCambio={(valor) => {
            setFechaInicio(valor)
            setErrores(({ fechaFin: error }) => (error ? { fechaFin: error } : {}))
          }}
        />
        <CampoFormulario
          id={ID_FIN}
          etiqueta="Fecha final"
          control="fecha"
          valor={fechaFin}
          error={errores.fechaFin}
          onCambio={(valor) => {
            setFechaFin(valor)
            setErrores(({ fechaInicio: error }) =>
              error ? { fechaInicio: error } : {},
            )
          }}
        />
        <p className="campo__ayuda">Ambas fechas quedan incluidas en el periodo.</p>

        {errorGeneral && <AvisoError error={errorGeneral} />}

        <div className="periodo-acciones">
          <button className="boton-principal" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : textoBoton}
          </button>
          {editando && (
            <button
              className="boton-secundario"
              type="button"
              disabled={guardando}
              onClick={onCancelar}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

export default FormularioPeriodo
