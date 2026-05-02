"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-silver-300">
      <button
        className="relative group cursor-pointer border-2 border-gray-200 rounded-lg px-3 py-2"
        onClick={() => router.push("/clients")}
      >
        <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 bg-[length:200%_200%] bg-left bg-clip-text text-transparent transition-all duration-500 group-hover:bg-right">
          PAYFOLO
        </span>

        {/* underline */}
        <span className="absolute left-1/2 bottom-0 h-[3px] w-0 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
      </button>
    </div>
  );
}
