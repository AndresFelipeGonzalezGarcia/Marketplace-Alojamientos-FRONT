import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import {
  actualizarPublicacion,
  crearPublicacion,
  enviarPublicacion,
  TIPOS_ALOJAMIENTO,
  type Publicacion,
} from '../../api/publicaciones'
import '../formulario/formulario.css'
import AvisoEstado from './AvisoEstado'
import CampoFormulario from './CampoFormulario'
import { sePuedeEditar } from './estadoPublicacion'
import InsigniaEstado from './InsigniaEstado'
import ListaImagenes from './ListaImagenes'
import PanelRevision, { type EstadoEnvio } from './PanelRevision'
import SeccionCondiciones from './SeccionCondiciones'
import './publicacion.css'
import {
  aDatosPublicacion,
  aValoresPublicacion,
  evaluarRequisitos,
  quitarFilasVacias,
  validarPublicacion,
  VALORES_VACIOS,
  type ErroresFormulario,
  type ValoresPublicacion,
} from './validacion'

const ORDEN_CAMPOS = [
  'titulo',
  'descripcion',
  'ciudad',
  'ubicacionTextual',
  'tipo',
  'capacidad',
  'imagenes',
  'precioNoche',
  'tarifaLimpieza',
  'politicaCancelacionId',
  'modoReserva',
  'serviciosIds',
  'reglas',
  'serviciosAdicionales',
]
const PATRON_ERROR_FILA =
  /^(imagenes\[\d+\]|serviciosAdicionales\[\d+\]\.(nombre|costo))$/

function esCampoConocido(campo: string) {
  return ORDEN_CAMPOS.includes(campo) || PATRON_ERROR_FILA.test(campo)
}

function posicionCampo(ruta: string) {
  return ORDEN_CAMPOS.indexOf(ruta.split('[')[0])
}

function enfocarPrimerError(errores: ErroresFormulario) {
  const rutas = Object.keys(errores).sort(
    (a, b) => posicionCampo(a) - posicionCampo(b),
  )
  for (const ruta of rutas) {
    const elemento = document.getElementById(`publicacion-${ruta}`)
    if (elemento) {
      elemento.focus()
      return
    }
  }
}

interface FormularioPublicacionProps {
  publicacion: Publicacion | null
  borradorRecienGuardado: boolean
  onCreada: (publicacion: Publicacion) => void
  onBloqueada: (motivo: 'acceso_denegado' | 'no_encontrada') => void
}

function FormularioPublicacion({
  publicacion,
  borradorRecienGuardado,
  onCreada,
  onBloqueada,
}: FormularioPublicacionProps) {
  const [valores, setValores] = useState<ValoresPublicacion>(
    publicacion ? aValoresPublicacion(publicacion) : VALORES_VACIOS,
  )
  const [estado, setEstado] = useState(publicacion?.estado)
  const [motivoEstado, setMotivoEstado] = useState(publicacion?.motivoEstado)
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(borradorRecienGuardado)
  // El backend revalida lo guardado: no se envía con cambios pendientes.
  const [sinGuardar, setSinGuardar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [recienEnviada, setRecienEnviada] = useState(false)
  const avisoEstado = useRef<HTMLDivElement>(null)
  const editable = sePuedeEditar(estado)

  // El botón de envío desaparece: el foco pasa a la confirmación.
  useEffect(() => {
    if (recienEnviada) {
      avisoEstado.current?.focus()
    }
  }, [recienEnviada])

  function cambiar<C extends keyof ValoresPublicacion>(
    campo: C,
    valor: ValoresPublicacion[C],
  ) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setGuardado(false)
    setSinGuardar(true)
    setErrores((actuales) =>
      Object.fromEntries(
        Object.entries(actuales).filter(([ruta]) => !ruta.startsWith(campo)),
      ),
    )
  }

  function mostrarErrores(nuevos: ErroresFormulario) {
    setErrores(nuevos)
    enfocarPrimerError(nuevos)
  }

  function mostrarErrorApi(error: ErrorApi) {
    const entradas = Object.entries(error.erroresPorCampo)
    const conocidos = entradas.filter(([campo]) => esCampoConocido(campo))
    const desconocidos = entradas
      .filter(([campo]) => !esCampoConocido(campo))
      .map(([, mensaje]) => mensaje)

    mostrarErrores(Object.fromEntries(conocidos))
    if (desconocidos.length > 0) {
      setErrorGeneral(mensajeConReferencia(error, desconocidos.join(' ')))
    } else if (conocidos.length === 0) {
      setErrorGeneral(mensajeConReferencia(error))
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (guardando || enviando || !editable) {
      return
    }

    setErrorGeneral('')
    setGuardado(false)
    // Sin filas vacías, los índices coinciden con los errores del backend.
    const valoresCompactos = quitarFilasVacias(valores)
    setValores(valoresCompactos)
    const erroresValidacion = validarPublicacion(valoresCompactos)
    if (Object.keys(erroresValidacion).length > 0) {
      mostrarErrores(erroresValidacion)
      return
    }

    setErrores({})
    setGuardando(true)
    const datos = aDatosPublicacion(valoresCompactos)
    const resultado = publicacion
      ? await actualizarPublicacion(publicacion.id, datos)
      : await crearPublicacion(datos)
    setGuardando(false)

    if (resultado.estado === 'ok') {
      if (publicacion) {
        setEstado(resultado.datos.estado)
        setMotivoEstado(resultado.datos.motivoEstado)
        setGuardado(true)
        setSinGuardar(false)
      } else {
        onCreada(resultado.datos)
      }
      return
    }

    if (!bloquearPor(resultado.error)) {
      mostrarErrorApi(resultado.error)
    }
  }

  function bloquearPor(error: ErrorApi) {
    switch (error.codigo) {
      case 'ACCESO_DENEGADO':
        onBloqueada('acceso_denegado')
        return true
      case 'PUBLICACION_NO_ENCONTRADA':
      case 'RECURSO_NO_ENCONTRADO':
        onBloqueada('no_encontrada')
        return true
      default:
        return false
    }
  }

  function mostrarPublicacionIncompleta(error: ErrorApi) {
    // Cada detalle va junto a su campo; el aviso general resume.
    const entradas = Object.entries(error.erroresPorCampo)
    const conocidos = entradas.filter(([ruta]) => esCampoConocido(ruta))
    const otros = entradas
      .filter(([ruta]) => !esCampoConocido(ruta))
      .map(([, mensaje]) => mensaje)
    mostrarErrores(Object.fromEntries(conocidos))
    const partes = [
      error.mensaje,
      conocidos.length > 0 ? 'Revisa los campos marcados.' : '',
      ...otros,
    ]
    setErrorGeneral(
      mensajeConReferencia(error, partes.filter(Boolean).join(' ')),
    )
  }

  async function enviar() {
    if (!publicacion || enviando || guardando || sinGuardar) {
      return
    }

    setErrorGeneral('')
    setGuardado(false)
    setEnviando(true)
    const resultado = await enviarPublicacion(publicacion.id)
    setEnviando(false)

    if (resultado.estado === 'ok') {
      setValores(aValoresPublicacion(resultado.datos))
      setEstado(resultado.datos.estado)
      setMotivoEstado(resultado.datos.motivoEstado)
      setErrores({})
      setRecienEnviada(true)
      return
    }

    const { error } = resultado
    if (bloquearPor(error)) {
      return
    }
    switch (error.codigo) {
      case 'PUBLICACION_INCOMPLETA':
        mostrarPublicacionIncompleta(error)
        break
      case 'ESTADO_PUBLICACION_INVALIDO':
        setErrorGeneral(
          mensajeConReferencia(
            error,
            `${error.mensaje} Ya no está en borrador; recarga la página para ver su estado actual.`,
          ),
        )
        break
      default:
        mostrarErrorApi(error)
    }
  }

  const titulo = publicacion ? 'Editar publicación' : 'Nueva publicación'
  const envio: EstadoEnvio = {
    disponible: editable && (!publicacion || estado === 'BORRADOR'),
    enviando,
    impedimento: !publicacion
      ? 'Guarda el borrador para poder enviarlo a revisión.'
      : sinGuardar
        ? 'Guarda los cambios antes de enviarla a revisión.'
        : undefined,
  }

  return (
    <>
      <p className="publicacion-migas">Mis publicaciones / {titulo}</p>
      <div className="publicacion-cabecera">
        <h1 className="publicacion-cabecera__titulo">{titulo}</h1>
        {estado && <InsigniaEstado estado={estado} />}
        {publicacion && (
          <Link
            className="boton-secundario publicacion-enlace"
            to={`/publicaciones/${encodeURIComponent(publicacion.id)}/disponibilidad`}
          >
            Gestionar disponibilidad
          </Link>
        )}
      </div>

      {estado && !editable && (
        <AvisoEstado
          ref={avisoEstado}
          estado={estado}
          motivo={motivoEstado}
          recienEnviada={recienEnviada}
        />
      )}

      <form
        className={`publicacion-layout${editable ? '' : ' publicacion-layout--lectura'}`}
        noValidate
        onSubmit={guardar}
      >
        {/* En solo lectura el fieldset deshabilita todos los controles. */}
        <fieldset className="publicacion-columna" disabled={!editable}>
          <legend className="solo-lector">Datos de la publicación</legend>
          <section
            className="publicacion-tarjeta"
            aria-labelledby="publicacion-seccion-1"
          >
            <h2
              id="publicacion-seccion-1"
              className="publicacion-tarjeta__titulo"
            >
              1. Información del alojamiento
            </h2>
            <div className="publicacion-campos">
              <CampoFormulario
                id="publicacion-titulo"
                etiqueta="Título"
                marcador="Título de la publicación"
                valor={valores.titulo}
                error={errores.titulo}
                onCambio={(valor) => cambiar('titulo', valor)}
              />
              <CampoFormulario
                id="publicacion-descripcion"
                etiqueta="Descripción"
                control="area"
                valor={valores.descripcion}
                error={errores.descripcion}
                onCambio={(valor) => cambiar('descripcion', valor)}
              />
              <div className="publicacion-fila publicacion-fila--2">
                <CampoFormulario
                  id="publicacion-ciudad"
                  etiqueta="Ciudad"
                  valor={valores.ciudad}
                  error={errores.ciudad}
                  onCambio={(valor) => cambiar('ciudad', valor)}
                />
                <CampoFormulario
                  id="publicacion-ubicacionTextual"
                  etiqueta="Ubicación (texto)"
                  marcador="Barrio o referencia"
                  valor={valores.ubicacionTextual}
                  error={errores.ubicacionTextual}
                  onCambio={(valor) => cambiar('ubicacionTextual', valor)}
                />
              </div>
              <div className="publicacion-fila publicacion-fila--2">
                <CampoFormulario
                  id="publicacion-tipo"
                  etiqueta="Tipo"
                  control="lista"
                  opciones={TIPOS_ALOJAMIENTO}
                  valor={valores.tipo}
                  error={errores.tipo}
                  onCambio={(valor) =>
                    cambiar('tipo', valor as ValoresPublicacion['tipo'])
                  }
                />
                <CampoFormulario
                  id="publicacion-capacidad"
                  etiqueta="Capacidad"
                  control="numero"
                  valor={valores.capacidad}
                  error={errores.capacidad}
                  onCambio={(valor) => cambiar('capacidad', valor)}
                />
              </div>
              <ListaImagenes
                imagenes={valores.imagenes}
                errores={errores}
                onCambiar={(imagenes) => cambiar('imagenes', imagenes)}
              />
            </div>
          </section>

          <SeccionCondiciones
            valores={valores}
            errores={errores}
            onCambiar={cambiar}
          />
        </fieldset>

        {editable && (
          <PanelRevision
            requisitos={evaluarRequisitos(valores)}
            guardando={guardando}
            guardado={guardado}
            errorGeneral={errorGeneral}
            envio={envio}
            onEnviar={enviar}
          />
        )}
      </form>
    </>
  )
}

export default FormularioPublicacion
