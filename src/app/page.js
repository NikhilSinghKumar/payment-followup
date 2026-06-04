"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleNavigate = () => {
    setLoading(true);

    setTimeout(() => {
      router.push("/clients");
    }, 200);
  };

  return (
    <>
      {/* Main Home Screen */}
      <div className="flex flex-col flex-1 bg-zinc-50 items-center justify-center min-h-screen">
        <button
          className="relative group cursor-pointer border-2 border-zinc-200/80 rounded-2xl px-6 py-4 overflow-hidden"
          onClick={handleNavigate}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>

          <span className="relative text-3xl font-extrabold tracking-widest bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_200%] bg-left bg-clip-text text-transparent transition-all duration-300 group-hover:bg-right">
            PAYFOLO
          </span>

          {/* underline */}
          <span className="absolute left-1/2 bottom-0 h-[3px] w-0 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 transition-all duration-500 group-hover:w-full group-hover:left-0"></span>
        </button>
      </div>

      {/* Loading Welcome Screen */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white items-center justify-center overflow-hidden">
          {/* Content */}
          <div className="relative z-10 text-center">
            <h1 className="text-6xl md:text-4xl font-extrabold tracking-widest mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
              Welcome to App
            </h1>

            <p className="text-zinc-300 text-xl mb-10 tracking-wide">
              Preparing your workspace...
            </p>

            {/* Loading Dots */}
            <div className="flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></span>
              <span
                className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></span>
              <span
                className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
