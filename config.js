/* ============================================================
   CONFIGURACIÓN DE DATOS EN VIVO
   ------------------------------------------------------------
   El dashboard intenta leer el Google Sheet en tiempo real.
   Si no lo logra (sin conexión, Sheet privado, etc.) usa
   automáticamente la copia local de data.js. Nunca se rompe.

   PASOS PARA ACTIVARLO (una sola vez):

   1) Abre el Google Sheet y compártelo:
      Compartir → Acceso general → "Cualquiera con el enlace"
      con rol "Lector".  (Necesario para que el navegador de
      quien abra el dashboard pueda leerlo.)

   2) Copia el gid de CADA pestaña. Al hacer clic en una
      pestaña, la URL termina en algo como:  #gid=2114092089
      Ese número es el gid de esa hoja. Pégalo abajo.

   3) Guarda este archivo y súbelo a GitHub junto al resto.
   ============================================================ */

var LIVE_CONFIG = {
  enabled: true,

  // ID del libro (ya viene puesto, es el de tu URL):
  spreadsheetId: "1LOWxXvceZcmf1tJnL5g1m6qvDfTV7WpnJn5U_oNb7KI",

  // gid de cada pestaña. Deja "" en las que aún no tengas;
  // esas seguirán mostrando la copia local hasta que las llenes.
  gids: {
    cambiosFase:      "",   // pestaña: Cambios Fase
    inspeccion:       "",   // pestaña: DATA_INSPECCION
    reparacion:       "",   // pestaña: DATA_REPARACION
    mantenimiento:    "",   // pestaña: DATA_MANTENIMIENTO
    anchosBanda:      "",   // pestaña: Anchos de Banda
    fibra:            "",   // pestaña: Cortes de Fibra Optica
    starlink:         "",   // pestaña: Starlink
    cobertura:        "",   // pestaña: Cobertura
    dimensionamiento: ""    // pestaña: Dimensionamiento RT
  }
};
