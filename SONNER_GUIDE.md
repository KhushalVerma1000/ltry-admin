# Sonner Toast Notifications Guide

This guide explains how to use Sonner for displaying toast notifications in the ltry-admin application.

## Setup

Sonner has been added to the project and is already configured in the root layout (`app/layout.tsx`).

## Basic Usage

### 1. Import the useToast hook in client components

```typescript
'use client';

import { useToast } from '@/hooks/use-toast';

export function MyComponent() {
  const { success, error, warning, info, loading } = useToast();
  
  return (
    // Your component JSX
  );
}
```

### 2. Show different toast types

```typescript
// Success notification
success('Pool created successfully!');

// Error notification
error('Failed to create pool');

// Warning notification
warning('This action cannot be undone');

// Info notification
info('Pool updated');

// Loading notification (returns a toast ID for later dismissal)
const toastId = loading('Creating pool...');
```

## Error Handling Pattern

### With API calls

```typescript
'use client';

import { useToast, handleApiError } from '@/hooks/use-toast';
import { createPool } from '@/lib/api/pools';

export function CreatePoolForm() {
  const { success, error, loading } = useToast();

  const handleSubmit = async (formData: FormData) => {
    const toastId = loading('Creating pool...');

    try {
      const response = await createPool({
        name: formData.get('name'),
        perSeatPrice: Number(formData.get('price')),
        totalSeats: Number(formData.get('seats')),
      });

      if (response.success) {
        success('Pool created successfully!');
      } else {
        error(response.message || 'Failed to create pool');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      error(errorMessage);
    }
  };

  return (
    // Form JSX
  );
}
```

## Error Display Component

For server components that need to display errors, use the `ErrorDisplay` component:

```typescript
// In server component
import { ErrorDisplay } from '@/components/error-display';

export default async function MyPage() {
  let error = '';
  try {
    // Fetch data
  } catch (err) {
    error = 'Failed to load data';
  }

  return (
    <>
      <ErrorDisplay error={error} />
      {/* Rest of component */}
    </>
  );
}
```

## Available Methods

### useToast()

Returns an object with the following methods:

- **`success(message: string)`** - Shows a success toast with a checkmark icon
  - Color: Green
  - Auto-dismisses after 3 seconds

- **`error(message: string)`** - Shows an error toast with an X icon
  - Color: Red
  - Auto-dismisses after 4 seconds (longer than success for readability)

- **`warning(message: string)`** - Shows a warning toast with an alert icon
  - Color: Yellow
  - Auto-dismisses after 3 seconds

- **`info(message: string)`** - Shows an info toast with an info icon
  - Color: Blue
  - Auto-dismisses after 3 seconds

- **`loading(message: string)`** - Shows a loading toast with a spinner
  - Returns: Toast ID for later dismissal
  - Useful for async operations
  - Manual dismissal recommended

### handleApiError(error)

Helper function that extracts error messages from different error types:

```typescript
handleApiError(error); // Returns a string message
```

Handles:
- `Error` objects (returns `.message`)
- String errors
- Unknown errors (returns generic message)

## Common Patterns

### 1. Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const toastId = loading('Submitting form...');

  try {
    const response = await submitForm(formData);
    
    if (response.success) {
      success('Form submitted successfully!');
    } else {
      error(response.message);
    }
  } catch (err) {
    error(handleApiError(err));
  }
};
```

### 2. Delete Action

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  
  const toastId = loading('Deleting...');

  try {
    await deleteItem(id);
    success('Item deleted successfully!');
  } catch (err) {
    error(`Failed to delete: ${handleApiError(err)}`);
  }
};
```

### 3. Async Data Fetch

```typescript
useEffect(() => {
  const fetchData = async () => {
    const toastId = loading('Loading data...');

    try {
      const data = await fetchPoolData();
      success('Data loaded!');
    } catch (err) {
      error('Failed to load data');
    }
  };

  fetchData();
}, []);
```

## Styling

Sonner toasts automatically inherit your app's theme. You can customize appearance in Sonner configuration if needed.

## Best Practices

1. ✅ Use specific error messages that help users understand what went wrong
2. ✅ Show loading toasts for operations that take > 1 second
3. ✅ Dismiss loading toasts after showing success/error
4. ✅ Use `handleApiError()` to standardize error extraction
5. ✅ Avoid showing multiple toasts at once (Sonner will stack them)
6. ✅ Use error boundaries for component-level errors

## Common Mistakes to Avoid

1. ❌ Don't forget to use `'use client'` in components using useToast
2. ❌ Don't show generic "Error" messages - be specific
3. ❌ Don't leave loading toasts without dismissing them
4. ❌ Don't use toasts for validations - use form validation instead
5. ❌ Don't show toasts in server components - use ErrorDisplay instead
