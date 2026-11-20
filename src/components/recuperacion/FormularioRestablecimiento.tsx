import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import { restablecerContrasena } from '../../api/recuperacion'
import {
  cumplePoliticaContrasena,
  ERROR_POLITICA_CONTRASENA,
  TEXTO_POLITICA_CONTRASENA,
} from '../../auth/politicaContrasena'
import type { EstadoRedireccionLogin } from '../../auth/roles'
import BotonCarga from '../acceso/BotonCarga'
import CampoTexto from '../acceso/CampoTexto'
import Icono from '../acceso/Icono'
import EnlaceInvalido from './EnlaceInvalido'

interface Valores {
  nuevaContrasena: string
  confirmarContrasena: string
}

type Campo = keyof Valores
type Errores = Partial<Record<Campo, string>>

const ORDEN_CAMPOS: Campo[] = ['nuevaContrasena', 'confirmarContrasena']

interface FormularioRestablecimientoProps {
  token: string
}

function validar({ nuevaContrasena, confirmarContrasena }: Valores): Errores {
  const errores: Errores = {}
  if (!nuevaContrasena) {
    errores.nuevaContrasena = 'Ingresa tu nueva contraseña.'
  } else if (!cumplePoliticaContrasena(nuevaContrasena)) {
    errores.nuevaContrasena = ERROR_POLITICA_CONTRASENA
  }
  if (!confirmarContrasena) {
    errores.confirmarContrasena = 'Confirma tu nueva contraseña.'
  } else if (confirmarContrasena !== nuevaContrasena) {
    errores.confirmarContrasena = 'Las contraseñas no coinciden.'
  }
  return errores
}

function enfocarPrimerError(errores: Errores) {
  const campo = ORDEN_CAMPOS.find((nombre) => errores[nombre])
  if (campo) {
    document.getElementById(`restablecer-${campo}`)?.focus()
  }
}

function esCampo(nombre: string): nombre is Campo {
  return (ORDEN_CAMPOS as string[]).includes(nombre)
}

function FormularioRestablecimiento({
  token,
}: FormularioRestablecimientoProps) {
  const navigate = useNavigate()
  const [valores, setValores] = useState<Valores>({
    nuevaContrasena: '',
    confirmarContrasena: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enlaceInvalido, setEnlaceInvalido] = useState('')

  function cambiar(campo: Campo, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setErrores((actuales) => {
      const siguientes = { ...actuales }
      delete siguientes[campo]
      if (campo === 'nuevaContrasena') delete siguientes.confirmarContrasena
      return siguientes
    })
  }

  function mostrarErrorApi(error: ErrorApi) {
    // Token inválido
    if (error.codigo === 'ENLACE_INVALIDO' || error.erroresPorCampo.token) {
      setEnlaceInvalido(
        error.codigo === 'ENLACE_INVALIDO'
          ? error.mensaje
          : 'Este enlace para restablecer la contraseña no es válido. Pide uno nuevo para continuar.',
      )
      return
    }

    const porCampo: Errores = {}
    const sinCampo: string[] = []
    for (const [campo, mensaje] of Object.entries(error.erroresPorCampo)) {
      if (esCampo(campo)) {
        porCampo[campo] = mensaje
      } else {
        sinCampo.push(mensaje)
      }
    }

    setErrores(porCampo)
    enfocarPrimerError(porCampo)
    if (sinCampo.length > 0) {
      setErrorGeneral(mensajeConReferencia(error, sinCampo.join(' ')))
    } else if (Object.keys(porCampo).length === 0) {
      setErrorGeneral(mensajeConReferencia(error))
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return

    setErrorGeneral('')
    const erroresValidacion = validar(valores)
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion)
      enfocarPrimerError(erroresValidacion)
      return
    }

    setErrores({})
    setEnviando(true)
    const resultado = await restablecerContrasena({
      token,
      nuevaContrasena: valores.nuevaContrasena,
    })
    setEnviando(false)

    if (resultado.estado === 'error') {
      mostrarErrorApi(resultado.error)
      return
    }

    const estado: EstadoRedireccionLogin = { aviso: 'contrasena-restablecida' }
    navigate('/login', { replace: true, state: estado })
  }

  if (enlaceInvalido) {
    return <EnlaceInvalido mensaje={enlaceInvalido} />
  }

  return (
    <section className="acceso__tarjeta">
      <h1 className="acceso__titulo">Crea una contraseña nueva</h1>
      <p className="acceso__subtitulo">
        Escríbela dos veces. Después podrás iniciar sesión con ella.
      </p>

      <form className="acceso__formulario" noValidate onSubmit={enviar}>
        <CampoTexto
          id="restablecer-nuevaContrasena"
          etiqueta="Nueva contraseña"
          tipo="password"
          icono="candado"
          autoComplete="new-password"
          ayuda={TEXTO_POLITICA_CONTRASENA}
          valor={valores.nuevaContrasena}
          error={errores.nuevaContrasena}
          onCambio={(valor) => cambiar('nuevaContrasena', valor)}
        />
        <CampoTexto
          id="restablecer-confirmarContrasena"
          etiqueta="Confirmar nueva contraseña"
          tipo="password"
          icono="candado"
          autoComplete="new-password"
          valor={valores.confirmarContrasena}
          error={errores.confirmarContrasena}
          onCambio={(valor) => cambiar('confirmarContrasena', valor)}
        />

        {errorGeneral && (
          <p className="acceso__alerta" role="alert">
            <Icono nombre="alerta" className="acceso__alerta-icono" />
            <span>{errorGeneral}</span>
          </p>
        )}

        <BotonCarga cargando={enviando} textoCargando="Guardando contraseña…">
          Guardar contraseña
        </BotonCarga>

        <p className="acceso__pie">
          <Link className="acceso__enlace" to="/login">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </section>
  )
}

export default FormularioRestablecimiento
