'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { Check, ArrowLeft, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export function RetiroView({ onBack }: { onBack: () => void }) {
  const { refreshDashboard, dashboardRefresh } = useAlmaStore();
  const [quien, setQuien] = useState<string | null>(null);
  const [tipo, setTipo] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ moTotal: 0, gananciaRet: 0, totalRetiros: 0 });
  const montoNum = parseInt(monto) || 0;

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const d = await res.json();
      setStats({ moTotal: d.moTotal, gananciaRet: d.gananciaRet, totalRetiros: d.totalRetiros });
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats, dashboardRefresh]);

  const disponible = stats.moTotal + stats.gananciaRet - stats.totalRetiros;

  const handleSubmit = async () => {
    if (!monto || !quien || !tipo) return;
    setSubmitting(true);
    try {
      await fetch('/api/retiros', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quien, tipo, monto: montoNum }),
      });
      refreshDashboard();
      setDone(true);
    } catch { /* empty */ }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-5 pt-10 pb-24 lg:px-8 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
          <Wallet size={28} strokeWidth={2} className="text-gold" />
        </motion.div>
        <h2 className="text-xl font-black text-noir-t1 mb-1">Retiro registrado</h2>
        <p className="text-noir-t2 text-sm font-light mb-3">{quien}</p>
        <p className="text-4xl font-black text-gold-gradient tracking-[-0.03em]">{formatARS(montoNum)}</p>
        <div className="mt-8 w-full">
          <Button onClick={() => { setDone(false); setMonto(''); }} className="w-full bg-gold hover:bg-gold-dim text-noir-bg font-semibold rounded-xl h-12 text-sm">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-28 lg:px-8 lg:pt-12">
      <button onClick={onBack} className="text-noir-t3 text-[12px] mb-6 flex items-center gap-1.5 hover:text-noir-t2 transition-luxury font-light">
        <ArrowLeft size={14} /> Volver
      </button>
      <h2 className="text-xl font-black text-noir-t1 mb-1">Registrar retiro</h2>
      <p className="text-noir-t3 text-[12px] font-light mb-6">Registrá un retiro de fondos</p>

      {/* Disponible */}
      <div className="card-glass rounded-2xl p-5 mb-6">
        <p className="text-noir-t3 text-[10px] tracking-[0.2em] font-medium uppercase mb-3">Disponible</p>
        {[
          { l: 'Mano de obra', v: formatARS(stats.moTotal), c: 'text-noir-ice' },
          { l: 'Ganancia (45%)', v: formatARS(stats.gananciaRet), c: 'text-noir-sage' },
        ].map(r => (
          <div key={r.l} className="flex justify-between text-[12px] mb-2">
            <span className="text-noir-t2 font-light">{r.l}</span>
            <span className={`font-medium ${r.c}`}>{r.v}</span>
          </div>
        ))}
        <div className="sep-thin my-3" />
        <div className="flex justify-between">
          <span className="text-[13px] font-medium text-noir-t1">Total</span>
          <span className="text-lg font-black text-gold">{formatARS(disponible)}</span>
        </div>
      </div>

      {/* Quién */}
      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-2">Quién retira</p>
      <div className="flex gap-2 mb-6">
        {['Sebastián', 'Paola', 'Ambos'].map(q => (
          <button key={q} onClick={() => setQuien(q)}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium border cursor-pointer transition-luxury ${
              quien === q ? 'bg-gold/10 border-gold/30 text-gold' : 'border-noir-border text-noir-t2 hover:border-noir-t3'
            }`}>{q}</button>
        ))}
      </div>

      {/* Tipo */}
      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-2">Tipo de retiro</p>
      <div className="space-y-1.5 mb-6">
        {[
          { k: 'mo', l: 'Mano de obra', d: formatARS(stats.moTotal), c: 'text-noir-ice' },
          { k: 'ganancia', l: 'Ganancia', d: formatARS(stats.gananciaRet), c: 'text-noir-sage' },
          { k: 'ambos', l: 'Ambos', d: formatARS(disponible), c: 'text-gold' },
        ].map(t => (
          <button key={t.k} onClick={() => setTipo(t.k)}
            className={`w-full p-3.5 rounded-xl text-left cursor-pointer border transition-luxury ${
              tipo === t.k ? 'bg-gold-soft border-gold/20' : 'border-noir-border hover:border-noir-t3'
            }`}>
            <p className={`text-[13px] font-medium ${tipo === t.k ? t.c : 'text-noir-t1'}`}>{t.l}</p>
            <p className="text-[11px] text-noir-t3 font-light mt-0.5">{t.d}</p>
          </button>
        ))}
      </div>

      {/* Monto */}
      <p className="text-noir-t3 text-[10px] tracking-[0.25em] font-medium uppercase mb-2">Monto</p>
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-noir-t3">$</span>
        <Input type="number" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)}
          className="pl-9 bg-noir-surface border-noir-border text-gold placeholder:text-noir-t3/60 rounded-2xl h-16 text-2xl font-black" />
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {[50000, 100000, 150000, 200000].map(n => (
          <Badge key={n} variant="secondary"
            className="bg-noir-surface text-noir-t2 hover:bg-gold/10 hover:text-gold cursor-pointer transition-luxury border-none px-3 py-1 text-[11px] font-medium"
            onClick={() => setMonto(String(n))}>{formatARS(n)}</Badge>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={!monto || !quien || !tipo || submitting}
        className="w-full bg-gold hover:bg-gold-dim disabled:bg-noir-border disabled:text-noir-t3 text-noir-bg font-semibold rounded-xl h-12 text-sm">
        {submitting ? 'Registrando...' : 'Confirmar retiro'}
      </Button>
    </div>
  );
}