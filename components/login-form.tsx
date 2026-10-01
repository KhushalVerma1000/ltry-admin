"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { LoginState } from "@/app/Login/action"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  )
}

export function LoginForm({
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  action: (prevState: LoginState, formData: FormData) => Promise<LoginState>
}) {
  const [state, formAction] = useActionState(action, {})

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to ltry Admin</CardTitle>
          <CardDescription>
            Use your admin email and password to manage pools, rounds, and winners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} noValidate>
            <FieldGroup>
              {state.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {state.error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="username"
                  aria-invalid={!!state.error}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!state.error}
                  required
                />
              </Field>
              <Field>
                <SubmitButton />
                <FieldDescription className="text-center">
                  Forgot your password? Ask another admin to reset it for you —
                  this panel doesn&apos;t send reset emails yet.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
