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
  LayoutDashboard, PlusCircle, ShoppingCart, Wallet, Settings, Clock
} from 'lucide-react';

const NAV: { k: Screen; icon: typeof LayoutDashboard; l: string }[] = [
  { k: 'dashboard', icon: LayoutDashboard, l: 'Inicio' },
  { k: 'venta', icon: PlusCircle, l: 'Vender' },
  { k: 'compra', icon: ShoppingCart, l: 'Comprar' },
  { k: 'historial', icon: Clock, l: 'Historial' },
  { k: 'retiro', icon: Wallet, l: 'Retirar' },
  { k: 'config', icon: Settings, l: 'Precios' },
];

export function AlmaApp() {
  const { screen, setScreen } = useAlmaStore();
  const [mounted, setMounted] = useState(false);
  const [showNav, setShowNav] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <DashboardView onNav={setScreen} />;
      case 'venta': return <VentaView onBack={() => setScreen('dashboard')} />;
      case 'compra': return <CompraView onBack={() => setScreen('dashboard')} />;
      case 'retiro': return <RetiroView onBack={() => setScreen('dashboard')} />;
      case 'config': return <ConfigView onBack={() => setScreen('dashboard')} />;
      case 'historial': return <HistorialView />;
      default: return <DashboardView onNav={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-alma-bg flex flex-col">
      {/* Main content */}
      <main className="flex-1 pb-20 lg:pb-6">
        {renderScreen()}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-alma-surface border-t border-alma-border z-50">
        <div className="max-w-lg mx-auto flex">
          {NAV.map((t) => {
            const Icon = t.icon;
            const active = screen === t.k;
            return (
              <button
                key={t.k}
                onClick={() => {
                  setScreen(t.k);
                  setShowNav(true);
                }}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 bg-transparent border-none cursor-pointer transition-smooth"
              >
                <Icon
                  size={20}
                  className={active ? 'text-terra-light' : 'text-alma-t3'}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span
                  className={`text-[10px] font-bold tracking-wider ${
                    active ? 'text-terra-light' : 'text-alma-t3'
                  }`}
                >
                  {t.l}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side Nav - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-alma-surface border-r border-alma-border flex-col z-50">
        <div className="p-5 pt-7">
          <h1 className="text-terra-light font-extrabold text-sm tracking-widest uppercase">
            Con Alma Aromas
          </h1>
          <p className="text-alma-t3 text-xs mt-1">Gestión del negocio</p>
        </div>
        <div className="flex-1 px-3 py-2 flex flex-col gap-1">
          {NAV.map((t) => {
            const Icon = t.icon;
            const active = screen === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setScreen(t.k)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-smooth border-none ${
                  active
                    ? 'bg-terra/15 text-terra-light'
                    : 'text-alma-t2 hover:bg-alma-card hover:text-alma-t1'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                {t.l}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Desktop content margin */}
      <div className="hidden lg:block fixed left-56 top-0 bottom-0 right-0 pointer-events-none" />
    </div>
  );
}