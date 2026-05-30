"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FeatureSection from "../components/featureSection";

const suggestedQuestions: string[] = [
  "What are the mortgage loan requirements?",
  "What is the current interest rate?",
  "What documents do I need to apply?",
  "How long does approval take?",
];

export default function HomePage() {
  const [question, setQuestion] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = () => {
    if (question.trim()) {
      router.push(`/chat?q=${encodeURIComponent(question)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
  <section className="bg-white min-h-screen">
    <main
      className="flex items-center flex-col justify-between bg-cover text-sm text-gray-800 max-md:px-4 text-center min-h-screen"
    >
      {/* Navbar */}
      <nav className="flex items-center justify-between w-full md:px-16 lg:px-24 xl:px-32 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 text-gray-800 font-bold text-xl">
          MortgageAI
        </a>

          {/* Desktop Menu */}
          <div
            className={`
              max-md:absolute max-md:bg-black/50 max-md:h-[785px] 
              max-md:overflow-hidden max-md:transition-[width] max-md:duration-300 
              max-md:top-0 max-md:left-0 max-md:flex-col max-md:justify-center 
              max-md:text-lg max-md:backdrop-blur flex items-center gap-8 font-medium
              ${menuOpen ? "max-md:w-full" : "max-md:w-0"}
            `}
          >
            <a href="#" className="hover:text-gray-300 transition">Home</a>
            <a href="#features" className="hover:text-gray-300 transition">Features</a>
            <a href="#" className="hover:text-gray-300 transition">Pricing</a>
            <a href="#" className="hover:text-gray-300 transition">Docs</a>

            {/* Close button (mobile) */}
            <button
              aria-label="close menu"
              className="size-6 md:hidden"
              onClick={() => setMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Get Started Button (desktop) */}
          <button
            onClick={() => router.push("/chat")}
            className="max-md:hidden px-6 py-2 bg-white text-black hover:bg-gray-200 transition active:scale-95 rounded-full border border-gray-600"
          >
            Get Started
          </button>

          {/* Burger Menu (mobile) */}
          <button
            aria-label="open menu"
            className="size-6 md:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 18h18M3 6h18" />
            </svg>
          </button>
        </nav>

        {/* Hero Content */}
        <div className="flex flex-col items-center justify-center w-full px-4">
          <h1 className="text-4xl md:text-[40px] font-semibold">
            Ask anything about your mortgage
          </h1>
          <p className="text-base mt-6 text-gray-300">
            Upload your mortgage documents and get instant AI-powered answers.
          </p>

          {/* Chat Input Box */}
          <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl rounded-xl focus-within:ring-2 focus-within:ring-white/40 overflow-hidden mt-4">
            <textarea
              className="w-full p-3 pb-0 resize-none outline-none bg-transparent placeholder-gray-400"
              placeholder="Ask about interest rates, loan requirements, documents..."
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex items-center justify-between pb-3 px-3">
              {/* Upload button */}
              <button
                className="flex items-center justify-center bg-gray-500 p-1 rounded-full size-6 hover:bg-gray-400 transition"
                aria-label="Upload document"
                onClick={() => router.push("/chat")}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5h9M5.5 1v9" stroke="#CCD5E2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Send button */}
              <button
                className="flex items-center justify-center p-1 rounded size-6 bg-indigo-600 hover:bg-indigo-500 transition active:scale-95"
                aria-label="Send"
                onClick={handleSubmit}
              >
                <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5 5.5 1 10 5.5m-4.5 5.143V1" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="grid grid-cols-2 gap-4 mt-8 text-slate-400 max-w-xl w-full">
            {suggestedQuestions.map((q, index) => (
              <div key={index}>
                <p
                  className="cursor-pointer hover:text-white transition"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </p>
                <div className="w-full h-px bg-gray-400/50 mt-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-gray-400 pb-3">
          By messaging us, you agree to our{" "}
          <a href="#" className="underline hover:text-white transition">Terms of Use</a>{" "}
          and confirm you&apos;ve read our{" "}
          <a href="#" className="underline hover:text-white transition">Privacy Policy</a>.
        </p>
      </main>

      {/* feature section */}
      <FeatureSection />  
    </section>
  );
}