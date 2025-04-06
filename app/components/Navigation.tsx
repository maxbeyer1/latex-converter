"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  
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
                Converter
              </Link>
              <Link 
                href="/editor"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/editor" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                Editor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}