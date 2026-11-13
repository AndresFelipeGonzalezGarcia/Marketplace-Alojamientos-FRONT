import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { iniciarSesion } from '../../api/auth'
import { mensajeConReferencia, type ErrorApi } from '../../api/errores'
import { guardarSesion } from '../../auth/sesion'
import BotonCarga from '../acceso/BotonCarga'
import CampoTexto from '../acceso/CampoTexto'
import Icono from '../acceso/Icono'

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LONGITUD_MAXIMA_CORREO = 160
const LONGITUD_MAXIMA_CONTRASENA = 128
const ID_CORREO = 'login-correo'
const ID_CONTRASENA = 'login-contrasena'

interface Valores {
  correo: string
  contrasena: string
}

type Errores = Partial<Record<keyof Valores, string>>

function validar({ correo, contrasena }: Valores): Errores {
  const errores: Errores = {}
  const limpio = correo.trim()

  if (!limpio) {
    errores.correo = 'Ingresa tu correo.'
  } else if (
    limpio.length > LONGITUD_MAXIMA_CORREO ||
    !PATRON_CORREO.test(limpio)
  ) {
    errores.correo = 'Ingresa un correo válido.'
  }
  if (!contrasena) {
    errores.contrasena = 'Ingresa tu contraseña.'
  } else if (contrasena.length > LONGITUD_MAXIMA_CONTRASENA) {
    errores.contrasena = `La contraseña admite máximo ${LONGITUD_MAXIMA_CONTRASENA} caracteres.`
  }
  return errores
}

function enfocar(campo: keyof Valores) {
  document
    .getElementById(campo === 'correo' ? ID_CORREO : ID_CONTRASENA)
    ?.focus()
}

// Al guardar la sesión, LoginPage redirige sola porque observa useSesion.
function FormularioLogin() {
  const [valores, setValores] = useState<Valores>({
    correo: '',
    contrasena: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(campo: keyof Valores, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  function mostrarErrorApi(error: ErrorApi) {
    const porCampo: Errores = {}
    if (error.erroresPorCampo.correo) {
      porCampo.correo = error.erroresPorCampo.correo
    }
    if (error.erroresPorCampo.contrasena) {
      porCampo.contrasena = error.erroresPorCampo.contrasena
    }
    setErrores(porCampo)

    if (porCampo.correo || porCampo.contrasena) {
      enfocar(porCampo.correo ? 'correo' : 'contrasena')
      return
    }

    setErrorGeneral(mensajeConReferencia(error))
    if (error.codigo === 'CREDENCIALES_INVALIDAS') {
      // Se conserva el correo y se pide de nuevo solo la contraseña.
      setValores((actuales) => ({ ...actuales, contrasena: '' }))
      enfocar('contrasena')
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return

    setErrorGeneral('')
    const erroresValidacion = validar(valores)
    const primero = (['correo', 'contrasena'] as const).find(
      (campo) => erroresValidacion[campo],
    )
    if (primero) {
      setErrores(erroresValidacion)
      enfocar(primero)
      return
    }

    setErrores({})
    setEnviando(true)
    const resultado = await iniciarSesion({
      correo: valores.correo.trim(),
      contrasena: valores.contrasena,
    })

    if (resultado.estado === 'error') {
      setEnviando(false)
      mostrarErrorApi(resultado.error)
      return
    }

    try {
      const { token, expiraEn, usuario } = resultado.datos
      guardarSesion({ token, expiraEn, usuario })
    } catch {
      setEnviando(false)
      setErrorGeneral(
        'No pudimos iniciar tu sesión por una respuesta inesperada del servidor. Inténtalo de nuevo en unos minutos.',
      )
    }
  }

  return (
    <form className="acceso__formulario" noValidate onSubmit={enviar}>
      <CampoTexto
        id={ID_CORREO}
        etiqueta="Correo"
        tipo="email"
        icono="correo"
        autoComplete="email"
        valor={valores.correo}
        error={errores.correo}
        onCambio={(valor) => cambiar('correo', valor)}
      />
      <CampoTexto
        id={ID_CONTRASENA}
        etiqueta="Contraseña"
        tipo="password"
        icono="candado"
        autoComplete="current-password"
        valor={valores.contrasena}
        error={errores.contrasena}
        onCambio={(valor) => cambiar('contrasena', valor)}
      />

      {errorGeneral && (
        <p className="acceso__alerta" role="alert">
          <Icono nombre="alerta" className="acceso__alerta-icono" />
          <span>{errorGeneral}</span>
        </p>
      )}

      <BotonCarga cargando={enviando} textoCargando="Iniciando sesión…">
        Iniciar sesión
      </BotonCarga>

      <p className="acceso__pie">
        ¿Aún no tienes cuenta?{' '}
        <Link className="acceso__enlace" to="/registro">
          Crea una gratis
        </Link>
      </p>
    </form>
  )
}

export default FormularioLogin
