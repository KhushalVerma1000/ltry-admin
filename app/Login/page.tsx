import { LoginForm } from "@/components/login-form"
import { loginAction } from "./action"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-lg font-semibold tracking-tight">ltry</span>
          <span className="ml-1.5 text-lg text-muted-foreground">Admin</span>
        </div>
        <LoginForm action={loginAction} />
      </div>
    </div>
  )
}