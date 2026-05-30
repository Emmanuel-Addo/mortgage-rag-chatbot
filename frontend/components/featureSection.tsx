const FeatureSection = () => {
    return (
        <>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
                    *{
                        font-family: "Geist", sans-serif;
                    }
                `}
            </style>

            <section className="bg-zinc-100 py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-9">
                        <span className="text-xs text-zinc-900 bg-white rounded-full px-6 py-2">FEATURES</span>
                        <h1 className="text-4xl md:text-[40px] font-medium text-zinc-900 mt-6">Everything You Need to Know</h1>
                        <p className="text-base text-zinc-600 max-w-sm mx-auto mt-3">Upload your mortgage documents and get instant AI-powered answers with source citations.</p>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Row 1 */}
                        <div className="flex flex-col md:flex-row gap-5">
                            <div className="md:w-[60%] md:h-60 bg-white rounded-xl hover:shadow-sm transition-all duration-300 p-5 flex flex-col md:flex-row gap-5">
                                <img src="https://assets.prebuiltui.com/images/components/feature-sections/feature-workspace-img.png" alt="Document Upload" className="w-full h-48 md:h-full md:w-[45%] object-cover rounded-2xl" />
                                <div className="flex flex-col mt-2">
                                    <div className="size-11 bg-zinc-900 rounded-lg flex items-center justify-center mb-5">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1m11 0h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1m0 11h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1M9 14H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-zinc-900">Smart Document Upload</h3>
                                    <p className="text-sm/6 text-zinc-800 mt-2.5">Upload your mortgage PDFs securely. Our AI reads, indexes and understands every page so you don&apos;t have to search manually.</p>
                                </div>
                            </div>

                            <div className="md:w-[40%] bg-white rounded-xl hover:shadow-sm transition-all duration-300 px-6 py-6 md:pt-7">
                                <div className="size-11 bg-zinc-900 rounded-lg flex items-center justify-center mb-5">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="m9 12 2 2 4-4" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <h3 className="text-sm font-medium text-zinc-900">Secure & Private</h3>
                                <p className="text-sm text-zinc-800 mt-2.5">Your mortgage documents are encrypted and never shared. We follow strict data privacy standards to keep your financial information safe at all times.</p>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="flex flex-col md:flex-row gap-5">
                            <div className="md:w-[40%] bg-white rounded-xl hover:shadow-sm transition-all duration-300 px-6 py-6 md:pt-7">
                                <div className="size-11 bg-zinc-900 rounded-lg flex items-center justify-center mb-5">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.671 4.134a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.83A2.34 2.34 0 0 1 6.35 6.048a2.34 2.34 0 0 0 3.319-1.915" stroke="#f4f4f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6" stroke="#f4f4f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <h3 className="text-sm font-medium text-zinc-900">Instant AI Answers</h3>
                                <p className="text-sm text-zinc-800 mt-2.5">Ask any question about your mortgage in plain English. Get accurate answers in seconds with exact page references from your documents.</p>
                            </div>

                            <div className="md:w-[60%] md:h-60 bg-white rounded-xl hover:shadow-sm transition-all duration-300 p-5 flex flex-col md:flex-row gap-5">
                                <img src="https://assets.prebuiltui.com/images/components/feature-sections/feature-minimal-office-img.png" alt="Source Citations" className="w-full h-48 md:h-full md:w-[45%] object-cover rounded-2xl" />
                                <div className="flex flex-col mt-2">
                                    <div className="size-11 bg-zinc-900 rounded-lg flex items-center justify-center mb-5">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-2 8v4a2 2 0 0 0 2 2h4m6-4h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" stroke="#fafafa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-zinc-900">Source Citations</h3>
                                    <p className="text-sm/6 text-zinc-800 mt-2.5">Every answer comes with a source — the exact page and section from your mortgage document. No guessing, no hallucinations, just facts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default FeatureSection;