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
    cambiosFase:      "1241249610",   // pestaña: Cambios Fase
    inspeccion:       "1440900351",   // pestaña: DATA_INSPECCION
    reparacion:       "961746831",   // pestaña: DATA_REPARACION
    mantenimiento:    "396709499",   // pestaña: DATA_MANTENIMIENTO
    anchosBanda:      "2076061251",   // pestaña: Anchos de Banda
    fibra:            "80312339",   // pestaña: Cortes de Fibra Optica
    starlink:         "283482419",   // pestaña: Starlink
    cobertura:        "1060545745",   // pestaña: Cobertura
    dimensionamiento: "2114092089"    // pestaña: Dimensionamiento RT
  }
};
