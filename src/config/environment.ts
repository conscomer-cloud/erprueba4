/**
 * Banderas de entorno del cliente.
 *
 * Vive en su propio módulo para que Header y App no se importen mutuamente:
 * la dependencia circular funcionaba en desarrollo pero es frágil al empaquetar.
 */

/**
 * Habilita el simulador multiusuario, la prueba maestra E2E y el selector de
 * rol. Son herramientas de prueba: en producción quedan ocultas salvo que se
 * defina VITE_ENABLE_DEV_TOOLS=true al compilar.
 */
export const DEV_TOOLS_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

/**
 * Muestra los accesos rápidos de demostración en la pantalla de acceso.
 * Deshabilitado en producción: publicaban la contraseña de las cuentas
 * sembradas en la interfaz.
 */
export const DEMO_LOGIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
