import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocFromServer,
  updateDoc,
  increment
} from 'firebase/firestore';
import { askSomoAI, generateQuiz } from './services/geminiService';
import { 
  BookOpen, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut, 
  Send, 
  Camera, 
  Brain, 
  Trophy, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Clock,
  Zap,
  FlaskConical,
  Calculator,
  Dna,
  Play,
  Pause,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, handleFirestoreError, OperationType } from './lib/utils';
import { KENYAN_CURRICULUM, Subject, Topic } from './constants';

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.startsWith('{')) {
        setHasError(true);
        setErrorInfo(event.error.message);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    const info = JSON.parse(errorInfo || '{}');
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card card-blue p-8 rounded-3xl max-w-md w-full">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <AlertCircle size={32} />
            <h2 className="text-2xl font-bold text-white">Wueh! Something went wrong.</h2>
          </div>
          <p className="text-text-muted mb-6">
            It seems like we hit a snag with the database. Don't worry, Kaka Somo is on it!
          </p>
          <div className="bg-black/30 p-4 rounded-xl text-xs font-mono overflow-auto max-h-40 mb-6 text-gray-300 border border-white/10">
            {JSON.stringify(info, null, 2)}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-neon-blue/20 text-neon-blue py-3 rounded-xl font-bold hover:bg-neon-blue/40 transition-colors border border-neon-blue/50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tutor' | 'quiz' | 'subjects'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (e) {}

        const userRef = doc(db, 'users', u.uid);
        const unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (!snap.exists()) {
            const newProfile = {
              uid: u.uid,
              displayName: u.displayName,
              email: u.email,
              subjects: ['math', 'bio'],
              retentionScore: 75,
              totalStudyHours: 0,
              subjectHours: { math: 0, bio: 0, phy: 0, chem: 0 },
              lastActive: serverTimestamp(),
            };
            setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(snap.data());
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`, auth);
        });

        return () => unsubscribeProfile();
      }
      setIsAuthReady(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={48} className="text-neon-blue" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
          <div className="orb scale-150"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg relative z-10 glass-card card-blue p-12 rounded-3xl"
        >
          <div className="bg-neon-blue/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.3)]">
            <Brain size={48} className="text-neon-blue" />
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-widest uppercase text-gradient">SomoAI</h1>
          <p className="text-xl text-text-muted mb-10 font-medium">
            Digital Campus Hub<br/>
            <span className="text-sm">English, Swahili, and Sheng—tunaelewa kila kitu! 🇰🇪</span>
          </p>
          <button 
            onClick={signInWithGoogle}
            className="bg-white/10 text-white px-8 py-4 rounded-2xl font-bold border border-white/20 flex items-center gap-4 mx-auto hover:bg-white/20 hover:border-neon-blue transition-all active:scale-95 uppercase tracking-wider"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Ingia na Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Sidebar */}
        <nav className="w-full md:w-24 flex flex-col items-center gap-8 pt-8 border-r border-white/10 shrink-0 min-h-screen bg-black/20 backdrop-blur-md">
          <div className="flex flex-col gap-6 flex-1">
            <NavIcon active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} color="blue" />
            <NavIcon active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')} icon={<BookOpen size={20} />} color="purple" />
            <NavIcon active={activeTab === 'tutor'} onClick={() => setActiveTab('tutor')} icon={<MessageSquare size={20} />} color="blue" />
            <NavIcon active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<Trophy size={20} />} color="purple" />
          </div>
          <div className="pb-8 flex flex-col items-center gap-4">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border border-white/20" alt="Avatar" />
            <button onClick={logOut} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard userProfile={userProfile} />}
            {activeTab === 'subjects' && <SubjectsSection userProfile={userProfile} />}
            {activeTab === 'tutor' && <Tutor user={user} />}
            {activeTab === 'quiz' && <Quiz user={user} />}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function NavIcon({ active, onClick, icon, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, color: 'blue' | 'purple' }) {
  const neonColor = color === 'blue' ? 'var(--color-neon-blue)' : 'var(--color-neon-purple)';
  return (
    <button 
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-white/5 flex justify-center items-center cursor-pointer transition-all border border-transparent"
      style={active ? { borderColor: neonColor, boxShadow: `0 0 15px ${neonColor}`, color: neonColor } : { color: 'var(--color-text-muted)' }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = neonColor;
          e.currentTarget.style.boxShadow = `0 0 15px ${neonColor}`;
          e.currentTarget.style.color = neonColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }
      }}
    >
      {icon}
    </button>
  );
}

// --- Dashboard Section ---

function Dashboard({ userProfile }: { userProfile: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <header className="text-center mb-12">
        <h1 className="text-5xl font-black text-gradient uppercase tracking-widest mb-2">Learning Unleashed</h1>
        <p className="text-text-muted text-xl">Digital Campus Hub - Welcome {userProfile?.displayName?.split(' ')[0]}</p>
      </header>

      <div className="flex justify-center mb-8">
        <StudyTimer userProfile={userProfile} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
        
        <div className="glass-card card-blue p-8 rounded-2xl h-full">
          <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">Retention Score</h2>
          <p className="text-text-muted text-sm mb-6">Your AI-calculated understanding of the material.</p>
          <div className="text-5xl font-black text-neon-blue">{userProfile?.retentionScore || 0}%</div>
        </div>

        <div className="flex justify-center items-center h-full min-h-[200px]">
          <div className="orb"></div>
        </div>

        <div className="glass-card card-purple p-8 rounded-2xl h-full">
          <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">Total Study Time</h2>
          <p className="text-text-muted text-sm mb-6">Hours logged across all your subjects.</p>
          <div className="text-5xl font-black text-neon-purple">{(userProfile?.totalStudyHours || 0).toFixed(1)} hrs</div>
        </div>

        <div className="glass-card card-purple p-8 rounded-2xl lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 uppercase tracking-wider text-white">Subject Progress</h2>
          <div className="space-y-6">
            {KENYAN_CURRICULUM.map(sub => {
              const hours = userProfile?.subjectHours?.[sub.id] || 0;
              const maxHours = 20;
              const percentage = Math.min((hours / maxHours) * 100, 100);
              return (
                <div key={sub.id} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-gray-300">
                    <span>{sub.name}</span>
                    <span className="text-text-muted">{hours.toFixed(1)} / {maxHours} hrs</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full rounded-full bg-neon-purple"
                      style={{ boxShadow: '0 0 10px var(--color-neon-purple)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card card-blue p-8 rounded-2xl h-full">
          <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-white">Pro-Hack of the Day</h2>
          <p className="text-text-muted text-sm leading-relaxed">
            "Did you know that the same logic used to calculate market prices (Supply & Demand) 
            is just like Algebra? If you know the price of one chapo, you can find the price of 10!"
          </p>
        </div>

      </div>
    </motion.div>
  );
}

function StudyTimer({ userProfile }: { userProfile: any }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('math');

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    setIsActive(false);
    if (seconds > 10) {
      const hours = seconds / 3600;
      const userRef = doc(db, 'users', userProfile.uid);
      try {
        await updateDoc(userRef, {
          totalStudyHours: increment(hours),
          [`subjectHours.${selectedSubject}`]: increment(hours),
          lastActive: serverTimestamp()
        });
        setSeconds(0);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSeconds(0);
    }
  };

  return (
    <div className="glass-card card-blue p-6 rounded-2xl flex items-center gap-8 w-fit">
      <div className="flex flex-col">
        <select 
          value={selectedSubject} 
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="text-xs font-bold text-neon-blue bg-transparent border-none focus:ring-0 p-0 mb-2 uppercase tracking-wider outline-none"
        >
          {KENYAN_CURRICULUM.map(s => <option key={s.id} value={s.id} className="bg-dark-bg">{s.name}</option>)}
        </select>
        <span className="text-4xl font-mono font-black tabular-nums text-white">{formatTime(seconds)}</span>
      </div>
      <div className="flex gap-3">
        {!isActive ? (
          <button onClick={() => setIsActive(true)} className="p-4 bg-neon-blue/20 text-neon-blue rounded-xl hover:bg-neon-blue/40 transition-colors border border-neon-blue/50">
            <Play size={24} fill="currentColor" />
          </button>
        ) : (
          <button onClick={() => setIsActive(false)} className="p-4 bg-neon-purple/20 text-neon-purple rounded-xl hover:bg-neon-purple/40 transition-colors border border-neon-purple/50">
            <Pause size={24} fill="currentColor" />
          </button>
        )}
        <button onClick={handleStop} className="p-4 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/40 transition-colors border border-red-500/50">
          <RotateCcw size={24} />
        </button>
      </div>
    </div>
  );
}

// --- Subjects Section ---

function SubjectsSection({ userProfile }: { userProfile: any }) {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const filteredSubjects = useMemo(() => {
    return KENYAN_CURRICULUM.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.topics.some(t => t.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black text-gradient uppercase tracking-widest mb-2">Kenyan Curriculum</h1>
        <p className="text-text-muted text-lg">Explore all topics from Form 1 to Form 4.</p>
      </header>

      <div className="relative max-w-2xl mx-auto mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
        <input 
          type="text" 
          placeholder="Search for subjects or topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-2xl pl-12 pr-6 py-4 text-white font-medium outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredSubjects.map((sub, i) => (
          <button 
            key={sub.id}
            onClick={() => setSelectedSubject(sub)}
            className={`glass-card ${i % 2 === 0 ? 'card-blue' : 'card-purple'} p-6 rounded-2xl text-left group`}
          >
            <div className={`p-4 rounded-2xl mb-4 w-fit transition-colors bg-white/5 ${i % 2 === 0 ? 'text-neon-blue' : 'text-neon-purple'}`}>
              {sub.icon === 'Calculator' && <Calculator size={32} />}
              {sub.icon === 'Dna' && <Dna size={32} />}
              {sub.icon === 'Zap' && <Zap size={32} />}
              {sub.icon === 'FlaskConical' && <FlaskConical size={32} />}
            </div>
            <h4 className="text-xl font-bold text-white uppercase tracking-wider mb-2">{sub.name}</h4>
            <p className="text-sm text-text-muted">{sub.topics.length} Topics</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedSubject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSubject(null)}
          >
            <div 
              className="glass-card card-blue w-full max-w-2xl max-h-[80vh] rounded-3xl flex flex-col border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider">{selectedSubject.name}</h3>
                  <p className="text-text-muted">Form 1 - Form 4 Syllabus</p>
                </div>
                <button onClick={() => setSelectedSubject(null)} className="p-2 text-text-muted hover:text-white transition-colors">
                  <AlertCircle className="rotate-45" size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                {[1, 2, 3, 4].map(form => (
                  <div key={form} className="mb-8 last:mb-0">
                    <h5 className="text-xs font-black text-neon-blue uppercase tracking-widest mb-4">Form {form}</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedSubject.topics.filter(t => t.form === form).map(topic => (
                        <div key={topic.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group border border-transparent hover:border-white/10">
                          <span className="font-bold text-gray-300">{topic.name}</span>
                          <ChevronRight size={16} className="text-text-muted group-hover:text-neon-blue transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Tutor Section ---

function Tutor({ user }: { user: User }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput(''); // Clear input when starting to listen
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Remove markdown characters for better speech
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = { role: 'user', content: input, image };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setIsTyping(true);

    try {
      const response = await askSomoAI(input, image?.split(',')[1]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speakText(response);
    } catch (error) {
      console.error(error);
      const errorMsg = "Wueh! Mtandao inasumbua kidogo. Try again!";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col glass-card card-blue rounded-3xl"
    >
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-neon-blue/20 p-3 rounded-xl border border-neon-blue/30">
            <MessageSquare size={24} className="text-neon-blue" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white uppercase tracking-wider">SomoAI Tutor</h3>
            <p className="text-xs text-neon-blue font-bold tracking-widest">ONLINE & READY</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (voiceEnabled) window.speechSynthesis.cancel();
          }}
          className={cn(
            "p-3 rounded-xl transition-colors border",
            voiceEnabled 
              ? "bg-neon-blue/20 text-neon-blue border-neon-blue/50" 
              : "bg-white/5 text-text-muted border-white/10"
          )}
          title={voiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="orb mb-8 scale-75"></div>
            <h4 className="text-2xl font-bold mb-2 text-white">Sasa! Niulize swali yoyote...</h4>
            <p className="text-text-muted max-w-md">
              Whether it's Biology, Maths, or Physics, I'm here to help. You can type, send a photo, or use your voice!
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-5 rounded-2xl border",
              msg.role === 'user' 
                ? "bg-neon-blue/10 border-neon-blue/30 text-white rounded-tr-sm" 
                : "bg-white/5 border-white/10 text-gray-200 rounded-tl-sm"
            )}>
              {msg.image && <img src={msg.image} className="rounded-xl mb-4 max-w-full h-auto border border-white/10" alt="Uploaded" />}
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-sm flex gap-2">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-neon-blue rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-neon-blue rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-neon-blue rounded-full" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-black/20">
        {image && (
          <div className="mb-4 relative inline-block">
            <img src={image} className="w-20 h-20 object-cover rounded-xl border-2 border-neon-blue" alt="Preview" />
            <button 
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
            >
              <AlertCircle size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer p-4 text-text-muted hover:text-neon-blue transition-colors bg-white/5 border border-white/10 rounded-xl hover:border-neon-blue/50">
            <Camera size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          
          <button 
            onClick={toggleListening}
            className={cn(
              "p-4 rounded-xl transition-colors border",
              isListening 
                ? "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse" 
                : "bg-white/5 text-text-muted border-white/10 hover:text-neon-blue hover:border-neon-blue/50"
            )}
            title="Voice Input"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Uliza swali... (e.g. Explain Photosynthesis)"}
            className="flex-1 bg-white/5 border border-white/10 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-xl px-4 py-4 text-white font-medium outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="bg-neon-blue/20 text-neon-blue border border-neon-blue/50 p-4 rounded-xl hover:bg-neon-blue/40 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Quiz Section ---

function Quiz({ user }: { user: User }) {
  const [quiz, setQuiz] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const startQuiz = async (subject: string, topic: string) => {
    setLoading(true);
    try {
      const data = await generateQuiz(subject, topic);
      setQuiz(data);
      setCurrentIdx(0);
      setScore(0);
      setShowResult(false);
      setSelectedOption(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    setSelectedOption(idx);
    if (idx === quiz[currentIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentIdx + 1 < quiz.length) {
        setCurrentIdx(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
        saveResult();
      }
    }, 1000);
  };

  const saveResult = async () => {
    try {
      await addDoc(collection(db, 'mock_tests'), {
        userId: user.uid,
        subject: 'Mathematics',
        topic: 'Algebra',
        score: score + (selectedOption === quiz[currentIdx].correctAnswer ? 1 : 0),
        totalQuestions: quiz.length,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'mock_tests', auth);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 size={48} className="text-neon-purple" />
        </motion.div>
        <p className="mt-4 font-bold text-text-muted">Generating your custom quiz... Hang tight!</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center glass-card card-purple p-10 rounded-3xl"
      >
        <div className="bg-neon-purple/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-neon-purple/30">
          <Trophy size={48} className="text-neon-purple" />
        </div>
        <h3 className="text-3xl font-black mb-2 text-white uppercase tracking-wider">Quiz Complete!</h3>
        <p className="text-text-muted mb-8 font-medium">Mazee, you did great!</p>
        <div className="text-7xl font-black text-neon-purple mb-10 drop-shadow-[0_0_15px_rgba(176,38,255,0.5)]">
          {score}/{quiz.length}
        </div>
        <button 
          onClick={() => setQuiz([])}
          className="w-full bg-neon-purple/20 border border-neon-purple/50 text-neon-purple py-4 rounded-2xl font-bold hover:bg-neon-purple/40 transition-all uppercase tracking-widest"
        >
          Back to Topics
        </button>
      </motion.div>
    );
  }

  if (quiz.length > 0) {
    const q = quiz[currentIdx];
    return (
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-neon-purple">Question {currentIdx + 1} of {quiz.length}</span>
          <div className="h-2 w-48 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / quiz.length) * 100}%` }}
              className="h-full bg-neon-purple"
              style={{ boxShadow: '0 0 10px var(--color-neon-purple)' }}
            />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-white leading-tight">{q.question}</h3>
        <div className="grid grid-cols-1 gap-4">
          {q.options.map((opt: string, i: number) => (
            <button 
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selectedOption !== null}
              className={cn(
                "p-6 rounded-2xl text-left font-bold transition-all border-2",
                selectedOption === null ? "bg-white/5 border-white/10 hover:border-neon-purple hover:bg-neon-purple/10 text-gray-300" :
                i === q.correctAnswer ? "bg-green-500/20 border-green-500 text-green-400" :
                selectedOption === i ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/10 opacity-50 text-gray-500"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center text-sm border border-white/10">{String.fromCharCode(65 + i)}</span>
                <span className="text-lg">{opt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-black text-gradient uppercase tracking-widest mb-2">Mock Tests</h1>
        <p className="text-text-muted text-lg">Test your knowledge and earn those badges!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <TopicCard 
          subject="Mathematics" 
          topic="Algebra" 
          questions={5} 
          onStart={() => startQuiz('Mathematics', 'Algebra')} 
          color="blue"
        />
        <TopicCard 
          subject="Biology" 
          topic="Genetics" 
          questions={5} 
          onStart={() => startQuiz('Biology', 'Genetics')} 
          color="purple"
        />
        <TopicCard 
          subject="Physics" 
          topic="Electricity" 
          questions={5} 
          onStart={() => startQuiz('Physics', 'Electricity')} 
          color="blue"
        />
      </div>
    </div>
  );
}

function TopicCard({ subject, topic, questions, onStart, color }: { subject: string, topic: string, questions: number, onStart: () => void, color: 'blue' | 'purple' }) {
  const neonColor = color === 'blue' ? 'text-neon-blue' : 'text-neon-purple';
  return (
    <div className={`glass-card card-${color} p-8 rounded-3xl group`}>
      <p className={`text-xs font-black ${neonColor} uppercase tracking-widest mb-3`}>{subject}</p>
      <h4 className="text-2xl font-bold mb-6 text-white">{topic}</h4>
      <div className="flex items-center gap-2 text-text-muted text-sm mb-8">
        <BookOpen size={18} />
        {questions} Questions
      </div>
      <button 
        onClick={onStart}
        className={`w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold hover:bg-${color === 'blue' ? 'neon-blue' : 'neon-purple'}/20 hover:border-${color === 'blue' ? 'neon-blue' : 'neon-purple'}/50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider`}
      >
        Start Quiz
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
