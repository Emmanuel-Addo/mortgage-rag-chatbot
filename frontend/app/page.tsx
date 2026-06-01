"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { sharedState } from "./utils/sharedState";

const suggestedQuestions: string[] = [
  "What are the mortgage loan requirements?",
  "What is the current interest rate?",
  "What documents do I need to apply?",
  "How long does approval take?",
];

export default function HomePage() {
  const [question, setQuestion] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = () => {
    if (question.trim()) {
      sharedState.initialQuestion = question.trim();
      router.push("/chat");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sharedState.initialFile = file;
      if (question.trim()) {
        sharedState.initialQuestion = question.trim();
      }
      router.push("/chat");
    }
  };

  const handleSuggestedClick = (q: string) => {
    sharedState.initialQuestion = q;
    router.push("/chat");
  };

  return (
    <section className="bg-gray-900 min-h-screen">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <main
        className="flex items-center flex-col justify-between bg-cover text-sm text-white max-md:px-4 text-center min-h-screen"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/bg-gradient-2.png')",
        }}
      >
        {/* Navbar */}
        <nav className="flex items-center justify-between w-full md:px-16 lg:px-24 xl:px-32 py-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 text-white font-bold text-xl">
            MortgageAI
          </a>

          {/* Get Started Button */}
          <button
            onClick={() => router.push("/chat")}
            className="px-6 py-2 bg-white text-black hover:bg-gray-200 transition active:scale-95 rounded-full border border-gray-600 font-medium"
          >
            Get Started
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
                className="flex items-center justify-center bg-gray-500 p-1 rounded-full size-6 hover:bg-gray-400 transition cursor-pointer"
                aria-label="Upload document"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5h9M5.5 1v9" stroke="#CCD5E2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Send button */}
              <button
                className="flex items-center justify-center p-1 rounded size-6 bg-indigo-600 hover:bg-indigo-500 transition active:scale-95 cursor-pointer"
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
                  onClick={() => handleSuggestedClick(q)}
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
    </section>
  );
}