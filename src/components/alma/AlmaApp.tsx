'use client';

import { useEffect, useState } from 'react';
import { useAlmaStore, type Screen } from './store';
import { DashboardView } from './DashboardView';
import { VentaView } from './VentaView';
import { CompraView } from './CompraView';
import { RetiroView } from './RetiroView';
import { ConfigView } from './ConfigView';
import { HistorialView } from './HistorialView';
import {
  LayoutGrid, Plus, ShoppingCart, Wallet, SlidersHorizontal, Clock
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const NAV: { k: Screen; icon: typeof LayoutGrid; l: string }[] = [
  { k: 'dashboard', icon: LayoutGrid, l: 'Inicio' },
  { k: 'venta',     icon: Plus,          l: 'Vender' },
  { k: 'compra',    icon: ShoppingCart,  l: 'Comprar' },
  { k: 'historial', icon: Clock,         l: 'Historial' },
  { k: 'retiro',    icon: Wallet,        l: 'Retirar' },
  { k: 'config',    icon: SlidersHorizontal, l: 'Ajustes' },
];

const DETAIL_SCREENS: Screen[] = ['venta', 'compra', 'retiro', 'config'];

export function AlmaApp() {
  const { screen, setScreen } = useAlmaStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const isDetail = DETAIL_SCREENS.includes(screen);
  const showBottomNav = !isDetail;

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <DashboardView onNav={setScreen} />;
      case 'venta':     return <VentaView onBack={() => setScreen('dashboard')} />;
      case 'compra':    return <CompraView onBack={() => setScreen('dashboard')} />;
      case 'retiro':    return <RetiroView onBack={() => setScreen('dashboard')} />;
      case 'config':    return <ConfigView onBack={() => setScreen('dashboard')} />;
      case 'historial': return <HistorialView />;
      default:          return <DashboardView onNav={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-noir-bg">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[220px] bg-noir-surface border-r border-noir-border flex-col z-50">
        {/* Logo */}
        <div className="px-6 pt-8 pb-2">
          <h1 className="text-gold font-black text-[13px] tracking-[0.25em] uppercase">Alma</h1>
          <p className="text-noir-t3 text-[11px] mt-1 font-light">Aromas & Gestión</p>
        </div>
        <div className="sep-thin mx-5 my-3" />
        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map((t) => {
            const Icon = t.icon;
            const active = screen === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setScreen(t.k)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-luxury border-none ${
                  active
                    ? 'bg-gold-soft text-gold font-medium'
                    : 'text-noir-t2 hover:text-noir-t1 hover:bg-noir-hover'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2 : 1.5} />
                <span>{t.l}</span>
              </button>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="px-5 pb-6">
          <div className="sep-thin mb-4" />
          <p className="text-noir-t3 text-[10px] tracking-wider font-light">v2.0 · Noir Luxe</p>
        </div>
      </aside>

      {/* ── Mobile bottom nav (frosted glass) ── */}
      <AnimatePresence>
        {showBottomNav && (
          <motion.nav
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 lg:hidden frost border-t border-noir-border/50 z-50"
          >
            <div className="max-w-md mx-auto flex items-end justify-around px-2 pb-[env(safe-area-inset-bottom)]">
              {NAV.map((t) => {
                const Icon = t.icon;
                const active = screen === t.k;
                return (
                  <button
                    key={t.k}
                    onClick={() => setScreen(t.k)}
                    className="flex flex-col items-center gap-0.5 py-3 px-2 bg-transparent border-none cursor-pointer transition-luxury min-w-[56px]"
                  >
                    <div className={`p-1 rounded-lg transition-luxury ${active ? 'bg-gold/10' : ''}`}>
                      <Icon
                        size={19}
                        strokeWidth={active ? 2.2 : 1.5}
                        className={active ? 'text-gold' : 'text-noir-t3'}
                      />
                    </div>
                    <span className={`text-[9px] tracking-wider font-medium ${active ? 'text-gold' : 'text-noir-t3'}`}>
                      {t.l}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="lg:ml-[220px] min-h-screen">
        {renderScreen()}
      </main>
    </div>
  );
}