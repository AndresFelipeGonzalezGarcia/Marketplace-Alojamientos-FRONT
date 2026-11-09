import { useState, type FormEvent } from 'react'
import { registrarUsuario, type Rol } from '../../api/registro'
import '../formulario/formulario.css'
import CampoTexto from './CampoTexto'
import TarjetaRol from './TarjetaRol'
import './registro.css'

const LONGITUD_MINIMA_CONTRASENA = 8
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Valores {
  nombreCompleto: string
  correo: string
  contrasena: string
  confirmarContrasena: string
}

type Campo = keyof Valores | 'rol'
type Errores = Partial<Record<Campo, string>>

const ORDEN_CAMPOS: Campo[] = [
  'rol',
  'nombreCompleto',
  'correo',
  'contrasena',
  'confirmarContrasena',
]

const NOMBRES_ROL: Record<Rol, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
}

function validar(valores: Valores, rol: Rol | null): Errores {
  const errores: Errores = {}

  if (!rol) {
    errores.rol = 'Selecciona un tipo de cuenta.'
  }
  if (!valores.nombreCompleto.trim()) {
    errores.nombreCompleto = 'Ingresa tu nombre completo.'
  }
  if (!valores.correo.trim()) {
    errores.correo = 'Ingresa tu correo.'
  } else if (!PATRON_CORREO.test(valores.correo.trim())) {
    errores.correo = 'Ingresa un correo válido.'
  }
  if (valores.contrasena.length < LONGITUD_MINIMA_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres.`
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

function FormularioRegistro() {
  const [rol, setRol] = useState<Rol | null>(null)
  const [valores, setValores] = useState<Valores>({
    nombreCompleto: '',
    correo: '',
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
    const resultado = await registrarUsuario({
      nombreCompleto: valores.nombreCompleto.trim(),
      correo: valores.correo.trim(),
      contrasena: valores.contrasena,
      rol,
    })
    setEnviando(false)

    switch (resultado.estado) {
      case 'ok':
        setRolCreado(rol)
        break
      case 'correo_duplicado':
        mostrarErrores({ correo: 'Este correo ya está registrado.' })
        break
      case 'contrasena_invalida':
        mostrarErrores({
          contrasena: 'La contraseña no cumple la política de seguridad.',
        })
        break
      case 'error':
        setErrorGeneral(
          'No pudimos crear tu cuenta. Inténtalo de nuevo en unos minutos.',
        )
        break
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
          id="registro-nombreCompleto"
          etiqueta="Nombre completo"
          tipo="text"
          icono="usuario"
          autoComplete="name"
          valor={valores.nombreCompleto}
          error={errores.nombreCompleto}
          onCambio={(valor) => cambiarValor('nombreCompleto', valor)}
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
          id="registro-contrasena"
          etiqueta="Contraseña"
          tipo="password"
          icono="candado"
          autoComplete="new-password"
          ayuda={`Mínimo ${LONGITUD_MINIMA_CONTRASENA} caracteres.`}
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
