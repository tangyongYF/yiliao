import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, FileText, ArrowRight, Home, RefreshCcw, Activity, HeartPulse, CheckSquare, Search, BookOpen, X, Loader2, Volume2, StopCircle } from 'lucide-react';
import { Button } from './components/Button';
import { StepIndicator } from './components/StepIndicator';
import { ResultCard } from './components/ResultCard';
import { analyzeMedicalReport, explainMedicalTerm, generateMedicalAudio } from './services/geminiService';
import { AppScreen, AnalysisResult, ResultStep } from './types';
import { LineChart, Line } from 'recharts';

// --- Helpers for Audio ---

// Decode base64 to Uint8Array
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode PCM Data to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Term Translator Modal ---

const TermTranslatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [term, setTerm] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!term.trim()) return;
    setLoading(true);
    setExplanation('');
    try {
      const result = await explainMedicalTerm(term);
      setExplanation(result);
    } catch (e) {
      setExplanation("抱歉，出了点小问题，请重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={24} />
            <h3 className="text-xl font-bold">医学术语翻译官</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-slate-500 mb-4">输入您看不懂的医学名词（例如：肌酐、窦性心律），我来帮您解释。</p>
          
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="输入医学名词..."
              className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg focus:border-blue-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={loading || !term}
              className="bg-blue-600 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </button>
          </div>

          {explanation && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
              <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <HeartPulse size={18} /> 
                {term} 的解释：
              </h4>
              <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">
                {explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for Screens ---

const HomeScreen: React.FC<{ onUpload: (file: File) => void; onOpenTranslator: () => void }> = ({ onUpload, onOpenTranslator }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <header className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg pb-12">
        <h1 className="text-3xl font-bold mb-2">医疗报告翻译官</h1>
        <p className="text-blue-100 text-lg">拍张照片，3分钟帮您读懂体检单</p>
      </header>

      <main className="flex-1 px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">开始解读报告</h2>
            <p className="text-slate-500 mt-2 text-lg">支持 JPG、PNG、PDF 文件</p>
          </div>

          <div className="space-y-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            
            <Button 
              size="large" 
              icon={<Camera size={24} />}
              onClick={() => fileInputRef.current?.click()}
            >
              拍照上传
            </Button>
            
            <Button 
              variant="outline" 
              size="large" 
              icon={<Upload size={24} />}
              onClick={() => fileInputRef.current?.click()}
            >
              选择照片或文件
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Activity className="text-green-600" />
            </div>
            <h3 className="font-bold text-lg">看得懂</h3>
            <p className="text-slate-500 text-sm">生活化比喻</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
             <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <HeartPulse className="text-orange-600" />
            </div>
            <h3 className="font-bold text-lg">不紧张</h3>
            <p className="text-slate-500 text-sm">温和解读</p>
          </div>
        </div>

        {/* Term Translator Button */}
        <button 
          onClick={onOpenTranslator}
          className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between group active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <BookOpen className="text-indigo-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg text-slate-800">查医学术语</h3>
              <p className="text-slate-500 text-sm">不懂的词，点这里查一查</p>
            </div>
          </div>
          <ArrowRight className="text-slate-300 group-hover:text-indigo-600" />
        </button>

      </main>
      
      <footer className="p-6 text-center text-slate-400 text-sm">
        <p>所有数据仅用于本地分析，保护您的隐私</p>
      </footer>
    </div>
  );
};

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-blue-50 items-center justify-center p-6 text-center">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-8 border-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-t-8 border-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <RefreshCcw className="w-12 h-12 text-blue-600" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-4">正在分析报告...</h2>
      <p className="text-xl text-slate-600">请稍等，AI医生正在仔细阅读您的数据。</p>
      <div className="mt-8 bg-white p-4 rounded-xl max-w-sm shadow-sm">
        <p className="text-slate-500">💡 小贴士：保持心情舒畅是健康的良药</p>
      </div>
    </div>
  );
};

const ErrorScreen: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  return (
    <div className="flex flex-col min-h-screen bg-red-50 items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <Activity className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">读取失败</h2>
      <p className="text-lg text-slate-600 mb-8">文件可能有点模糊，或者格式不支持。</p>
      <Button onClick={onRetry} size="large">重试一下</Button>
    </div>
  );
};

// --- Main Results View (Step 1, 2, 3) ---

const ResultsView: React.FC<{ 
  result: AnalysisResult; 
  step: ResultStep; 
  setStep: (s: ResultStep) => void; 
  onHome: () => void;
  onOpenTranslator: () => void;
}> = ({ result, step, setStep, onHome, onOpenTranslator }) => {

  // Step 1: Overview
  const OverviewContent = () => {
    const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const playSummary = async () => {
      if (audioStatus === 'playing') {
        sourceRef.current?.stop();
        setAudioStatus('idle');
        return;
      }

      setAudioStatus('loading');
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const base64Audio = await generateMedicalAudio(result.summary);
        const pcmData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000, 1);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setAudioStatus('idle');
        
        sourceRef.current = source;
        source.start();
        setAudioStatus('playing');

      } catch (error) {
        console.error("Audio playback error:", error);
        setAudioStatus('idle');
        alert("语音播放失败，请稍后重试");
      }
    };

    // Cleanup audio on unmount
    useEffect(() => {
      return () => {
        if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch(e) {}
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }, []);

    return (
      <div className="animate-fade-in">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <h2 className="text-slate-500 text-lg mb-2">健康综合评分</h2>
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center mb-6">
             {/* Simple Chart visualization for decoration */}
             <div className="absolute inset-0 opacity-30">
                 <LineChart width={160} height={160} data={[{v:0}, {v:result.healthScore}, {v:100}]}>
                   <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} dot={false} />
                 </LineChart>
             </div>
             <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center z-10 bg-white
               ${result.healthScore >= 80 ? 'border-green-500 text-green-600' : 'border-orange-500 text-orange-600'}`}>
               <span className="text-5xl font-bold">{result.healthScore}</span>
             </div>
          </div>

          {/* New Simplified Summary Section */}
          <div className="bg-blue-50 rounded-xl p-4 text-left border border-blue-100">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-blue-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  身体状况小结
               </h3>
               <button 
                 onClick={playSummary}
                 disabled={audioStatus === 'loading'}
                 className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                   ${audioStatus === 'playing' 
                     ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                     : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}
               >
                 {audioStatus === 'loading' ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : audioStatus === 'playing' ? (
                   <StopCircle className="w-4 h-4" />
                 ) : (
                   <Volume2 className="w-4 h-4" />
                 )}
                 {audioStatus === 'playing' ? '停止播放' : '语音解读'}
               </button>
             </div>
             <p className="text-lg font-medium text-slate-700 leading-relaxed">
               {result.summary}
             </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm mb-20 border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-2">数据概览</h3>
          <ul className="space-y-2">
            <li className="flex justify-between text-lg border-b border-slate-50 pb-2">
              <span>总指标数</span>
              <span className="font-bold">{result.indicators.length}项</span>
            </li>
            <li className="flex justify-between text-lg text-orange-600">
              <span>需关注项</span>
              <span className="font-bold">{result.indicators.filter(i => i.status !== 'normal').length}项</span>
            </li>
          </ul>
        </div>
      </div>
    );
  };

  // Step 2: Details
  const DetailsContent = () => (
    <div className="space-y-4 pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 px-2">重点指标解读</h2>
      
      {/* Show Warning/Critical first */}
      {result.indicators.filter(i => i.status !== 'normal').map((ind, idx) => (
        <ResultCard key={`warn-${idx}`} indicator={ind} />
      ))}
      
      {result.indicators.filter(i => i.status !== 'normal').length === 0 && (
        <div className="p-6 bg-green-50 rounded-xl text-center border-green-200 border">
          <HeartPulse className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <h3 className="text-xl font-bold text-green-700">真棒！</h3>
          <p className="text-green-600">没有发现明显的异常指标。</p>
        </div>
      )}

      {/* Show normal items collapsed or in a separate list if desired, simplified here */}
      {result.indicators.filter(i => i.status === 'normal').length > 0 && (
         <div className="mt-8">
           <h3 className="text-lg font-bold text-slate-500 mb-3 px-2">正常指标 ({result.indicators.filter(i => i.status === 'normal').length})</h3>
           {result.indicators.filter(i => i.status === 'normal').map((ind, idx) => (
             <ResultCard key={`norm-${idx}`} indicator={ind} />
           ))}
         </div>
      )}
    </div>
  );

  // Step 3: Actions
  const ActionsContent = () => (
    <div className="pb-20 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 px-2">下一步怎么做？</h2>
      
      <div className="space-y-4">
        {result.actionPlan.map((action, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-md border-l-8 border-blue-500 flex items-start">
            <div className="mr-4 mt-1 bg-blue-100 p-2 rounded-full">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{action.title}</h3>
              <p className="text-lg text-slate-600 leading-relaxed">{action.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-slate-100 rounded-xl">
        <h4 className="font-bold text-slate-500 mb-2">免责声明</h4>
        <p className="text-sm text-slate-400">
          AI解读仅供参考，不能替代专业医生的诊断。如有不适，请及时就医。
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
        <button onClick={onHome} className="text-slate-500 flex items-center text-lg">
          <Home className="mr-1" /> 首页
        </button>
        <span className="font-bold text-lg">解读结果</span>
        {/* Small icon to access translator from results too */}
        <button onClick={onOpenTranslator} className="text-blue-600">
          <BookOpen size={24} />
        </button>
      </header>

      <main className="flex-1 p-6">
        <StepIndicator currentStep={step} totalSteps={3} />
        
        {step === ResultStep.OVERVIEW && <OverviewContent />}
        {step === ResultStep.DETAILS && <DetailsContent />}
        {step === ResultStep.ACTIONS && <ActionsContent />}
      </main>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-30">
        <div className="flex gap-4 max-w-lg mx-auto">
          {step > 1 && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setStep(step - 1)}
            >
              上一步
            </Button>
          )}
          
          {step < 3 ? (
             <Button 
               className="flex-1"
               onClick={() => setStep(step + 1)}
               icon={<ArrowRight />}
             >
               {step === 1 ? '看详细解读' : '看行动建议'}
             </Button>
          ) : (
            <Button 
               className="flex-1"
               variant="secondary"
               onClick={onHome}
             >
               完成解读
             </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState<ResultStep>(ResultStep.OVERVIEW);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);

  const handleUpload = async (file: File) => {
    setScreen(AppScreen.ANALYZING);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const analysisData = await analyzeMedicalReport(base64String);
          setResult(analysisData);
          setStep(ResultStep.OVERVIEW);
          setScreen(AppScreen.RESULTS);
        } catch (e) {
          setScreen(AppScreen.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error", error);
      setScreen(AppScreen.ERROR);
    }
  };

  const resetApp = () => {
    setResult(null);
    setStep(ResultStep.OVERVIEW);
    setScreen(AppScreen.HOME);
  };

  return (
    <>
      {/* Global Modal Layer */}
      <TermTranslatorModal 
        isOpen={isTermModalOpen} 
        onClose={() => setIsTermModalOpen(false)} 
      />

      {(() => {
        switch (screen) {
          case AppScreen.ANALYZING:
            return <LoadingScreen />;
          case AppScreen.RESULTS:
            return result ? (
              <ResultsView 
                result={result} 
                step={step} 
                setStep={setStep} 
                onHome={resetApp}
                onOpenTranslator={() => setIsTermModalOpen(true)}
              />
            ) : <ErrorScreen onRetry={resetApp} />;
          case AppScreen.ERROR:
            return <ErrorScreen onRetry={resetApp} />;
          default:
            return (
              <HomeScreen 
                onUpload={handleUpload} 
                onOpenTranslator={() => setIsTermModalOpen(true)}
              />
            );
        }
      })()}
    </>
  );
}