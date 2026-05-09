'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ErrorDisplay({ error }: { error: string }) {
  const { error: showError } = useToast();

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  if (!error) return null;

  return null; // Toast is shown instead
}
