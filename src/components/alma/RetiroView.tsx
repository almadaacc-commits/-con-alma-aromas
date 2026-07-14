'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAlmaStore } from './store';
import { formatARS } from './lib';
import { Check, ChevronLeft, Wallet } from 'lucide-react';
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
  const disponibleMO = stats.moTotal;
  const disponibleGan = stats.gananciaRet;

  const handleSubmit = async () => {
    if (!monto || !quien || !tipo) return;
    setSubmitting(true);
    try {
      await fetch('/api/retiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quien, tipo, monto: montoNum }),
      });
      refreshDashboard();
      setDone(true);
    } catch { /* empty */ }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 flex flex-col items-center justify-center min-h-[80vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-green-400/15 border border-green-400/30 flex items-center justify-center mb-6"
          style={{ boxShadow: '0 0 40px rgba(74, 222, 128, 0.2)' }}
        >
          <Wallet size={32} className="text-green-400" />
        </motion.div>
        <h2 className="text-2xl font-extrabold text-alma-t1 mb-1">Retiro registrado</h2>
        <p className="text-alma-t2 text-sm mb-4">{quien}</p>
        <p className="text-4xl font-black text-green-400 tracking-tighter">{formatARS(montoNum)}</p>
        <div className="mt-8 w-full">
          <Button onClick={() => { setDone(false); setMonto(''); }} className="w-full bg-terra hover:bg-terra-light text-white font-bold rounded-xl h-12">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 lg:ml-56 pb-24">
      <button onClick={onBack} className="text-alma-t3 text-sm mb-4 flex items-center gap-1 hover:text-alma-t2 transition-smooth">
        <ChevronLeft size={16} /> Volver
      </button>
      <h2 className="text-xl font-extrabold text-alma-t1 mb-5">Registrar retiro</h2>

      {/* Disponible */}
      <Card className="bg-alma-card border-alma-border mb-5">
        <CardContent className="p-4">
          <p className="text-alma-t3 text-[10px] tracking-[0.15em] font-bold mb-3">DISPONIBLE</p>
          {[
            { l: 'Por mano de obra', v: formatARS(disponibleMO), c: 'text-blue-400' },
            { l: 'Por ganancia (45%)', v: formatARS(disponibleGan), c: 'text-green-400' },
          ].map(r => (
            <div key={r.l} className="flex justify-between text-sm mb-2">
              <span className="text-alma-t2">{r.l}</span>
              <span className={`font-bold ${r.c}`}>{r.v}</span>
            </div>
          ))}
          <div className="h-px bg-alma-border my-2" />
          <div className="flex justify-between">
            <span className="text-sm font-bold text-alma-t1">Total disponible</span>
            <span className="text-lg font-black text-terra-light">{formatARS(disponible)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ¿Quién? */}
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-2">¿QUIÉN RETIRA?</p>
      <div className="flex gap-2 mb-5">
        {['Sebastián', 'Paola', 'Ambos'].map(q => (
          <button
            key={q}
            onClick={() => setQuien(q)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-smooth ${
              quien === q ? 'bg-terra border-terra text-white' : 'bg-transparent border-alma-border text-alma-t2'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Tipo */}
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-2">TIPO</p>
      <div className="space-y-2 mb-5">
        {[
          { k: 'mo', l: 'Mano de obra', d: `Disponible ${formatARS(disponibleMO)}`, c: 'text-blue-400' },
          { k: 'ganancia', l: 'Ganancia empresa', d: `Disponible ${formatARS(disponibleGan)}`, c: 'text-green-400' },
          { k: 'ambos', l: 'Ambos', d: `Total ${formatARS(disponible)}`, c: 'text-terra-light' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTipo(t.k)}
            className={`w-full p-3.5 rounded-xl text-left cursor-pointer border transition-smooth ${
              tipo === t.k ? 'bg-alma-card border-terra' : 'bg-transparent border-alma-border'
            }`}
          >
            <p className={`text-sm font-bold ${tipo === t.k ? t.c : 'text-alma-t1'}`}>{t.l}</p>
            <p className="text-[11px] text-alma-t3 mt-0.5">{t.d}</p>
          </button>
        ))}
      </div>

      {/* Monto */}
      <p className="text-alma-t3 text-[10px] tracking-[0.2em] font-bold mb-2">MONTO</p>
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-alma-t3">$</span>
        <Input
          type="number"
          placeholder="0"
          value={monto}
          onChange={e => setMonto(e.target.value)}
          className="pl-9 bg-alma-surface border-alma-border text-terra-light placeholder:text-alma-t3 rounded-2xl h-16 text-3xl font-black"
        />
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {[50000, 100000, 150000, 200000].map(n => (
          <Badge
            key={n}
            variant="secondary"
            className="bg-alma-surface text-alma-t2 hover:bg-terra hover:text-white cursor-pointer transition-smooth border-none px-3 py-1.5 text-xs"
            onClick={() => setMonto(String(n))}
          >
            {formatARS(n)}
          </Badge>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!monto || !quien || !tipo || submitting}
        className="w-full bg-terra hover:bg-terra-light disabled:bg-alma-border disabled:text-alma-t3 text-white font-bold rounded-xl h-12"
      >
        {submitting ? 'Registrando...' : 'Confirmar retiro'}
      </Button>
    </div>
  );
}