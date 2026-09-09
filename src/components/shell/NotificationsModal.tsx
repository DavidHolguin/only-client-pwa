import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Volume2
} from 'lucide-react'
import { useCustomerAuth } from '../../context/AuthContext'
import { getOrdersByPhone, getOrderByNumber } from '../../api/orders'
import { getPushStatus, requestPushPermissionAndSubscribe } from '../../lib/pushNotifications'
import { getConfirmedLocationLocal } from '../../lib/googleMaps'
import type { CustomerOrder } from '../../types'

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenAddressModal?: () => void
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenAddressModal,
}) => {
  const { customer } = useCustomerAuth()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [pushStatus, setPushStatus] = useState(getPushStatus())
  const [pushLoading, setPushLoading] = useState(false)
  const [pushMessage, setPushMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setLoading(true)

    const fetchRealData = async () => {
      const activeNum = localStorage.getItem('last_active_order_number')
      let foundOrders: CustomerOrder[] = []

      if (activeNum) {
        try {
          const single = await getOrderByNumber(activeNum)
          if (single) foundOrders.push(single)
        } catch (e) {
          console.warn('Error fetching single order for notifs', e)
        }
      }

      if (foundOrders.length === 0 && customer?.phone) {
        try {
          const list = await getOrdersByPhone(customer.phone)
          foundOrders = list
        } catch (e) {
          console.warn('Error fetching orders by phone for notifs', e)
        }
      }

      if (isMounted) {
        setOrders(foundOrders)
        setLoading(false)
      }
    }

    fetchRealData()
    setPushStatus(getPushStatus())

    return () => {
      isMounted = false
    }
  }, [isOpen, customer?.phone])

  const handleEnablePush = async () => {
    setPushLoading(true)
    setPushMessage(null)
    const res = await requestPushPermissionAndSubscribe(customer?.phone)
    setPushLoading(false)
    setPushStatus(getPushStatus())
    if (res.ok) {
      setPushMessage('¡Notificaciones activadas exitosamente! Te notificaremos en tiempo real.')
    } else {
      setPushMessage(res.reason || 'No se pudo activar las notificaciones.')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 px-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight">Notificaciones</h3>
                <p className="text-[11px] text-muted-foreground">Actualizaciones de tu cuenta y pedidos</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Push Notification Banner Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-blue/10 via-brand-darkBlue/5 to-transparent border border-brand-blue/30 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">Alertas Push de Entrega</h4>
                    {pushStatus.isSubscribed && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Activadas ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {pushStatus.isSubscribed
                      ? 'Tu dispositivo recibirá alertas instantáneas cuando el camión salga a reparto.'
                      : 'Activa las alertas para saber al instante cuando tu camión esté en ruta hacia tu casa.'}
                  </p>
                </div>
              </div>

              {!pushStatus.isSubscribed && (
                <button
                  onClick={handleEnablePush}
                  disabled={pushLoading}
                  className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pushLoading ? 'Activando...' : 'Activar Notificaciones Push'}
                </button>
              )}

              {pushMessage && (
                <p className="text-[10px] font-medium text-brand-blue dark:text-brand-lightBlue text-center">
                  {pushMessage}
                </p>
              )}
            </div>

            {/* Real Orders Notifications List */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                Historial de Pedido
              </h4>

              {loading ? (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                  Consultando eventos de tu pedido...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-6 rounded-2xl bg-secondary/40 border border-border/50 text-center space-y-2">
                  <p className="text-xs font-bold text-foreground">No tienes pedidos activos</p>
                  <p className="text-[11px] text-muted-foreground">
                    Cuando realices un pedido o abras tu enlace de WhatsApp, aquí verás las novedades de fabricación y entrega.
                  </p>
                </div>
              ) : (
                orders.map((ord) => {
                  const isConfirmedLocation = Boolean(
                    getConfirmedLocationLocal(ord.numero_pedido) ||
                    (ord.direccion && !ord.direccion.toLowerCase().includes('por confirmar') && ord.direccion.trim().length > 3)
                  )

                  return (
                    <div key={ord.id || ord.numero_pedido} className="space-y-2.5">
                      {/* Estado Actual */}
                      <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border/70 flex items-start gap-3 shadow-xs">
                        <div className="w-8 h-8 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                          {ord.cx_status === 'in_transit' ? (
                            <Truck className="w-4 h-4" />
                          ) : ord.cx_status === 'delivered' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground">
                              Pedido #{ord.numero_pedido}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue">
                              {ord.cx_status === 'in_transit'
                                ? 'En Ruta'
                                : ord.cx_status === 'ready_for_dispatch'
                                ? 'Listo'
                                : ord.cx_status === 'in_production'
                                ? 'En Producción'
                                : ord.cx_status === 'delivered'
                                ? 'Entregado'
                                : 'Confirmado'}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 mt-1 font-medium">
                            {ord.cx_status === 'in_transit'
                              ? 'Tu pedido está en ruta con nuestro camión de entrega.'
                              : ord.cx_status === 'ready_for_dispatch'
                              ? 'Tu mueble está listo y programado para cargue y ruta.'
                              : ord.cx_status === 'in_production'
                              ? 'Tus muebles están en fabricación en nuestra planta de Only Home.'
                              : ord.cx_status === 'delivered'
                              ? 'Tu pedido ha sido entregado exitosamente.'
                              : 'Pedido confirmado y registrado en Only Home.'}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                            Destino: {ord.destino || 'Colombia'}
                          </span>
                        </div>
                      </div>

                      {/* Notificación de Dirección */}
                      <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-xs font-bold text-foreground">
                            {isConfirmedLocation
                              ? 'Dirección de Entrega Confirmada'
                              : 'Ubicación Pendiente por Confirmar'}
                          </h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {isConfirmedLocation
                              ? ord.direccion
                              : 'Por favor confirma el punto exacto de tu domicilio para facilitar la entrega.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
