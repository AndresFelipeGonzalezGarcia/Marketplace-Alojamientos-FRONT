import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { mensajeConReferencia } from '../../api/errores'
import { solicitarRecuperacion } from '../../api/recuperacion'
import BotonCarga from '../acceso/BotonCarga'
import CampoTexto from '../acceso/CampoTexto'
import Icono from '../acceso/Icono'
import EnlaceSimulado from './EnlaceSimulado'

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LONGITUD_MAXIMA_CORREO = 160
const ID_CORREO = 'recuperar-correo'

interface Enviado {
  correo: string
  enlaceSimulado?: string
}

function validarCorreo(correo: string): string | undefined {
  if (!correo) return 'Ingresa tu correo.'
  if (correo.length > LONGITUD_MAXIMA_CORREO || !PATRON_CORREO.test(correo)) {
    return 'Ingresa un correo válido.'
  }
  return undefined
}

function FormularioRecuperacion() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string>()
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState<Enviado | null>(null)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return

    setErrorGeneral('')
    const limpio = correo.trim()
    const errorCorreo = validarCorreo(limpio)
    setError(errorCorreo)
    if (errorCorreo) {
      document.getElementById(ID_CORREO)?.focus()
      return
    }

    setEnviando(true)
    const resultado = await solicitarRecuperacion(limpio)
    setEnviando(false)

    if (resultado.estado === 'error') {
      const errorDelCampo = resultado.error.erroresPorCampo.correo
      if (errorDelCampo) {
        setError(errorDelCampo)
        document.getElementById(ID_CORREO)?.focus()
      } else {
        setErrorGeneral(mensajeConReferencia(resultado.error))
      }
      return
    }

    const enlace = resultado.datos?.enlaceSimulado
    setEnviado({
      correo: limpio,
      enlaceSimulado: typeof enlace === 'string' && enlace ? enlace : undefined,
    })
  }

  if (enviado) {
    // Mensaje neutro: la respuesta es la misma exista o no la cuenta.
    return (
      <section className="acceso__tarjeta">
        <h1 className="acceso__titulo">Revisa tu correo</h1>
        <p className="acceso__aviso" role="status">
          <Icono nombre="correo" className="acceso__aviso-icono" />
          <span>
            Si <strong>{enviado.correo}</strong> está registrado, te llegará un
            enlace para crear una contraseña nueva. El enlace sirve una sola vez
            y vence en poco tiempo.
          </span>
        </p>

        {enviado.enlaceSimulado && (
          <EnlaceSimulado enlace={enviado.enlaceSimulado} />
        )}

        <div className="acceso__acciones">
          <Link className="boton-acceso" to="/login">
            Volver a iniciar sesión
          </Link>
          <button
            type="button"
            className="boton-acceso-secundario"
            onClick={() => setEnviado(null)}
          >
            Usar otro correo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="acceso__tarjeta">
      <h1 className="acceso__titulo">Recuperar contraseña</h1>
      <p className="acceso__subtitulo">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una
        contraseña nueva.
      </p>

      <form className="acceso__formulario" noValidate onSubmit={enviar}>
        <CampoTexto
          id={ID_CORREO}
          etiqueta="Correo"
          tipo="email"
          icono="correo"
          autoComplete="email"
          valor={correo}
          error={error}
          onCambio={(valor) => {
            setCorreo(valor)
            setError(undefined)
          }}
        />

        {errorGeneral && (
          <p className="acceso__alerta" role="alert">
            <Icono nombre="alerta" className="acceso__alerta-icono" />
            <span>{errorGeneral}</span>
          </p>
        )}

        <BotonCarga cargando={enviando} textoCargando="Enviando enlace…">
          Enviar enlace
        </BotonCarga>

        <p className="acceso__pie">
          ¿Ya la recordaste?{' '}
          <Link className="acceso__enlace" to="/login">
            Inicia sesión
          </Link>
        </p>
      </form>
    </section>
  )
}

export default FormularioRecuperacion
