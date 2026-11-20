import { useSearchParams } from 'react-router'
import PantallaAcceso from '../components/acceso/PantallaAcceso'
import EnlaceInvalido from '../components/recuperacion/EnlaceInvalido'
import FormularioRestablecimiento from '../components/recuperacion/FormularioRestablecimiento'

// Longitud del token
const LONGITUD_MAXIMA_TOKEN = 200

function RestablecerContrasenaPage() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token')?.trim() ?? ''
  const tokenValido = token.length > 0 && token.length <= LONGITUD_MAXIMA_TOKEN

  return (
    <PantallaAcceso>
      {tokenValido ? (
        // Formulario
        <FormularioRestablecimiento key={token} token={token} />
      ) : (
        <EnlaceInvalido mensaje="Este enlace para restablecer la contraseña está incompleto. Ábrelo de nuevo desde tu correo o pide uno nuevo." />
      )}
    </PantallaAcceso>
  )
}

export default RestablecerContrasenaPage
