import LoginForm from "@/app/components/auth/LoginForm";

export const metadata = {
  title: "Login | PAFEX Express Logistics",
  description: "Sign in to PAFEX Logistics Billing & Invoicing Portal",
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-slate-100/60 to-blue-50/80 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 overflow-hidden select-none">
      {/* Background Decorative Ambient Circles (Encapsulated without causing overflow) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-600/10" />
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md my-auto">
        <LoginForm />
      </div>

      {/* Bottom Copyright Note */}
      <footer className="relative z-10 mt-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        © {new Date().getFullYear()} Prakash Airfreight India Pvt Ltd (Pafex)
      </footer>
    </main>
  );
}
