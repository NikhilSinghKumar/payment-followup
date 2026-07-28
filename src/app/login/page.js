import Image from "next/image";
import LoginForm from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Login Card */}
      <div
        className="
          absolute
          right-[270px]
          top-1/2
          -translate-y-1/2
          z-20
        "
      >
        <LoginForm />
      </div>
    </div>
  );
}
