'use client';

import { useEffect, useRef } from 'react';
import { AlmaApp } from '@/components/alma/AlmaApp';

export default function Page() {
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      fetch('/api/seed', { method: 'POST' }).catch(() => {});
    }
  }, []);

  return <AlmaApp />;
}