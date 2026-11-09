import { useState, type FormEvent } from 'react'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import { registrarUsuario, type Rol } from '../../api/registro'
import '../formulario/formulario.css'
import CampoTexto from './CampoTexto'
import TarjetaRol from './TarjetaRol'
import './registro.css'

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LONGITUD_MAXIMA_NOMBRE = 120
const LONGITUD_MAXIMA_CORREO = 160
const LONGITUD_MAXIMA_TELEFONO = 30
const LONGITUD_MINIMA_CONTRASENA = 8
const LONGITUD_MAXIMA_CONTRASENA = 128
const POLITICA_CONTRASENA = `De ${LONGITUD_MINIMA_CONTRASENA} a ${LONGITUD_MAXIMA_CONTRASENA} caracteres, con mayúscula, minúscula, número y símbolo.`

interface Valores {
  nombre: string
  correo: string
  telefono: string
  contrasena: string
  confirmarContrasena: string
}

type Campo = keyof Valores | 'rol'
type Errores = Partial<Record<Campo, string>>

const ORDEN_CAMPOS: Campo[] = [
  'rol',
  'nombre',
  'correo',
  'telefono',
  'contrasena',
  'confirmarContrasena',
]

const NOMBRES_ROL: Record<Rol, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
}

function cumplePoliticaContrasena(contrasena: string) {
  return (
    contrasena.length >= LONGITUD_MINIMA_CONTRASENA &&
    contrasena.length <= LONGITUD_MAXIMA_CONTRASENA &&
    /\p{Lu}/u.test(contrasena) &&
    /\p{Ll}/u.test(contrasena) &&
    /\d/.test(contrasena) &&
    /[^\p{L}\p{N}\s]/u.test(contrasena)
  )
}

function validar(valores: Valores, rol: Rol | null): Errores {
  const errores: Errores = {}
  const nombre = valores.nombre.trim()
  const correo = valores.correo.trim()

  if (!rol) {
    errores.rol = 'Selecciona un tipo de cuenta.'
  }
  if (!nombre) {
    errores.nombre = 'Ingresa tu nombre completo.'
  } else if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    errores.nombre = `El nombre admite máximo ${LONGITUD_MAXIMA_NOMBRE} caracteres.`
  }
  if (!correo) {
    errores.correo = 'Ingresa tu correo.'
  } else if (
    correo.length > LONGITUD_MAXIMA_CORREO ||
    !PATRON_CORREO.test(correo)
  ) {
    errores.correo = 'Ingresa un correo válido.'
  }
  if (valores.telefono.trim().length > LONGITUD_MAXIMA_TELEFONO) {
    errores.telefono = `El teléfono admite máximo ${LONGITUD_MAXIMA_TELEFONO} caracteres.`
  }
  if (!cumplePoliticaContrasena(valores.contrasena)) {
    errores.contrasena = `La contraseña debe tener de ${LONGITUD_MINIMA_CONTRASENA} a ${LONGITUD_MAXIMA_CONTRASENA} caracteres, con mayúscula, minúscula, número y símbolo.`
  }
  if (!valores.confirmarContrasena) {
    errores.confirmarContrasena = 'Confirma tu contraseña.'
  } else if (valores.confirmarContrasena !== valores.contrasena) {
    errores.confirmarContrasena = 'Las contraseñas no coinciden.'
  }

  return errores
}

function enfocarPrimerError(errores: Errores) {
  const campo = ORDEN_CAMPOS.find((nombre) => errores[nombre])
  if (campo) {
    document.getElementById(`registro-${campo}`)?.focus()
  }
}

function esCampo(nombre: string): nombre is Campo {
  return (ORDEN_CAMPOS as string[]).includes(nombre)
}

function FormularioRegistro() {
  const [rol, setRol] = useState<Rol | null>(null)
  const [valores, setValores] = useState<Valores>({
    nombre: '',
    correo: '',
    telefono: '',
    contrasena: '',
    confirmarContrasena: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [rolCreado, setRolCreado] = useState<Rol | null>(null)

  function limpiarErrores(...campos: Campo[]) {
    setErrores((actuales) => {
      const siguientes = { ...actuales }
      campos.forEach((campo) => delete siguientes[campo])
      return siguientes
    })
  }

  function cambiarValor(campo: keyof Valores, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    limpiarErrores(
      campo,
      ...(campo === 'contrasena' ? (['confirmarContrasena'] as const) : []),
    )
  }

  function mostrarErrores(nuevos: Errores) {
    setErrores(nuevos)
    enfocarPrimerError(nuevos)
  }

  function mostrarErrorApi(error: ErrorApi) {
    const porCampo: Errores = {}
    const sinCampo: string[] = []

    for (const [campo, mensaje] of Object.entries(error.erroresPorCampo)) {
      if (esCampo(campo)) {
        porCampo[campo] = mensaje
      } else {
        sinCampo.push(mensaje)
      }
    }

    mostrarErrores(porCampo)
    if (sinCampo.length > 0) {
      setErrorGeneral(mensajeConReferencia(error, sinCampo.join(' ')))
    } else if (Object.keys(porCampo).length === 0) {
      setErrorGeneral(mensajeConReferencia(error))
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) {
      return
    }

    setErrorGeneral('')
    const erroresValidacion = validar(valores, rol)
    if (!rol || Object.keys(erroresValidacion).length > 0) {
      mostrarErrores(erroresValidacion)
      return
    }

    setErrores({})
    setEnviando(true)
    const telefono = valores.telefono.trim()
    const resultado = await registrarUsuario({
      nombre: valores.nombre.trim(),
      correo: valores.correo.trim(),
      ...(telefono ? { telefono } : {}),
      contrasena: valores.contrasena,
      rol,
    })
    setEnviando(false)

    if (resultado.estado === 'ok') {
      setRolCreado(rol)
    } else {
      mostrarErrorApi(resultado.error)
    }
  }

  if (rolCreado) {
    return (
      <section className="registro-tarjeta" role="status">
        <h1 className="registro-tarjeta__titulo">Cuenta creada</h1>
        <p className="registro-exito">
          Tu cuenta de {NOMBRES_ROL[rolCreado]} quedó creada.
        </p>
      </section>
    )
  }

  return (
    <section className="registro-tarjeta">
      <h1 className="registro-tarjeta__titulo">Crear cuenta</h1>

      <form className="registro-formulario" noValidate onSubmit={enviar}>
        <fieldset
          className="registro-roles"
          aria-describedby={errores.rol ? 'registro-rol-error' : undefined}
        >
          <legend className="campo__etiqueta">Tipo de cuenta</legend>
          <div className="registro-roles__opciones">
            <TarjetaRol
              id="registro-rol"
              rol="HUESPED"
              titulo="Huésped"
              descripcion="Busco y reservo alojamientos"
              seleccionada={rol === 'HUESPED'}
              onSeleccionar={(nuevo) => {
                setRol(nuevo)
                limpiarErrores('rol')
              }}
            />
            <TarjetaRol
              id="registro-rol-anfitrion"
              rol="ANFITRION"
              titulo="Anfitrión"
              descripcion="Publico y administro mis alojamientos"
              seleccionada={rol === 'ANFITRION'}
              onSeleccionar={(nuevo) => {
                setRol(nuevo)
                limpiarErrores('rol')
              }}
            />
          </div>
          {errores.rol && (
            <p id="registro-rol-error" className="campo__error">
              {errores.rol}
            </p>
          )}
        </fieldset>

        <CampoTexto
          id="registro-nombre"
          etiqueta="Nombre completo"
          tipo="text"
          icono="usuario"
          autoComplete="name"
          valor={valores.nombre}
          error={errores.nombre}
          onCambio={(valor) => cambiarValor('nombre', valor)}
        />
        <CampoTexto
          id="registro-correo"
          etiqueta="Correo"
          tipo="email"
          icono="correo"
          autoComplete="email"
          valor={valores.correo}
          error={errores.correo}
          onCambio={(valor) => cambiarValor('correo', valor)}
        />
        <CampoTexto
          id="registro-telefono"
          etiqueta="Teléfono (opcional)"
          tipo="tel"
          icono="telefono"
          autoComplete="tel"
          valor={valores.telefono}
          error={errores.telefono}
          onCambio={(valor) => cambiarValor('telefono', valor)}
        />
        <CampoTexto
          id="registro-contrasena"
          etiqueta="Contraseña"
          tipo="password"
          icono="candado"
          autoComplete="new-password"
          ayuda={POLITICA_CONTRASENA}
          valor={valores.contrasena}
          error={errores.contrasena}
          onCambio={(valor) => cambiarValor('contrasena', valor)}
        />
        <CampoTexto
          id="registro-confirmarContrasena"
          etiqueta="Confirmar contraseña"
          tipo="password"
          icono="candado"
          autoComplete="new-password"
          valor={valores.confirmarContrasena}
          error={errores.confirmarContrasena}
          onCambio={(valor) => cambiarValor('confirmarContrasena', valor)}
        />

        {errorGeneral && (
          <p className="registro-alerta" role="alert">
            {errorGeneral}
          </p>
        )}

        <button className="boton-principal" type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
    </section>
  )
}

export default FormularioRegistro
