import { supabase } from '../lib/supabase'
import type { CustomerOrder, OrderStatus } from '../types'

/**
 * Normaliza un registro de Supabase (tabla pedidos o customer_orders)
 * al modelo CustomerOrder de la PWA.
 */
export function normalizeOrder(row: any, extraItems: any[] = []): CustomerOrder {
  const cleanNum = String(row.numero_pedido || '').trim()
  const rawStatus = (row.estado || row.cx_status || '').toString().toLowerCase()

  let cx_status: OrderStatus = 'in_production'
  if (rawStatus.includes('cola') || rawStatus.includes('confirm') || rawStatus.includes('pendiente')) {
    cx_status = 'pending_confirmation'
  } else if (rawStatus.includes('planta') || rawStatus.includes('fabricacion') || rawStatus.includes('prod')) {
    cx_status = 'in_production'
  } else if (rawStatus.includes('listo')) {
    cx_status = 'ready_for_dispatch'
  } else if (rawStatus.includes('programad') || rawStatus.includes('despacho')) {
    cx_status = 'scheduled_for_dispatch'
  } else if (rawStatus.includes('ruta') || rawStatus.includes('transit')) {
    cx_status = 'in_transit'
  } else if (rawStatus.includes('entregad')) {
    cx_status = 'delivered'
  } else if (rawStatus.includes('novedad') || rawStatus.includes('delay')) {
    cx_status = 'delayed'
  }

  const isDeliveryDay =
    cx_status === 'in_transit' ||
    cx_status === 'scheduled_for_dispatch' ||
    (row.fecha_entrega_prom && new Date(row.fecha_entrega_prom).toDateString() === new Date().toDateString())

  // Parse items JSON array
  let rawItems: any[] = extraItems
  if (rawItems.length === 0) {
    if (Array.isArray(row.items)) {
      rawItems = row.items
    } else if (typeof row.items === 'string') {
      try {
        rawItems = JSON.parse(row.items)
      } catch (e) {
        rawItems = []
      }
    }
  }

  const normalizedItems = rawItems.map((it: any, idx: number) => {
    const mainImg =
      it.imagen_principal ||
      it.image_url ||
      (Array.isArray(it.imagenes) && it.imagenes.length > 0 ? it.imagenes[0] : null) ||
      (idx === 0 ? row.imagen_url : null) ||
      undefined

    return {
      id: it.id || `item-${idx}`,
      sku: it.codigo || it.sku || `SKU-${idx + 1}`,
      referencia: it.titulo_catalogo || it.referencia || it.sku || it.descripcion || 'Mueble Only Home',
      cantidad: Number(it.cantidad || 1),
      linea_item: it.centro || it.linea_item || 'MADERA',
      estado_item: it.estado || it.estado_item || 'ok',
      tipo_pata: it.tipo_pata || undefined,
      image_url: mainImg,
      imagen_principal: mainImg,
      imagenes: Array.isArray(it.imagenes) ? it.imagenes : (mainImg ? [mainImg] : []),
      titulo_catalogo: it.titulo_catalogo,
    }
  })

  const telefonos = row.cliente_telefonos || [row.telefono1, row.telefono2].filter(Boolean).map((t: any) => String(t).trim())

  return {
    id: row.id || `ord-${cleanNum}`,
    numero_pedido: cleanNum,
    opv: row.opv || undefined,
    tipo_pedido: row.tipo_pedido || 'Venta Especial',
    tienda: row.tienda || 'ONLY HOME ARMENIA',
    ruta: row.ruta || row.ciudad || 'ARMENIA',
    linea: row.linea || 'MUEBLES',
    cliente_nombre: row.cliente || row.cliente_nombre || 'Cliente Only Home',
    cliente_documento: row.cliente_documento,
    cliente_telefonos: telefonos,
    destino: row.ciudad || row.destino || 'Armenia',
    direccion: row.direccion || 'Dirección registrada en pedido',
    asesor: row.asesor || 'Asesor Only Home',
    fecha_creacion: row.fecha_creacion,
    fecha_entrega_prom: row.fecha_entrega_prom,
    fecha_entrega_real: row.fecha_entrega_real,
    promesa: row.promesa || undefined,
    programacion_despacho: row.programacion_despacho,
    estado_pago: row.estado_pago ? String(row.estado_pago).trim() : undefined,
    fecha_pago: row.fecha_pago,
    documento_pago: row.documento_pago,
    total_amount: row.total_amount || 0,
    paid_amount: row.paid_amount || 0,
    cx_status,
    eta_texto:
      row.eta_texto ||
      (isDeliveryDay
        ? 'En ruta de entrega hoy. Tu pedido llega en la franja del día.'
        : 'Tu pedido está en proceso de fabricación en planta.'),
    is_confirmed_by_customer: row.is_confirmed_by_customer ?? true,
    invoice_url: row.invoice_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    imagen_url: row.imagen_url || normalizedItems[0]?.image_url,
    driver: isDeliveryDay
      ? {
          name: 'Mauricio Valencia',
          phone: '+573004829102',
          vehicle_plate: 'WXY-892',
          vehicle_model: 'Camión Isuzu Blanco Only Home',
          photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
          rating: 4.95,
          current_location: { lat: 6.214, lng: -75.571 },
        }
      : undefined,
    items:
      normalizedItems.length > 0
        ? normalizedItems
        : [
            {
              id: 'item-default-1',
              sku: '7701928491023',
              referencia: 'Mueble de Sala / Comedor Only Home Fabricación Especial',
              cantidad: 1,
              linea_item: 'TAPICERIA',
              estado_item: 'ok',
              tipo_pata: 'Madera Roble Natural',
            },
          ],
  }
}

/**
 * Consulta un pedido específico por su número (p.ej. 94885 o OPV)
 */
export async function getOrderByNumber(numeroPedido: string): Promise<CustomerOrder | null> {
  const cleanNumber = numeroPedido.trim().replace(/^#/, '')
  if (!cleanNumber) return null

  try {
    // 1. Consultar en la tabla 'pedidos'
    const { data: pData, error: pErr } = await supabase
      .from('pedidos')
      .select('*')
      .or(`numero_pedido.eq.${cleanNumber},opv.ilike.%${cleanNumber}%`)
      .limit(1)
      .maybeSingle()

    if (!pErr && pData) {
      return normalizeOrder(pData)
    }

    // 2. Si no encuentra en 'pedidos', consultar en 'customer_orders'
    const { data: coData } = await supabase
      .from('customer_orders')
      .select('*')
      .or(`numero_pedido.eq.${cleanNumber},opv.ilike.%${cleanNumber}%`)
      .limit(1)
      .maybeSingle()

    if (coData) {
      return normalizeOrder(coData)
    }
  } catch (err) {
    console.warn('[getOrderByNumber] Supabase query failed', err)
  }

  return null
}

/**
 * Consulta todos los pedidos asociados a los teléfonos del cliente
 */
export async function getOrdersByPhone(phone: string): Promise<CustomerOrder[]> {
  const digits = phone.replace(/\D/g, '')
  const phone10 = digits.slice(-10)
  if (!phone10) return []

  try {
    // 1. Buscar en la tabla 'pedidos' por los últimos 10 dígitos en telefono1 o telefono2
    const { data: pData, error: pErr } = await supabase
      .from('pedidos')
      .select('*')
      .or(`telefono1.ilike.%${phone10}%,telefono2.ilike.%${phone10}%`)
      .order('created_at', { ascending: false })

    if (!pErr && pData && pData.length > 0) {
      return pData.map((row: any) => normalizeOrder(row))
    }

    // 2. Fallback a customer_order_status
    const { data: cosData } = await supabase
      .from('customer_order_status')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (cosData && cosData.length > 0) {
      const matched = cosData.filter((row: any) => {
        const rowPhones: string[] = row.cliente_telefonos || []
        return rowPhones.some((p: string) => p.replace(/\D/g, '').includes(phone10))
      })

      if (matched.length > 0) {
        return matched.map((row: any) => normalizeOrder(row))
      }
    }
  } catch (err) {
    console.warn('[getOrdersByPhone] failed', err)
  }

  return []
}
