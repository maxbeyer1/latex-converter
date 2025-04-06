"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "../services/appState";

export default function Navigation() {
  const pathname = usePathname();
  const clearLatexContent = useAppStore((state) => state.clearLatexContent);
  
  return (
    <nav className="bg-white shadow-sm w-full">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-800">LaTeX Tools</span>
            </div>
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                PDF to LaTeX
              </Link>
              <Link 
                href="/editor"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/editor" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                LaTeX Editor
              </Link>
            </div>
          </div>
          {pathname === "/editor" && (
            <div className="flex items-center">
              <button 
                onClick={() => clearLatexContent()}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Editor
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}