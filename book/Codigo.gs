/**
 * Backend del formulario "Descargar CV" de la landing.
 *
 * Recibe un POST (application/x-www-form-urlencoded) con:
 *   - nombre
 *   - correo
 *   - lang  ("es" o "en" — idioma activo del toggle en el momento del envío)
 *
 * Acciones:
 *   1. Registra la fila en la Google Sheet (incluye el idioma).
 *   2. Responde el CV en PDF (español o inglés según lang) por correo al interesado,
 *      con el asunto y cuerpo del correo también en ese idioma.
 *
 * NOTA: este archivo es la copia versionada. La que se ejecuta es la de
 * script.google.com > Codigo.gs. Tras editar aquí, pega el contenido allá
 * y vuelve a implementar (Implementar > Gestionar implementaciones > editar
 * > Nueva versión).
 */

// ==== CONFIG — ajusta estos valores a los tuyos ==========================
var SHEET_ID   = 'PON_AQUI_EL_ID_DE_TU_HOJA';      // ID en la URL de la Google Sheet
var SHEET_NAME = 'Leads';                          // pestaña donde se registran los leads
var CV_URL_ES  = 'https://drive.google.com/uc?export=download&id=1_C4PrFg4snAR-C_0oNc-MsIVZb-AdCeU';
var CV_URL_EN  = 'https://drive.google.com/uc?export=download&id=1CX4qWRBaGT1s-ZXEpExG40URlpjvgAYQ';
var NOTIFY_TO  = 'tahu.zavala@gmail.com';          // aviso interno (deja '' para desactivar)
// ========================================================================

function doPost(e) {
  try {
    var nombre = (e && e.parameter && e.parameter.nombre ? e.parameter.nombre : '').toString().trim();
    var correo = (e && e.parameter && e.parameter.correo ? e.parameter.correo : '').toString().trim();
    var lang   = (e && e.parameter && e.parameter.lang === 'en') ? 'en' : 'es';

    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return json_({ ok: false, error: 'datos_invalidos' });
    }

    // 1) Registrar en la hoja
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sh.appendRow([new Date(), nombre, correo, lang]);

    // 2) Obtener el CV correcto como PDF con nombre correcto (evita el "uc.bin")
    var cvUrl    = (lang === 'en') ? CV_URL_EN : CV_URL_ES;
    var fileName = (lang === 'en') ? 'Alejandro_Zavala_Alegria_CV_EN.pdf' : 'Alejandro_Zavala_Alegria_CV.pdf';
    var cvBlob = UrlFetchApp.fetch(cvUrl)
      .getBlob()
      .getAs('application/pdf')
      .setName(fileName);

    // 3) Enviar el correo automático al interesado, en su idioma
    var asunto, cuerpo;

    if (lang === 'en') {
      asunto = 'My CV — Alejandro Zavala Alegría (Tahú)';
      cuerpo =
        'Hi ' + nombre + ',\n\n' +
        'Thanks for your interest. I\'m Alejandro Zavala Alegría (Tahú), a digital ' +
        'marketing and commercial intelligence strategist with 13+ years of experience, ' +
        'combining hands-on execution (Meta, Google, TikTok Ads, LinkedIn, Pinterest) ' +
        'with annual planning and Business Intelligence leadership.\n\n' +
        'Attached you\'ll find my full CV. You can also see my background on LinkedIn: ' +
        'https://www.linkedin.com/in/holatahu/\n\n' +
        'A quick summary of where I add the most value:\n\n' +
        '- Growth marketing\n' +
        '- MarTech architecture (HubSpot, GA4, automation)\n' +
        '- Performance media\n' +
        '- Executive dashboards for data-driven decisions\n\n' +
        'I\'m actively looking for a director-level position in digital marketing or ' +
        'commercial intelligence, with a preference for remote work — open to hybrid, ' +
        'on-site, or relocation as well.\n\n' +
        'I\'d love to hear more about your opportunity and talk it through.\n\n' +
        'Best,\n' +
        'Alejandro Zavala Alegría';
    } else {
      asunto = 'Mi CV — Alejandro Zavala Alegría (Tahú)';
      cuerpo =
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
    }

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
        subject: 'Nuevo lead CV (' + lang + '): ' + nombre,
        body: nombre + ' <' + correo + '> solicitó el CV en ' + lang + ' el ' + new Date()
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
