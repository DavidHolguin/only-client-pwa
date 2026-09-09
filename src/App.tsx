import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider, useCustomerAuth } from './context/AuthContext'
import { TelemetryProvider } from './context/TelemetryContext'
import { HeaderBar } from './components/shell/HeaderBar'
import { FloatingBottomDock } from './components/shell/FloatingBottomDock'
import { NotificationsModal } from './components/shell/NotificationsModal'
import { PwaInstallPrompt } from './components/shell/PwaInstallPrompt'
import { TrackingPage } from './pages/TrackingPage'
import { OrdersPage } from './pages/OrdersPage'
import { ClubPage } from './pages/ClubPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuthPage } from './pages/AuthPage'
import { OrderPortalPage } from './pages/OrderPortalPage'

// ─── App Shell (Abierto, sin login forzado, con Header + BottomNav) ───────────
const AppShell: React.FC = () => {
  const { isLoading } = useCustomerAuth()
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      <HeaderBar onOpenNotifications={() => setNotificationsOpen(true)} />
      <main className="flex-1 w-full pt-2">
        <Routes>
          <Route path="/" element={<TrackingPage />} />
          <Route path="/p/:numero_pedido" element={<TrackingPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/club" element={<ClubPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <FloatingBottomDock />

      {/* Floating PWA Install Prompt */}
      <PwaInstallPrompt />

      {/* Real Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  )
}

// ─── Root Router ─────────────────────────────────────────────────────────────
const RootRouter: React.FC = () => (
  <AppShell />
)

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <AuthProvider>
          <TelemetryProvider>
            <Toaster position="top-center" richColors />
            <RootRouter />
          </TelemetryProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
