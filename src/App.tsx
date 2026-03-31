import React, { useState, useEffect, useRef } from 'react';
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
  getDocFromServer
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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, handleFirestoreError, OperationType } from './lib/utils';

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
      <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border-2 border-orange-200">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <AlertCircle size={32} />
            <h2 className="text-2xl font-bold">Wueh! Something went wrong.</h2>
          </div>
          <p className="text-gray-600 mb-6">
            It seems like we hit a snag with the database. Don't worry, Kaka Somo is on it!
          </p>
          <div className="bg-gray-100 p-4 rounded-xl text-xs font-mono overflow-auto max-h-40 mb-6">
            {JSON.stringify(info, null, 2)}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tutor' | 'quiz'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Test connection
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (e) {}

        // Fetch or create profile
        const userRef = doc(db, 'users', u.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const newProfile = {
              uid: u.uid,
              displayName: u.displayName,
              email: u.email,
              subjects: ['Mathematics', 'Biology'],
              retentionScore: 75,
              lastActive: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(snap.data());
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`, auth);
        }
      }
      setIsAuthReady(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={48} className="text-orange-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <div className="bg-orange-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            <Brain size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">SomoAI</h1>
          <p className="text-xl text-gray-600 mb-8 font-medium">
            Sasa! Your friendly STEM tutor for high school. 
            English, Swahili, and Sheng—tunaelewa kila kitu! 🇰🇪
          </p>
          <button 
            onClick={signInWithGoogle}
            className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold shadow-xl border-2 border-gray-100 flex items-center gap-3 mx-auto hover:bg-gray-50 transition-all active:scale-95"
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
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        <nav className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl">
              <Brain size={24} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">SomoAI</span>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
            />
            <NavButton 
              active={activeTab === 'tutor'} 
              onClick={() => setActiveTab('tutor')} 
              icon={<MessageSquare size={20} />} 
              label="AI Tutor" 
            />
            <NavButton 
              active={activeTab === 'quiz'} 
              onClick={() => setActiveTab('quiz')} 
              icon={<Trophy size={20} />} 
              label="Mock Tests" 
            />
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-orange-200" alt="Avatar" />
              <div className="overflow-hidden">
                <p className="font-bold truncate text-sm">{user.displayName}</p>
                <p className="text-xs text-gray-500">Student</p>
              </div>
            </div>
            <button 
              onClick={logOut}
              className="w-full flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <Dashboard userProfile={userProfile} />}
            {activeTab === 'tutor' && <Tutor user={user} />}
            {activeTab === 'quiz' && <Quiz user={user} />}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
        active ? "bg-orange-500 text-white shadow-lg shadow-orange-100" : "text-gray-500 hover:bg-gray-100"
      )}
    >
      {icon}
      {label}
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
      className="max-w-5xl mx-auto space-y-8"
    >
      <header>
        <h2 className="text-4xl font-black text-gray-900 mb-2">Sasa, {userProfile?.displayName?.split(' ')[0]}! 👋</h2>
        <p className="text-gray-500 font-medium">Ready to smash those STEM goals today?</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Brain className="text-purple-500" />} 
          label="Retention Score" 
          value={`${userProfile?.retentionScore || 0}%`} 
          color="bg-purple-50" 
        />
        <StatCard 
          icon={<Calendar className="text-blue-500" />} 
          label="Study Streak" 
          value="5 Days" 
          color="bg-blue-50" 
        />
        <StatCard 
          icon={<Trophy className="text-orange-500" />} 
          label="Quizzes Done" 
          value="12" 
          color="bg-orange-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BookOpen size={20} className="text-orange-500" />
            Curated Timetable
          </h3>
          <div className="space-y-4">
            <TimetableItem time="08:00 AM" subject="Mathematics" topic="Quadratic Equations" done={true} />
            <TimetableItem time="10:30 AM" subject="Biology" topic="Cell Structure" done={false} />
            <TimetableItem time="02:00 PM" subject="Physics" topic="Newton's Laws" done={false} />
          </div>
        </div>

        <div className="bg-orange-500 p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">Pro-Hack of the Day! 💡</h3>
            <p className="text-orange-50 opacity-90 leading-relaxed mb-6">
              "Did you know that the same logic used to calculate market prices (Supply & Demand) 
              is just like Algebra? If you know the price of one chapo, you can find the price of 10!"
            </p>
            <button className="bg-white text-orange-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors">
              Learn More
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-20">
            <Brain size={200} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className={cn("p-6 rounded-3xl flex items-center gap-4", color)}>
      <div className="bg-white p-3 rounded-2xl shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TimetableItem({ time, subject, topic, done }: { time: string, subject: string, topic: string, done: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
      <div className="text-xs font-bold text-gray-400 w-20">{time}</div>
      <div className="flex-1">
        <p className="font-bold text-gray-900">{subject}</p>
        <p className="text-sm text-gray-500">{topic}</p>
      </div>
      {done ? <CheckCircle2 className="text-green-500" /> : <ChevronRight className="text-gray-300" />}
    </div>
  );
}

// --- Tutor Section ---

function Tutor({ user }: { user: User }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() && !image) return;

    const userMsg = { role: 'user', content: input, image };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setIsTyping(true);

    try {
      const response = await askSomoAI(input, image?.split(',')[1]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Wueh! Mtandao inasumbua kidogo. Try again!" }]);
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
      className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100"
    >
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold">Chat with SomoAI</h3>
            <p className="text-xs text-green-500 font-bold">Online & Ready</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="bg-orange-50 p-6 rounded-full mb-4">
              <Brain size={48} className="text-orange-500" />
            </div>
            <h4 className="text-xl font-bold mb-2">Sasa! Niulize swali yoyote...</h4>
            <p className="text-gray-500 max-w-xs">
              Whether it's Biology, Maths, or Physics, I'm here to help. You can even send a photo of your assignment!
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl",
              msg.role === 'user' ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-800"
            )}>
              {msg.image && <img src={msg.image} className="rounded-xl mb-3 max-w-full h-auto" alt="Uploaded" />}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl flex gap-1">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-gray-400 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100">
        {image && (
          <div className="mb-4 relative inline-block">
            <img src={image} className="w-20 h-20 object-cover rounded-xl border-2 border-orange-500" alt="Preview" />
            <button 
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
            >
              <AlertCircle size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="cursor-pointer p-3 text-gray-400 hover:text-orange-500 transition-colors bg-gray-50 rounded-xl">
            <Camera size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Uliza swali... (e.g. Explain Photosynthesis)"
            className="flex-1 bg-gray-50 border-none focus:ring-2 focus:ring-orange-500 rounded-xl px-4 py-3 font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="bg-orange-500 text-white p-3 rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
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
        subject: 'Mathematics', // Example
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
          <Loader2 size={48} className="text-orange-500" />
        </motion.div>
        <p className="mt-4 font-bold text-gray-500">Generating your custom quiz... Hang tight!</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={40} className="text-orange-500" />
        </div>
        <h3 className="text-3xl font-black mb-2">Quiz Complete!</h3>
        <p className="text-gray-500 mb-8 font-medium">Mazee, you did great!</p>
        <div className="text-6xl font-black text-orange-500 mb-8">
          {score}/{quiz.length}
        </div>
        <button 
          onClick={() => setQuiz([])}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all"
        >
          Back to Topics
        </button>
      </motion.div>
    );
  }

  if (quiz.length > 0) {
    const q = quiz[currentIdx];
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">Question {currentIdx + 1} of {quiz.length}</span>
          <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + 1) / quiz.length) * 100}%` }}
              className="h-full bg-orange-500"
            />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">{q.question}</h3>
        <div className="grid grid-cols-1 gap-4">
          {q.options.map((opt: string, i: number) => (
            <button 
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selectedOption !== null}
              className={cn(
                "p-6 rounded-2xl text-left font-bold transition-all border-2",
                selectedOption === null ? "bg-white border-gray-100 hover:border-orange-500 hover:shadow-lg" :
                i === q.correctAnswer ? "bg-green-50 border-green-500 text-green-700" :
                selectedOption === i ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-gray-100 opacity-50"
              )}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm">{String.fromCharCode(65 + i)}</span>
                {opt}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-black text-gray-900 mb-2">Mock Tests 🏆</h2>
        <p className="text-gray-500 font-medium">Test your knowledge and earn those badges!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TopicCard 
          subject="Mathematics" 
          topic="Algebra" 
          questions={5} 
          onStart={() => startQuiz('Mathematics', 'Algebra')} 
        />
        <TopicCard 
          subject="Biology" 
          topic="Genetics" 
          questions={5} 
          onStart={() => startQuiz('Biology', 'Genetics')} 
        />
        <TopicCard 
          subject="Physics" 
          topic="Electricity" 
          questions={5} 
          onStart={() => startQuiz('Physics', 'Electricity')} 
        />
      </div>
    </div>
  );
}

function TopicCard({ subject, topic, questions, onStart }: { subject: string, topic: string, questions: number, onStart: () => void }) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
      <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">{subject}</p>
      <h4 className="text-2xl font-bold mb-4">{topic}</h4>
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-8">
        <BookOpen size={16} />
        {questions} Questions
      </div>
      <button 
        onClick={onStart}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold group-hover:bg-orange-500 transition-colors flex items-center justify-center gap-2"
      >
        Start Quiz
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
