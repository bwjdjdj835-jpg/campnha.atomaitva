// Gera link wa.me no padrão exigido pelo Pinguim: só números, com DDI 55.
export function waLink(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (!digits.startsWith('55')) digits = '55' + digits
  return `https://wa.me/${digits}`
}

// Nome de arquivo sistemático usado pelo Leão: nome-do-negocio-123456.zip
export function zipName(businessName) {
  const slug = String(businessName)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const id = String(Date.now()).slice(-6)
  return `${slug}-${id}.zip`
}
