'use client';

import { Suspense } from 'react';
import AIDiscovery from '@/views/AIDiscovery';

export default function AIDiscoveryPage() {
  return (
    <Suspense fallback={null}>
      <AIDiscovery />
    </Suspense>
  );
}
