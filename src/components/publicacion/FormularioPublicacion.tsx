import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import {
  actualizarPublicacion,
  crearPublicacion,
  TIPOS_ALOJAMIENTO,
  type Publicacion,
} from '../../api/publicaciones'
import '../formulario/formulario.css'
import CampoFormulario from './CampoFormulario'
import ListaImagenes from './ListaImagenes'
import PanelRevision from './PanelRevision'
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
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(borradorRecienGuardado)

  function cambiar<C extends keyof ValoresPublicacion>(
    campo: C,
    valor: ValoresPublicacion[C],
  ) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setGuardado(false)
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
    if (guardando) {
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
        setGuardado(true)
      } else {
        onCreada(resultado.datos)
      }
      return
    }

    switch (resultado.error.codigo) {
      case 'ACCESO_DENEGADO':
        onBloqueada('acceso_denegado')
        break
      case 'PUBLICACION_NO_ENCONTRADA':
      case 'RECURSO_NO_ENCONTRADO':
        onBloqueada('no_encontrada')
        break
      default:
        mostrarErrorApi(resultado.error)
    }
  }

  const titulo = publicacion ? 'Editar publicación' : 'Nueva publicación'

  return (
    <>
      <p className="publicacion-migas">Mis publicaciones / {titulo}</p>
      <div className="publicacion-cabecera">
        <h1 className="publicacion-cabecera__titulo">{titulo}</h1>
        {estado && <span className="publicacion-estado">{estado}</span>}
        {publicacion && (
          <Link
            className="boton-secundario publicacion-enlace"
            to={`/publicaciones/${encodeURIComponent(publicacion.id)}/disponibilidad`}
          >
            Gestionar disponibilidad
          </Link>
        )}
      </div>

      <form className="publicacion-layout" noValidate onSubmit={guardar}>
        <div className="publicacion-columna">
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
        </div>

        <PanelRevision
          requisitos={evaluarRequisitos(valores)}
          guardando={guardando}
          guardado={guardado}
          errorGeneral={errorGeneral}
        />
      </form>
    </>
  )
}

export default FormularioPublicacion
