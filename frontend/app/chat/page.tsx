"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const recentChats = [
  "What is the current mortgage rate?",
  "Fixed vs adjustable rate mortgages",
  "How much down payment do I need?",
  "Pre-approval process explained",
  "Debt-to-income ratio guidelines",
  "Closing costs breakdown",
  "FHA loan requirements",
];

const suggestions = [
  "Compare fixed vs adjustable rates",
  "Documents needed to apply",
  "How my credit score is used",
  "Estimate my closing costs",
];

function getMockResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("rate") || q.includes("interest"))
    return "Current mortgage interest rates vary based on loan type and your credit profile.\n\n**30-year fixed** rates are averaging around **6.8%**, 15-year fixed rates are near **6.1%**, and 5/1 ARM rates start around **6.3%**.\n\nYour actual rate depends on credit score, down payment, loan amount, and lender. I recommend getting quotes from at least three lenders before deciding.";
  if (q.includes("down payment") || q.includes("down"))
    return "Down payment requirements depend on the loan type:\n\n- **Conventional loans** — typically require 3–20%\n- **FHA loans** — as little as 3.5% with a 580+ credit score\n- **VA and USDA loans** — may require no down payment at all\n\nA larger down payment lowers your monthly payment and eliminates private mortgage insurance (PMI) on conventional loans.";
  if (q.includes("document") || q.includes("apply") || q.includes("needed"))
    return "To apply for a mortgage you will typically need:\n\n1. Government-issued photo ID\n2. Recent pay stubs (last 30 days)\n3. W-2 forms from the past two years\n4. Federal tax returns\n5. Bank statements (last 2–3 months)\n6. Details on any existing debts\n\nSelf-employed applicants may also need profit and loss statements.";
  if (q.includes("credit") || q.includes("score"))
    return "Your credit score is a key factor in mortgage approval and rate determination.\n\n- **Conventional loans** — minimum score of 620\n- **FHA loans** — may accept scores as low as 580\n- **Best rates** — typically require a score above 740\n\nLenders pull reports from all three major bureaus (Equifax, Experian, TransUnion) and usually use the middle score.";
  if (q.includes("closing") || q.includes("cost"))
    return "Closing costs typically range from **2–5% of the loan amount**. They include:\n\n- Origination fees (0.5–1%)\n- Appraisal fee ($300–600)\n- Title search and insurance ($1,000–2,500)\n- Attorney fees where required\n- Prepaid interest, homeowners insurance, and property taxes";
  if (q.includes("fixed") || q.includes("adjustable") || q.includes("arm"))
    return "**Fixed-rate mortgage** — locks in your interest rate for the life of the loan, giving you predictable payments.\n\n**Adjustable-rate mortgage (ARM)** — has an initial fixed period (e.g. 5 years on a 5/1 ARM) then adjusts periodically based on a market index.\n\nFixed rates suit long-term stability. ARMs can be advantageous if you plan to move or refinance before adjustments begin.";
  if (q.includes("pre-approval") || q.includes("preapproval"))
    return "Mortgage pre-approval involves a lender reviewing your income, assets, debts, and credit score to determine how much they will lend.\n\nIt takes **1–3 business days** and produces a letter valid for **60–90 days**. Pre-approval signals to sellers that you are a serious buyer and is stronger than pre-qualification.";
  return "I can help you understand loan terms, interest rates, payment schedules, and eligibility requirements based on your mortgage documents.\n\nCould you be more specific about what you would like to explore? You can also upload a document to get tailored insights from your actual mortgage data.";
}

// Render simple markdown-like bold and newlines
function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return (
      <p key={i} className={line === "" ? "mt-3" : "leading-7"}>
        {parts}
      </p>
    );
  });
}

interface InputBoxProps {
  bottomMode: boolean;
  input: string;
  setInput: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: (text?: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  selectedDoc: string | null;
  attachedFile: File | null;
  onAttach: (file: File) => void;
  onRemoveAttach: () => void;
  isUploading: boolean;
}

function InputBox({
  bottomMode,
  input,
  setInput,
  handleKeyDown,
  sendMessage,
  textareaRef,
  selectedDoc,
  attachedFile,
  onAttach,
  onRemoveAttach,
  isUploading,
}: InputBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = input.trim() || attachedFile;

  return (
    <div className={`rounded-2xl bg-white transition-all duration-200 border ${
      bottomMode
        ? "border-gray-200 shadow-sm focus-within:border-indigo-300 focus-within:shadow-md"
        : "border-gray-200 shadow-md focus-within:border-indigo-400 focus-within:shadow-lg"
    }`}>
      {/* Attached file chip */}
      {attachedFile && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 max-w-xs">
            <svg className="size-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-indigo-700 font-medium truncate max-w-[160px]">{attachedFile.name}</span>
            <span className="text-[10px] text-indigo-400 shrink-0">
              {(attachedFile.size / 1024).toFixed(0)}KB
            </span>
            <button
              onClick={onRemoveAttach}
              className="text-indigo-400 hover:text-indigo-600 transition ml-0.5 shrink-0"
              aria-label="Remove attachment"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {isUploading && (
            <span className="text-xs text-indigo-500 flex items-center gap-1">
              <svg className="animate-spin size-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Indexing...
            </span>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">
        {/* + Attach button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAttach(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach PDF"
          title="Attach PDF"
          className="size-8 rounded-xl flex items-center justify-center shrink-0 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition cursor-pointer"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachedFile
              ? "Add a message about this document..."
              : selectedDoc
              ? `Ask about "${selectedDoc}"...`
              : bottomMode
              ? "Ask a follow-up..."
              : "Ask anything about your mortgage..."
          }
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none leading-relaxed py-1"
          style={{ maxHeight: "160px" }}
        />

        {/* Send button */}
        <button
          onClick={() => sendMessage()}
          disabled={!canSend || isUploading}
          aria-label="Send"
          className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
            canSend && !isUploading
              ? "bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105 cursor-pointer shadow-sm"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState<{ name: string }[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (hasMessages) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, hasMessages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("http://localhost:8000/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }

  async function handleFileUpload(file: File): Promise<string | null> {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchDocuments();
        return file.name;
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to upload document");
        return null;
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to connect to the backend server.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteDocument(filename: string) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/documents/${filename}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedDoc === filename) {
          setSelectedDoc(null);
        }
        await fetchDocuments();
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Deleted document **${filename}** from database.`,
            timestamp: new Date(),
          },
        ]);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to delete document");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to connect to the backend server.");
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content && !attachedFile) return;

    // If a file is attached, upload it first then ask about it
    let uploadedDocName: string | null = selectedDoc;
    if (attachedFile) {
      const fileName = await handleFileUpload(attachedFile);
      setAttachedFile(null);
      if (fileName) {
        uploadedDocName = fileName;
        setSelectedDoc(fileName);
        // Show a confirmation message in chat
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Uploaded and indexed **${fileName}**. ${content ? "Asking your question now..." : "You can now ask questions about it!"}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        return; // upload failed, bail
      }
      if (!content) return; // no message to send, just uploaded
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content, timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: content,
          document_name: uploadedDocName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: data.answer, timestamp: new Date() },
        ]);
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: `Error: ${errData.detail || "Failed to get answer from server."}`, timestamp: new Date() },
        ]);
      }
    } catch (err) {
      console.error("Error asking question:", err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Failed to connect to the backend RAG server. Please verify the backend is running.", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }



  return (
    /* Outer bg with space on all sides */
    <div className="h-screen w-full overflow-hidden bg-slate-100 p-6 flex items-stretch font-sans">

      {/* Floating card */}
      <div className="flex w-full rounded-3xl overflow-hidden shadow-xl shadow-gray-200/80 border border-gray-200">

        {/* ── SIDEBAR ── */}
        <aside className={`flex flex-col h-full shrink-0 transition-all duration-300 overflow-hidden bg-[#F9F9F9] border-r border-gray-100 ${sidebarOpen ? "w-60" : "w-16"}`}>

          {/* Logo / Header */}
          <div className={`pt-6 pb-5 flex items-center shrink-0 ${sidebarOpen ? "px-5 justify-between" : "justify-center"}`}>
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              {sidebarOpen && <span className="text-sm font-semibold text-gray-800">MortgageAI</span>}
            </div>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition cursor-pointer">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* New chat */}
          <div className="px-3 mb-2 shrink-0">
            <button 
              onClick={() => setMessages([])} 
              className={`w-full flex items-center rounded-lg hover:bg-gray-100 transition cursor-pointer font-medium text-gray-600 text-sm py-2 ${sidebarOpen ? "px-3 gap-2.5 justify-start" : "justify-center"}`}
              title="New chat"
            >
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {sidebarOpen && <span>New chat</span>}
            </button>
          </div>

          {/* Search */}
          <div className="px-3 mb-2 shrink-0">
            <button 
              className={`w-full flex items-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-500 text-sm py-2 ${sidebarOpen ? "px-3 gap-2.5 justify-start" : "justify-center"}`}
              title="Search chats"
            >
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {sidebarOpen && <span>Search chats</span>}
            </button>
          </div>


          {/* Recents */}
          <div className="max-h-[30%] overflow-y-auto px-3 min-h-0 mb-4 shrink-0">
            {sidebarOpen && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">Recents</p>}
            {recentChats.map((chat, i) => (
              <button 
                key={i} 
                onClick={() => sendMessage(chat)} 
                className={`w-full flex items-center text-left text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer truncate mb-0.5 py-2 ${sidebarOpen ? "px-3" : "justify-center"}`}
                title={chat}
              >
                {sidebarOpen ? (
                  <span className="truncate">{chat}</span>
                ) : (
                  <svg className="size-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <div className="mx-4 border-t border-gray-100 shrink-0" />
            {/* User */}
            <div className="p-4 shrink-0">
              <div className={`flex items-center rounded-lg hover:bg-gray-100 cursor-pointer transition group ${sidebarOpen ? "px-2 py-2 gap-3" : "justify-center py-2"}`}>
                <div className="size-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">EA</div>
                {sidebarOpen && (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">Emmanuel Addo</p>
                    <p className="text-xs text-gray-400">Free plan</p>
                    <p className="text-xs text-gray-500 mt-1">emmanuel.addo@example.com</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white relative">

          {/* Sidebar toggle (only when closed) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-5 z-20 size-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Header Top Bar */}
          {(selectedDoc || !sidebarOpen) && (
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0 bg-white min-h-[65px]">
              <div className="flex items-center gap-2">
                {!sidebarOpen && <div className="w-8" />} 
                {selectedDoc && (
                  <h2 className="text-sm font-semibold text-gray-800">
                    <span className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-indigo-500" />
                      Querying: <span className="text-indigo-600 font-mono text-xs">{selectedDoc}</span>
                    </span>
                  </h2>
                )}
              </div>
              {selectedDoc && (
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!hasMessages && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
              <h1 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
                What would you like to know about your mortgage?
              </h1>

              <div className="w-full max-w-xl mb-5">
                <InputBox
                  bottomMode={false}
                  input={input}
                  setInput={setInput}
                  handleKeyDown={handleKeyDown}
                  sendMessage={sendMessage}
                  textareaRef={textareaRef}
                  selectedDoc={selectedDoc}
                  attachedFile={attachedFile}
                  onAttach={setAttachedFile}
                  onRemoveAttach={() => setAttachedFile(null)}
                  isUploading={isUploading}
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center w-full max-w-xl">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CHAT STATE ── */}
          {hasMessages && (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={index > 0 ? "mt-10" : ""}
                    >
                      {msg.role === "user" ? (
                        /* User message — right-aligned small pill */
                        <div className="flex justify-end mb-2">
                          <div className="max-w-[70%] px-4 py-2.5 bg-gray-100 text-gray-800 rounded-3xl text-sm leading-relaxed">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        /* AI message — plain text left aligned, no bubble */
                        <div className="mt-8">
                          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">MortgageAI</p>
                          <div className="text-sm text-gray-700 leading-7 space-y-1">
                            {renderContent(msg.content)}
                          </div>
                          <p className="text-[10px] text-gray-300 mt-3">
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="mt-10">
                      <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest mb-3">MortgageAI</p>
                      <div className="flex gap-1.5 items-center h-6">
                        <span className="size-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
                        <span className="size-2 rounded-full bg-gray-300 animate-bounce [animation-delay:140ms]" />
                        <span className="size-2 rounded-full bg-gray-300 animate-bounce [animation-delay:280ms]" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Bottom input */}
              <div className="bg-white border-t border-gray-100 px-6 py-5 shrink-0">
                <div className="max-w-2xl mx-auto">
                  <InputBox
                    bottomMode={true}
                    input={input}
                    setInput={setInput}
                    handleKeyDown={handleKeyDown}
                    sendMessage={sendMessage}
                    textareaRef={textareaRef}
                    selectedDoc={selectedDoc}
                    attachedFile={attachedFile}
                    onAttach={setAttachedFile}
                    onRemoveAttach={() => setAttachedFile(null)}
                    isUploading={isUploading}
                  />
                  <p className="text-center text-[10px] text-gray-300 mt-3">
                    Always verify mortgage advice with a licensed professional.
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
