'use client';

import { useToast, handleApiError } from '@/hooks/use-toast';
import { createPool } from '@/lib/api/pools';

/**
 * Example component showing how to use Sonner toast for error notifications
 * 
 * Usage patterns:
 * 1. Error handling: wrap API calls in try-catch and show errors
 * 2. Success notifications: show success messages after operations
 * 3. Loading states: show loading toast during long operations
 */

export function ToastExample() {
  const { success, error, loading } = useToast();

  const handleCreatePool = async () => {
    const toastId = loading('Creating pool...');

    try {
      // Your API call here
      const response = await createPool({
        name: 'New Pool',
        perSeatPrice: 100,
        totalSeats: 100,
      });

      // Dismiss loading toast and show success
      if (response.success) {
        success('Pool created successfully!');
      }
    } catch (err) {
      // Extract error message and show error toast
      const errorMessage = handleApiError(err);
      error(errorMessage);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Toast Examples</h2>
      
      {/* API Call with Error Handling */}
      <div className="p-3 border rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Click to see error/success toast notifications
        </p>
        <button
          onClick={handleCreatePool}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Create Pool (Demo)
        </button>
      </div>
    </div>
  );
}
