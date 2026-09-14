const PIX_CODE = {
  PAYLOAD_FORMAT_INDICATOR: '00',
  POINT_OF_INITIATION_METHOD: '01',
  MERCHANT_ACCOUNT_INFORMATION: '26',
  MERCHANT_ACCOUNT_INFO_GUI: '00',
  MERCHANT_ACCOUNT_INFO_KEY: '01',
  MERCHANT_CATEGORY_CODE: '52',
  TRANSACTION_CURRENCY: '53',
  TRANSACTION_AMOUNT: '54',
  COUNTRY_CODE: '58',
  MERCHANT_NAME: '59',
  MERCHANT_CITY: '60',
  ADDITIONAL_DATA_FIELD: '62',
  ADDITIONAL_DATA_TXID: '05',
  CRC16: '63',
}

const BANK_PAYMENT_GUI = 'BR.GOV.BCB.PIX'

function crc16ccittFalse(data: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function serialize(id: string, value: string): string {
  const size = value.length.toString().padStart(2, '0')
  return id + size + value
}

export interface PixConfig {
  key: string
  recipientName: string
  recipientCity: string
}

export interface PixPayload {
  raw: string
  qrValue: string
  amount: number
}

function sanitizePixKey(key: string): string {
  let clean = key.trim()
  clean = clean.replace(/[\(\)\/]/g, '')
  const looksLikeCpfCnpj = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(clean) ||
    /^\d{11}$/.test(clean) ||
    /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(clean) ||
    /^\d{14}$/.test(clean)
  const looksLikePhone = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(clean) ||
    /^\+?\d{10,15}$/.test(clean.replace(/\D/g, ''))
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
  if (looksLikeCpfCnpj || looksLikePhone) {
    clean = clean.replace(/\D/g, '')
  } else if (looksLikeEmail) {
    clean = clean.toLowerCase().trim()
  }
  if (clean.length > 77) {
    clean = clean.slice(0, 77)
  }
  return clean
}

function sanitizeName(name: string, maxLen: number): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

export function generatePixPayload(
  config: PixConfig,
  amount: number,
  orderNumber: string
): PixPayload {
  if (!config.key || !config.key.trim()) {
    throw new Error('Chave PIX não configurada.')
  }
  if (!config.recipientName || !config.recipientName.trim()) {
    throw new Error('Nome do recebedor PIX não configurado.')
  }
  if (!config.recipientCity || !config.recipientCity.trim()) {
    throw new Error('Cidade do recebedor PIX não configurada.')
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Valor do PIX inválido.')
  }
  if (!orderNumber || !orderNumber.trim()) {
    throw new Error('Número do pedido inválido.')
  }

  let amountStr = Number(amount.toFixed(2)).toFixed(2).replace(',', '.')

  let txid = orderNumber
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
  if (txid.length > 25) {
    txid = txid.slice(0, 25)
  }
  if (txid.length < 1) {
    txid = '0'
  }

  const sanitizedKey = sanitizePixKey(config.key)
  const sanitizedName = sanitizeName(config.recipientName, 25)
  const sanitizedCity = sanitizeName(config.recipientCity, 15)

  const merchantGui = serialize(PIX_CODE.MERCHANT_ACCOUNT_INFO_GUI, BANK_PAYMENT_GUI)
  const merchantKey = serialize(PIX_CODE.MERCHANT_ACCOUNT_INFO_KEY, sanitizedKey)
  const merchantAccountInfo = serialize(PIX_CODE.MERCHANT_ACCOUNT_INFORMATION, merchantGui + merchantKey)

  const categoryCode = serialize(PIX_CODE.MERCHANT_CATEGORY_CODE, '0000')
  const currencyCode = serialize(PIX_CODE.TRANSACTION_CURRENCY, '986')
  const txAmount = serialize(PIX_CODE.TRANSACTION_AMOUNT, amountStr)
  const countryCode = serialize(PIX_CODE.COUNTRY_CODE, 'BR')
  const merchantName = serialize(PIX_CODE.MERCHANT_NAME, sanitizedName)
  const merchantCity = serialize(PIX_CODE.MERCHANT_CITY, sanitizedCity)

  const additionalTxid = serialize(PIX_CODE.ADDITIONAL_DATA_TXID, txid)
  const additionalData = serialize(PIX_CODE.ADDITIONAL_DATA_FIELD, additionalTxid)

  const payloadFormat = serialize(PIX_CODE.PAYLOAD_FORMAT_INDICATOR, '01')
  const initiationMethod = serialize(PIX_CODE.POINT_OF_INITIATION_METHOD, '11')

  const partial =
    payloadFormat +
    initiationMethod +
    merchantAccountInfo +
    categoryCode +
    currencyCode +
    txAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalData

  const crcId = PIX_CODE.CRC16 + '04'
  const crc = crc16ccittFalse(partial + crcId)
  const raw = partial + crcId + crc

  console.log('PIX payload gerado:', { raw, amount, keyLen: config.key.length, nameLen: config.recipientName.length, cityLen: config.recipientCity.length, txid })

  return {
    raw,
    qrValue: raw,
    amount,
  }
}
