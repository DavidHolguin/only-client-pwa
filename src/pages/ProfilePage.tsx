import React, { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Calendar,
  ShieldCheck,
  LogOut,
  Bell,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerAuth } from '../context/AuthContext'
import type { CustomerAddress } from '../types'
import { AddressManagerModal } from '../components/profile/AddressManagerModal'

export const ProfilePage: React.FC = () => {
  const { customer, logout, updateProfile } = useCustomerAuth()
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [birthday, setBirthday] = useState(customer?.birthday || '1992-11-14')

  if (!customer) return null

  const handleSaveAddress = (newAddr: CustomerAddress) => {
    const nextAddresses = [...customer.addresses, newAddr]
    updateProfile({ addresses: nextAddresses })
  }

  const handleSaveBirthday = () => {
    updateProfile({ birthday })
    toast.success('🎂 ¡Fecha de cumpleaños guardada! Te enviaremos un bono especial en tu día.')
  }

  const handleRequestPushNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('🔔 ¡Notificaciones push activadas exitosamente!')
      } else {
        toast.info('Permiso de notificaciones denegado en tu navegador.')
      }
    } else {
      toast.info('Este navegador no soporta Web Push API.')
    }
  }

  return (
    <div className="space-y-4 px-4 pb-36">
      {/* Profile Header Card */}
      <div className="p-5 rounded-3xl glass-card bg-card border border-border/80 shadow-md flex items-center gap-4">
        <div className="relative">
          <img
            src={customer.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
            alt={customer.full_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-blue"
          />
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-gold text-slate-950 font-bold text-[9px] uppercase font-mono">
            {customer.tier}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-extrabold text-foreground truncate">{customer.full_name}</h2>
            <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">+{customer.phone}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-gold font-bold font-mono">
              <Flame className="w-3.5 h-3.5 fill-gold text-gold" />
              <span>{customer.lead_temperature}° VIP Score</span>
            </span>
          </div>
        </div>
      </div>

      {/* Personal Info Form */}
      <div className="p-4 rounded-3xl glass-card bg-card border border-border/80 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Datos Personales
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="text-muted-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-brand-blue" />
              <span>Documento / Cédula:</span>
            </span>
            <strong className="font-mono text-foreground">{customer.document || '1020485932'}</strong>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-brand-blue" />
              <span>Correo Electrónico:</span>
            </span>
            <strong className="text-foreground truncate max-w-[160px]">{customer.email || 'camilo@gmail.com'}</strong>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/60">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              <span>Cumpleaños (Regalo VIP):</span>
            </span>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              onBlur={handleSaveBirthday}
              className="px-2 py-1 rounded-lg bg-background border border-border text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
        </div>
      </div>

      {/* Saved Addresses Book */}
      <div className="p-4 rounded-3xl glass-card bg-card border border-border/80 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-blue" />
            <span>Mis Direcciones Guardadas</span>
          </h3>
          <button
            onClick={() => setIsAddressModalOpen(true)}
            className="text-xs text-brand-blue dark:text-brand-lightBlue font-bold flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        <div className="space-y-2">
          {customer.addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3 rounded-2xl bg-secondary/40 border border-border/60 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground">{addr.alias}</h4>
                  {addr.is_default && (
                    <span className="px-1.5 py-0.2 rounded bg-brand-blue/20 text-brand-blue text-[9px] font-bold">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{addr.formatted_address}</p>
                {addr.delivery_notes && (
                  <p className="text-[10px] text-muted-foreground/80 italic">Nota: {addr.delivery_notes}</p>
                )}
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences & Notifications */}
      <div className="p-4 rounded-3xl glass-card bg-card border border-border/80 space-y-2 shadow-sm">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
          Preferencias de Notificación
        </h3>

        <button
          onClick={handleRequestPushNotification}
          className="w-full p-3 rounded-2xl bg-secondary/40 hover:bg-secondary/70 border border-border flex items-center justify-between text-xs transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-brand-blue" />
            <div className="text-left">
              <p className="font-bold text-foreground">Alertas Push de Entrega</p>
              <p className="text-[11px] text-muted-foreground">Recibe alertas cuando el camión esté cerca</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="w-full py-3 px-4 rounded-2xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold border border-destructive/20 flex items-center justify-center gap-2 transition-colors active:scale-98"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>

      {/* Address Manager Modal */}
      <AddressManagerModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={customer.addresses}
        onSaveAddress={handleSaveAddress}
      />
    </div>
  )
}
