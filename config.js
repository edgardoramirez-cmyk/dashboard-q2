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

   2) Escribe el NOMBRE de cada pestaña tal cual aparece abajo
      en el Sheet (la etiqueta de la pestañita, no la URL).
      Si renombrás una pestaña, solo actualizá el texto aquí.

   3) Guarda este archivo y súbelo a GitHub junto al resto.

   Nota: antes esto se configuraba con el "gid" (un número en la
   URL). Se cambió a nombre de pestaña porque el gid se rompe
   cada vez que una hoja se borra y se vuelve a crear (fue lo que
   pasó con Starlink). El nombre es lo que ves y controlás vos.
   ============================================================ */

var LIVE_CONFIG = {
  enabled: true,

  // ID del libro (ya viene puesto, es el de tu URL):
  spreadsheetId: "1LOWxXvceZcmf1tJnL5g1m6qvDfTV7WpnJn5U_oNb7KI",

  // Nombre exacto de cada pestaña. Deja "" en las que aún no tengas;
  // esas seguirán mostrando la copia local hasta que las llenes.
  sheets: {
    cambiosFase:      "Cambios Fase",
    inspeccion:       "DATA_INSPECCION",
    reparacion:       "DATA_REPARACION",
    mantenimiento:    "DATA_MANTENIMIENTO",
    anchosBanda:      "Anchos de Banda",
    fibra:            "Cortes de Fibra Optica",
    starlink:         "Starlink",
    cobertura:        "Cobertura",
    dimensionamiento: "Dimensionamiento RT",
    ticketSDP:        "TICKET SDP"
  }
};
