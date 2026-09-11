/**
 * Backend del formulario "Descargar CV" de la landing.
 *
 * Recibe un POST (application/x-www-form-urlencoded) con:
 *   - nombre
 *   - correo
 *
 * Acciones:
 *   1. Registra la fila en la Google Sheet.
 *   2. Responde el CV en PDF por correo al interesado.
 *
 * NOTA: este archivo es la copia versionada. La que se ejecuta es la de
 * script.google.com > Codigo.gs. Tras editar aquí, pega el contenido allá
 * y vuelve a implementar (Implementar > Gestionar implementaciones > editar
 * > Nueva versión).
 */

// ==== CONFIG — ajusta estos valores a los tuyos ==========================
var SHEET_ID   = 'PON_AQUI_EL_ID_DE_TU_HOJA';      // ID en la URL de la Google Sheet
var SHEET_NAME = 'Leads';                          // pestaña donde se registran los leads
var CV_URL     = 'PON_AQUI_LA_URL_DE_DESCARGA_DEL_CV'; // p. ej. https://drive.google.com/uc?export=download&id=XXXX
var NOTIFY_TO  = 'tahu.zavala@gmail.com';          // aviso interno (deja '' para desactivar)
// ========================================================================

function doPost(e) {
  try {
    var nombre = (e && e.parameter && e.parameter.nombre ? e.parameter.nombre : '').toString().trim();
    var correo = (e && e.parameter && e.parameter.correo ? e.parameter.correo : '').toString().trim();

    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return json_({ ok: false, error: 'datos_invalidos' });
    }

    // 1) Registrar en la hoja
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sh.appendRow([new Date(), nombre, correo]);

    // 2) Obtener el CV como PDF con nombre correcto (evita el "uc.bin")
    var cvBlob = UrlFetchApp.fetch(CV_URL)
      .getBlob()
      .getAs('application/pdf')
      .setName('Alejandro_Zavala_Alegria_CV.pdf');

    // 3) Enviar el correo automático al interesado
    var asunto = 'Mi CV — Alejandro Zavala Alegría (Tahú)';

    var cuerpo =
      'Hola ' + nombre + ',\n\n' +
      'Gracias por tu interés. Soy Alejandro Zavala Alegría (Tahú), estratega de ' +
      'marketing digital e inteligencia comercial con 13+ años de experiencia, ' +
      'combinando ejecución táctica (Meta, Google, TikTok Ads, LinkedIn, Pinterest) ' +
      'con dirección de plan anual y Business Intelligence.\n\n' +
      'Adjunto encontrarás mi CV completo. Pero también puedes ver mi trayectoria ' +
      'en LinkedIn: https://www.linkedin.com/in/holatahu/\n\n' +
      'Déjame contarte de las áreas donde aporto más valor:\n\n' +
      '- Growth marketing\n' +
      '- Arquitectura MarTech (HubSpot, GA4, automatización)\n' +
      '- Performance media\n' +
      '- Dashboards ejecutivos para decisiones basadas en datos\n\n' +
      'Estoy buscando activamente una posición de dirección en marketing digital o ' +
      'inteligencia comercial, con prioridad en modalidad remota, sin cerrarme a ' +
      'híbrido o presencial — dispuesto a cambio de residencia.\n\n' +
      'Me encantaría poder escuchar su propuesta y platicar de ella.\n\n' +
      'Saludos,\n' +
      'Alejandro Zavala Alegría';

    MailApp.sendEmail({
      to: correo,
      subject: asunto,
      body: cuerpo,
      name: 'Alejandro Zavala Alegría',
      attachments: [cvBlob]
    });

    // 4) Aviso interno (opcional)
    if (NOTIFY_TO) {
      MailApp.sendEmail({
        to: NOTIFY_TO,
        subject: 'Nuevo lead CV: ' + nombre,
        body: nombre + ' <' + correo + '> solicitó el CV el ' + new Date()
      });
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
