// ========================================================================
// FUNCIONES DE LIMPIEZA DE DATOS
// ========================================================================

/**
 * Limpia la clave catastral removiendo guiones y espacios
 */
function limpiarClave(claveRaw) {
  if (!claveRaw) return "";
  return claveRaw.replace(/[^0-9a-zA-Z]/g, "");
}

/**
 * Limpia los valores monetarios y de superficie
 * Remueve: '$', ',', 'm²', 'm2', y espacios.
 */
function limpiarNumero(valorRaw) {
  if (!valorRaw || valorRaw === "No encontrado" || valorRaw === "—") return 0;

  let texto = String(valorRaw).replace(/[^0-9.]/g, "");
  const numero = parseFloat(texto);

  return isNaN(numero) ? 0 : numero;
}

module.exports = {
  limpiarClave,
  limpiarNumero,
};
