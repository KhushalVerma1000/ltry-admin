'use client';

import { useToast, handleApiError } from '@/hooks/use-toast';
import { useState } from 'react';

/**
 * Practical example: Using Sonner toasts in a form submission
 * This shows a real-world pattern for API error handling
 */

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginFormWithToast({ onSuccess }: LoginFormProps) {
  const { success, error, loading } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = loading('Logging in...');

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email');
      const password = formData.get('password');

      // Example API call
      const response = await fetch('/api/v1/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        error(errorData.message || 'Login failed');
        return;
      }

      success('Login successful!');
      onSuccess?.();
    } catch (err) {
      const errorMessage = handleApiError(err);
      error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        disabled={isSubmitting}
        className="w-full px-3 py-2 border rounded-lg disabled:opacity-50"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        disabled={isSubmitting}
        className="w-full px-3 py-2 border rounded-lg disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
