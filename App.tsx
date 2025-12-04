import React, { useState, useRef, useEffect } from 'react';
import { 
  FileVideo, 
  Upload, 
  FileText, 
  Table as TableIcon, 
  Zap, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Download
} from 'lucide-react';
import { extractFramesFromVideo } from './services/videoUtils';
import { generateContent } from './services/gemini';
import { GenerationMode } from './types';
import TestCaseViewer from './components/TestCaseViewer';
import MarkdownViewer from './components/MarkdownViewer';

const STORAGE_KEY = 'kbw_gemini_api_key';
const ENV_API_KEY =
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY ??
  (import.meta as any)?.env?.VITE_API_KEY ??
  (import.meta as any)?.env?.API_KEY ??
  (typeof process !== 'undefined' ? process.env.API_KEY : '') ??
  '';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.TEST_CASES);
  const [error, setError] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    }
    return ENV_API_KEY;
  });
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (apiKey) {
      window.localStorage.setItem(STORAGE_KEY, apiKey);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [apiKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("File size too large. Please upload a video under 100MB.");
        return;
      }
      setFile(selectedFile);
      setVideoSrc(URL.createObjectURL(selectedFile));
      setGeneratedOutput(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    const resolvedKey = apiKey.trim();
    if (!resolvedKey) {
        setError("Please provide your Gemini API key to continue.");
        return;
    }

    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setGeneratedOutput(null);

    try {
      // 1. Extract Frames
      setProgress(20);
      // Increased to 60 frames to support exhaustive test case generation (approx 1 frame/sec for short videos)
      const frames = await extractFramesFromVideo(file, 60); 
      setProgress(50);

      // 2. Send to Gemini
      const result = await generateContent(
        resolvedKey, 
        frames, 
        mode,
        customInstructions
      );
      
      setProgress(100);
      setGeneratedOutput(result);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate content.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setVideoSrc(null);
    setGeneratedOutput(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadCSV = () => {
    if (!generatedOutput) return;
    const blob = new Blob([generatedOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'test_cases.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileVideo className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800">KB Writer</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200 flex items-center">
                 <Zap className="w-3 h-3 mr-1 fill-current" />
                 Gemini 3 Pro
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Upload Area */}
            <div className={`
              relative group rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
              ${file ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300'}
            `}>
              {!file ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 flex flex-col items-center justify-center cursor-pointer text-center h-64"
                >
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800">Upload Recording</h3>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">
                    Drag and drop your video file here, or click to browse. Max 100MB.
                  </p>
                </div>
              ) : (
                <div className="bg-white p-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-4 group shadow-md">
                     <video 
                        src={videoSrc || ""} 
                        className="w-full h-full object-contain"
                        controls 
                     />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-slate-500">{(file.size / (1024*1024)).toFixed(1)} MB</span>
                    </div>
                    <button 
                      onClick={clearFile}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
                accept="video/*"
              />
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Generation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode(GenerationMode.TEST_CASES)}
                    className={`flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      mode === GenerationMode.TEST_CASES
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <TableIcon className="w-4 h-4 mr-2" />
                    Test Cases
                  </button>
                  <button
                    onClick={() => setMode(GenerationMode.DOCUMENTATION)}
                    className={`flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      mode === GenerationMode.DOCUMENTATION
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    User Guide
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Gemini API Key
                </label>
                <div className="flex rounded-lg border border-slate-200 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-colors">
                  <input
                    type={isApiKeyVisible ? "text" : "password"}
                    className="flex-1 px-4 py-2.5 rounded-l-lg text-sm outline-none bg-transparent"
                    placeholder="Enter your Gemini API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsApiKeyVisible((prev) => !prev)}
                    className="px-4 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {isApiKeyVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Stored locally in your browser and never sent anywhere else.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Additional Context <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none text-sm"
                  rows={3}
                  placeholder="e.g. Focus on the checkout flow login validation..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!file || isProcessing}
                className={`
                  w-full flex items-center justify-center px-6 py-4 rounded-xl text-white font-medium text-lg transition-all
                  ${!file || isProcessing 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98]'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Video...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2 fill-white" />
                    Generate Output
                  </>
                )}
              </button>

              {isProcessing && (
                <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-center text-slate-500">
                        {progress < 30 ? "Extracting frames..." : "Analyzing with Gemini..."}
                    </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 text-sm">
                    <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                    <span>{error}</span>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-8 h-full min-h-[500px]">
            {!generatedOutput ? (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-center p-12 opacity-60">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <PlayCircle className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-medium text-slate-800 mb-2">Ready to Generate</h2>
                <p className="text-slate-500 max-w-md">
                    Upload a video recording of your app or feature. Gemini will analyze the visual flow and automatically create {mode === GenerationMode.TEST_CASES ? 'test scenarios' : 'documentation'} for you.
                </p>
              </div>
            ) : (
                <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                            {mode === GenerationMode.TEST_CASES ? (
                                <><CheckCircle className="w-5 h-5 mr-2 text-indigo-600" /> Generated Test Suite</>
                            ) : (
                                <><FileText className="w-5 h-5 mr-2 text-indigo-600" /> Generated Documentation</>
                            )}
                        </h2>
                        <div className="flex items-center gap-3">
                            {mode === GenerationMode.TEST_CASES && (
                                <button 
                                    onClick={downloadCSV}
                                    className="flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <Download className="w-4 h-4 mr-1.5" />
                                    Download CSV
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedOutput);
                                    alert("Copied to clipboard!");
                                }}
                                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                            >
                                Copy Raw
                            </button>
                        </div>
                    </div>

                    {mode === GenerationMode.TEST_CASES ? (
                        <TestCaseViewer csvContent={generatedOutput} />
                    ) : (
                        <MarkdownViewer content={generatedOutput} />
                    )}
                </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;