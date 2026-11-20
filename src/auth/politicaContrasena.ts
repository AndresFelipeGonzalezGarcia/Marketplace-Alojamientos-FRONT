// Política de contraseña
export const LONGITUD_MINIMA_CONTRASENA = 8
export const LONGITUD_MAXIMA_CONTRASENA = 128

export const TEXTO_POLITICA_CONTRASENA = `De ${LONGITUD_MINIMA_CONTRASENA} a ${LONGITUD_MAXIMA_CONTRASENA} caracteres, con mayúscula, minúscula, número y símbolo.`

export const ERROR_POLITICA_CONTRASENA = `La contraseña debe tener de ${LONGITUD_MINIMA_CONTRASENA} a ${LONGITUD_MAXIMA_CONTRASENA} caracteres, con mayúscula, minúscula, número y símbolo.`

export function cumplePoliticaContrasena(contrasena: string): boolean {
  return (
    contrasena.length >= LONGITUD_MINIMA_CONTRASENA &&
    contrasena.length <= LONGITUD_MAXIMA_CONTRASENA &&
    /\p{Lu}/u.test(contrasena) &&
    /\p{Ll}/u.test(contrasena) &&
    /\d/.test(contrasena) &&
    /[^\p{L}\p{N}\s]/u.test(contrasena)
  )
}
