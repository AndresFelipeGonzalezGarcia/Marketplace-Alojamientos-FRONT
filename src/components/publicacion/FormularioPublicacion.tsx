import { useState, type FormEvent } from 'react'
import {
  actualizarPublicacion,
  crearPublicacion,
  TIPOS_ALOJAMIENTO,
  type ErroresPublicacion,
  type Publicacion,
} from '../../api/publicaciones'
import '../formulario/formulario.css'
import CampoFormulario from './CampoFormulario'
import ChipsServicios from './ChipsServicios'
import ListaImagenes from './ListaImagenes'
import PanelRevision from './PanelRevision'
import SeccionDeshabilitada from './SeccionDeshabilitada'
import './publicacion.css'
import {
  aDatosPublicacion,
  aValoresPublicacion,
  evaluarRequisitos,
  validarPublicacion,
  VALORES_VACIOS,
  type ValoresPublicacion,
} from './validacion'

const ORDEN_CAMPOS: (keyof ErroresPublicacion)[] = [
  'titulo',
  'descripcion',
  'ciudad',
  'ubicacion',
  'tipo',
  'capacidad',
  'precioNoche',
  'reglas',
]

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
  const [errores, setErrores] = useState<ErroresPublicacion>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(borradorRecienGuardado)

  const opcionesTipo =
    valores.tipo && !TIPOS_ALOJAMIENTO.includes(valores.tipo)
      ? [...TIPOS_ALOJAMIENTO, valores.tipo]
      : TIPOS_ALOJAMIENTO

  function cambiar<C extends keyof ValoresPublicacion>(
    campo: C,
    valor: ValoresPublicacion[C],
  ) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setGuardado(false)
    setErrores((actuales) => {
      const siguientes = { ...actuales }
      delete siguientes[campo]
      return siguientes
    })
  }

  function alternarServicio(servicio: string) {
    cambiar(
      'servicios',
      valores.servicios.includes(servicio)
        ? valores.servicios.filter((actual) => actual !== servicio)
        : [...valores.servicios, servicio],
    )
  }

  function mostrarErrores(nuevos: ErroresPublicacion) {
    setErrores(nuevos)
    const campo = ORDEN_CAMPOS.find((nombre) => nuevos[nombre])
    if (campo) {
      document.getElementById(`publicacion-${campo}`)?.focus()
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (guardando) {
      return
    }

    setErrorGeneral('')
    setGuardado(false)
    const erroresValidacion = validarPublicacion(valores)
    if (Object.keys(erroresValidacion).length > 0) {
      mostrarErrores(erroresValidacion)
      return
    }

    setErrores({})
    setGuardando(true)
    const datos = aDatosPublicacion(valores)
    const resultado = publicacion
      ? await actualizarPublicacion(publicacion.id, datos)
      : await crearPublicacion(datos)
    setGuardando(false)

    switch (resultado.estado) {
      case 'ok':
        if (publicacion) {
          setEstado(resultado.publicacion.estado)
          setGuardado(true)
        } else {
          onCreada(resultado.publicacion)
        }
        break
      case 'validacion':
        if (Object.keys(resultado.errores).length > 0) {
          mostrarErrores(resultado.errores)
        } else {
          setErrorGeneral('Revisa los datos de la publicación.')
        }
        break
      case 'sesion_invalida':
        setErrorGeneral('Tu sesión no es válida. Inicia sesión de nuevo.')
        break
      case 'acceso_denegado':
      case 'no_encontrada':
        onBloqueada(resultado.estado)
        break
      case 'error':
        setErrorGeneral(
          'No pudimos guardar la publicación. Inténtalo de nuevo en unos minutos.',
        )
        break
    }
  }

  const titulo = publicacion ? 'Editar publicación' : 'Nueva publicación'

  return (
    <>
      <p className="publicacion-migas">Mis publicaciones / {titulo}</p>
      <div className="publicacion-cabecera">
        <h1 className="publicacion-cabecera__titulo">{titulo}</h1>
        {estado && <span className="publicacion-estado">{estado}</span>}
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
                  id="publicacion-ubicacion"
                  etiqueta="Ubicación (texto)"
                  marcador="Barrio o referencia"
                  valor={valores.ubicacion}
                  error={errores.ubicacion}
                  onCambio={(valor) => cambiar('ubicacion', valor)}
                />
              </div>
              <div className="publicacion-fila publicacion-fila--3">
                <CampoFormulario
                  id="publicacion-tipo"
                  etiqueta="Tipo"
                  control="lista"
                  opciones={opcionesTipo}
                  valor={valores.tipo}
                  error={errores.tipo}
                  onCambio={(valor) => cambiar('tipo', valor)}
                />
                <CampoFormulario
                  id="publicacion-capacidad"
                  etiqueta="Capacidad"
                  control="numero"
                  valor={valores.capacidad}
                  error={errores.capacidad}
                  onCambio={(valor) => cambiar('capacidad', valor)}
                />
                <CampoFormulario
                  id="publicacion-precioNoche"
                  etiqueta="Precio por noche (COP)"
                  control="numero"
                  valor={valores.precioNoche}
                  error={errores.precioNoche}
                  onCambio={(valor) => cambiar('precioNoche', valor)}
                />
              </div>
              <ChipsServicios
                seleccionados={valores.servicios}
                onAlternar={alternarServicio}
              />
              <CampoFormulario
                id="publicacion-reglas"
                etiqueta="Reglas de la casa"
                control="area"
                valor={valores.reglas}
                error={errores.reglas}
                onCambio={(valor) => cambiar('reglas', valor)}
              />
              <ListaImagenes
                imagenes={valores.imagenes}
                onCambiar={(imagenes) => cambiar('imagenes', imagenes)}
              />
            </div>
            {errorGeneral && (
              <p className="publicacion-alerta" role="alert">
                {errorGeneral}
              </p>
            )}
          </section>

          <SeccionDeshabilitada />
        </div>

        <PanelRevision
          requisitos={evaluarRequisitos(valores)}
          guardando={guardando}
          guardado={guardado}
        />
      </form>
    </>
  )
}

export default FormularioPublicacion
