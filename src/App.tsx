import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider, useCustomerAuth } from './context/AuthContext'
import { TelemetryProvider } from './context/TelemetryContext'
import { HeaderBar } from './components/shell/HeaderBar'
import { FloatingBottomDock } from './components/shell/FloatingBottomDock'
import { TrackingPage } from './pages/TrackingPage'
import { OrdersPage } from './pages/OrdersPage'
import { ClubPage } from './pages/ClubPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuthPage } from './pages/AuthPage'

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useCustomerAuth()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center animate-pulse">
          <span className="font-extrabold text-brand-blue text-lg">OH</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground animate-pulse">Cargando Only Home...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      {/* Top Header */}
      <HeaderBar onOpenNotifications={() => setNotificationsOpen(true)} />

      {/* Main Page Body */}
      <main className="flex-1 w-full pt-2">
        <Routes>
          {/* Default active order route */}
          <Route path="/" element={<TrackingPage />} />
          
          {/* Deep link direct order routes for WhatsApp Meta template */}
          <Route path="/p/:numero_pedido" element={<TrackingPage />} />
          <Route path="/pedidos/:numero_pedido" element={<TrackingPage />} />

          {/* Orders History and invoices */}
          <Route path="/pedidos" element={<OrdersPage />} />

          {/* Gamification Club */}
          <Route path="/club" element={<ClubPage />} />

          {/* Customer Profile & Address Book */}
          <Route path="/perfil" element={<ProfilePage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Floating Bottom Dock */}
      <FloatingBottomDock />

      {/* Notifications Drawer Modal */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-5 space-y-4 shadow-2xl max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Notificaciones de tu Pedido</h3>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-xs text-brand-blue dark:text-brand-lightBlue font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-start gap-2.5">
                <span className="text-base">🚚</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">¡Tu pedido está en ruta hoy!</h4>
                  <p className="text-[11px] text-muted-foreground">El camión llegará entre 2:00 PM y 4:30 PM.</p>
                  <span className="text-[9px] text-muted-foreground font-mono mt-1 block">Hace 15 min</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20 flex items-start gap-2.5">
                <span className="text-base">✨</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Ganaste 100 Puntos Only Club</h4>
                  <p className="text-[11px] text-muted-foreground">Bono de bienvenida acreditado a tu cuenta.</p>
                  <span className="text-[9px] text-muted-foreground font-mono mt-1 block">Ayer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <TelemetryProvider>
            <Toaster position="top-center" richColors />
            <AppContent />
          </TelemetryProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
