import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Copy, Lightbulb, Check, GraduationCap, Briefcase, ChevronRight, Wand2, HelpCircle, BookOpen, Bot, Brain, Zap, ExternalLink, Bookmark, Save, Trash2, Folder, Layout, Edit3, X, Play, RefreshCw, Cloud, Smartphone, User, LogOut, Lock, KeyRound } from 'lucide-react';
import { FormData, GeneratedResult, SavedPrompt, UserInfo } from './types';
import { generateOptimizedPrompt } from './services/geminiService';
import { supabase } from './supabaseClient'; // Supabase Client 추가

const TASK_TEMPLATES: Record<string, { label: string, text: string }[]> = {
  NATIONAL_PROJECT: [
    { label: '📝 RISE 계획서 요약', text: '작성 목적: RISE 사업계획서 요약본 작성\n우리 대학 강점: 반도체 특화 커리큘럼, 지역 산업체 50곳 협약\n요청: 심사위원에게 우리 대학이 지역 혁신의 거점임을 강조하는 서론을 써줘.' },
    { label: '📊 성과 지표 보고', text: '데이터: 취업률 85%, 특허 출원 12건, 산학 프로젝트 30건\n목표: 위 성과를 바탕으로 대학혁신지원사업의 성공적인 운영 결과를 증명하는 보고서 문단을 작성해줘.' },
    { label: '💡 아이디어 제안', text: '제안 배경: 지산학 협력 강화 필요성 증대\n핵심 아이디어: 캠퍼스 유휴 공간을 활용한 "오픈 이노베이션 랩(Open Lab)" 및 스타트업 입주 공간 조성\n요청: 이 아이디어를 바탕으로 글로컬 대학 사업의 "대학-지역 산업체 상생 모델" 기획서 초안(필요성 및 기대효과)을 잡아줘.' },
  ],
  GENERAL_ADMIN: [
    { label: '📢 행사 안내 공문', text: '행사명: 2024년도 교직원 역량 강화 워크숍\n일시/장소: 11월 15일(금), 대학 본관 대회의실\n대상: 전체 행정직원 (필수 참석)\n요청: 참석을 정중하게 독려하는 공식 공문 본문을 작성해줘.' },
    { label: '📝 회의록 요약', text: '회의 안건: 학사 구조 개편(안)\n주요 의견: 기획처장은 학과 통폐합 찬성, 단과대학장은 학생 반발 우려로 반대.\n결론: TF팀을 구성하여 재논의하기로 함.\n요청: 핵심 쟁점과 향후 계획을 요약한 보고용 회의록을 써줘.' },
    { label: '📑 보고서 요약', text: '자료: 2024학년도 상반기 부서별 업무 추진 실적 (총 50페이지)\n수신자: 기획처장 및 총장\n요청: 세부 실적 나열은 지양하고, "주요 성과 Best 3"와 "하반기 중점 추진 과제" 위주로 1페이지 분량의 요약 보고서(Executive Summary)를 작성해줘.' },
  ],
  ACADEMIC_RESEARCH: [
    { label: '🎓 강의계획서 초안', text: '과목명: 인공지능과 윤리\n수강 대상: 인문사회계열 1학년 신입생\n수업 목표: AI 기술의 딜레마를 이해하고 토론 능력 배양\n요청: 학생들의 흥미를 끌 수 있는 15주차 강의 커리큘럼과 주차별 토론 주제를 제안해줘.' },
    { label: '🔬 연구 초록 정제', text: '연구 주제: 대학생의 SNS 사용 시간이 학업 몰입도에 미치는 영향\n연구 결과: 하루 3시간 이상 사용 시 몰입도 유의미하게 저하됨\n요청: 학술지 투고를 위해 논리적이고 학술적인 문체로 국문 초록(Abstract)을 다듬어줘.' },
    { label: '💡 연구 제안서', text: '연구 주제: AI 기반의 개인 맞춤형 학습 시스템 개발\n필요성: 획일화된 교육의 한계 극복 및 학습 효율 증대\n요청: 한국연구재단 신진연구자 지원사업에 지원할 연구 제안서의 "연구의 필요성 및 독창성" 파트를 설득력 있게 작성해줘.' },
  ],
  ADMISSION_PR: [
    { label: '📱 인스타 카드뉴스', text: '주제: 신입생 전원 최신 노트북 지급 혜택 홍보\n타겟: 고3 수험생 및 학부모\n강조점: 조건 없이 100% 지급\n요청: 클릭을 유도할 수 있는 카드뉴스 문구 5장 분량(표지 포함)을 트렌디하게 써줘.' },
    { label: '🎬 유튜브 숏츠 대본', text: '영상 컨셉: 우리 대학 벚꽃 명소 소개 브이로그\n타겟: 20대 예비 대학생\n분량: 30초\n요청: 밝고 에너지가 넘치는 내레이션 대본을 작성해줘. 이모지도 넣어줘.' },
    { label: '📑 홍보 성과 보고', text: '행사: 2025 수시 박람회\n성과: 상담 건수 작년 대비 150% 증가, 입시 가이드북 2000부 배포 완료\n요청: 총장님께 보고할 박람회 운영 결과 보고서의 요약본(Key Takeaways)을 작성해줘.' },
  ]
};

// Helper to extract variables {varName} from text
const extractVariables = (text: string): string[] => {
  const regex = /\{([^}]+)\}/g;
  const matches = [...text.matchAll(regex)];
  // Return unique variable names
  return [...new Set(matches.map(m => m[1]))];
};

const App: React.FC = () => {
  // Tabs: 'generate' | 'library'
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');

  // User Auth State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // Login Form State including Password
  const [loginForm, setLoginForm] = useState({ name: '', email: '', password: '' });
  const [isCheckingUser, setIsCheckingUser] = useState(false); 
  
  // Pending Action State (For performing actions after login)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Generator State
  const [formData, setFormData] = useState<FormData>({
    role: 'PROFESSOR',
    task: 'ACADEMIC_RESEARCH',
    context: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Library State (Supabase)
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  
  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCategory, setSaveCategory] = useState('기타');
  const [saveContent, setSaveContent] = useState(''); // To edit prompt before saving
  const [isInputMode, setIsInputMode] = useState(false); // Toggle between Select and Input for category

  // Variable Filling State
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Check API Key existence (for UX only)
  const hasApiKey = !!process.env.API_KEY;

  // --- Supabase Logic ---

  // 1. Fetch Prompts (Read) - User Specific
  const fetchPrompts = async (email?: string) => {
    const targetEmail = email || userInfo?.email;
    if (!targetEmail) return;

    setIsLibraryLoading(true);
    
    // Select prompts where user_email matches
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_email', targetEmail) 
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed (or not configured), using localStorage:', error.message);
      // Fallback: Use LocalStorage with email filtering
      const local = localStorage.getItem('uniPromptLibrary');
      if (local) {
        const allLocalPrompts: SavedPrompt[] = JSON.parse(local);
        const myPrompts = allLocalPrompts.filter(p => p.user_email === targetEmail);
        setSavedPrompts(myPrompts);
      } else {
        setSavedPrompts([]);
      }
    } else {
      setSavedPrompts(data || []);
    }
    setIsLibraryLoading(false);
  };

  // --- Auth Logic (Updated for Encryption) ---
  useEffect(() => {
    // Check local storage for user info on load
    const storedUser = localStorage.getItem('uniPromptUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserInfo(parsedUser);
      fetchPrompts(parsedUser.email);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsCheckingUser(true);

    try {
      // 1. Check if user exists (only by email) to decide Login vs Signup flow
      // We don't fetch the password here anymore for security
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', loginForm.email)
        .maybeSingle();

      if (checkError && checkError.message.includes("Supabase not configured")) {
         throw checkError;
      }

      if (existingUsers) {
        // --- EXISTING USER: LOGIN (Secure RPC) ---
        // Call the 'login_user' RPC function in Supabase
        const { data: user, error } = await supabase.rpc('login_user', {
          check_email: loginForm.email,
          check_password: loginForm.password
        });

        if (error || !user || user.length === 0) {
          alert("비밀번호가 일치하지 않습니다.\n(또는 암호화되지 않은 구버전 계정일 수 있습니다)");
          setIsCheckingUser(false);
          return;
        }

        // Login Success
        const loggedUser = user[0] as UserInfo; // RPC returns array
        completeLogin(loggedUser);
        alert(`${loggedUser.name}님, 환영합니다!`);

      } else {
        // --- NEW USER: SIGNUP (Secure RPC) ---
        if (!loginForm.name.trim()) {
          alert("신규 가입을 위해 이름을 입력해주세요.");
          setIsCheckingUser(false);
          return;
        }

        // Call the 'register_user' RPC function
        const { error: insertError } = await supabase.rpc('register_user', {
            new_email: loginForm.email,
            new_name: loginForm.name,
            new_password: loginForm.password
        });

        if (insertError) {
          console.error("Signup failed:", insertError);
          alert("회원가입 중 오류가 발생했습니다. (SQL 설정인 'register_user' 함수가 있는지 확인해주세요)");
          setIsCheckingUser(false);
          return;
        }

        const loggedUser = { name: loginForm.name, email: loginForm.email };
        completeLogin(loggedUser);
        alert(`환영합니다, ${loginForm.name}님! 안전하게 암호화되어 가입되었습니다.`);
      }

    } catch (err: any) {
      console.warn("Auth process fallback (Supabase offline/error)", err);
      const loggedUser = { name: loginForm.name, email: loginForm.email };
      completeLogin(loggedUser);
      alert("오프라인 모드(로컬)로 로그인되었습니다. (서버 연결 실패)");
    } finally {
       setIsCheckingUser(false);
    }
  };

  const completeLogin = (user: UserInfo) => {
    setUserInfo(user);
    localStorage.setItem('uniPromptUser', JSON.stringify(user));
    setIsLoginModalOpen(false);
    fetchPrompts(user.email);
    
    if (pendingAction) {
        pendingAction();
        setPendingAction(null);
    }
  };

  const handleLogout = () => {
    if(confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem('uniPromptUser');
      setUserInfo(null);
      setSavedPrompts([]);
      setLoginForm({ name: '', email: '', password: '' });
      setActiveTab('generate');
    }
  };

  const requireAuth = (callback: () => void) => {
    if (userInfo) {
      callback();
    } else {
      setPendingAction(() => callback);
      setIsLoginModalOpen(true);
    }
  };

  // Trigger fetch when tab changes to library
  useEffect(() => {
    if (activeTab === 'library' && userInfo) {
      fetchPrompts();
    }
  }, [activeTab, userInfo]);

  // --- Derived Data for Categories ---
  const categories = useMemo(() => {
    const cats = new Set(savedPrompts.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [savedPrompts]);

  // --- Generator Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyTemplate = (templateText: string) => {
    setFormData(prev => ({ ...prev, context: templateText }));
  };

  const handleGenerate = async () => {
    if (!formData.context.trim()) {
      alert("상황 설명을 입력해주세요!");
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const data = await generateOptimizedPrompt(formData.role, formData.task, formData.context);
      setResult(data);
    } catch (error) {
      console.error("Error generating prompt", error);
      alert("생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = (url: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open(url, '_blank');
  };

  // --- Library & Save Handlers ---
  const openSaveModal = () => {
    requireAuth(() => {
      if (!result) return;
      setSaveTitle('');
      
      // Smart Logic: If we have existing folders, default to select mode and pick the first one
      const existingCats = categories.filter(c => c !== 'All');
      if (existingCats.length > 0) {
        setSaveCategory(existingCats[0]);
        setIsInputMode(false);
      } else {
        setSaveCategory('일반');
        setIsInputMode(true);
      }
      
      setSaveContent(result.prompt);
      setIsSaveModalOpen(true);
    });
  };

  const handleSavePrompt = async () => {
    if (!saveTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!saveCategory.trim()) {
      alert("폴더(카테고리) 이름을 입력해주세요.");
      return;
    }
    if (!userInfo) return;

    const vars = extractVariables(saveContent);
    const tempId = crypto.randomUUID();
    
    // Data structure including user info
    const promptPayload = {
      title: saveTitle,
      category: saveCategory,
      content: saveContent,
      variables: vars,
      user_email: userInfo.email,
      user_name: userInfo.name,
    };
    
    const newPrompt: SavedPrompt = {
      ...promptPayload,
      id: tempId,
      created_at: new Date().toISOString()
    };

    // Optimistic UI Update
    setSavedPrompts(prev => [newPrompt, ...prev]);
    setIsSaveModalOpen(false);

    // Write to Supabase
    const { error } = await supabase
      .from('prompts')
      .insert([promptPayload]);

    if (error) {
      console.warn('Supabase save failed, falling back to LocalStorage:', error.message);
      
      // LocalStorage Fallback (Append to global array)
      const currentLocal = JSON.parse(localStorage.getItem('uniPromptLibrary') || '[]');
      const updatedLocal = [newPrompt, ...currentLocal];
      localStorage.setItem('uniPromptLibrary', JSON.stringify(updatedLocal));
      
      alert(`'${userInfo.name}'님의 로컬 저장소에 저장되었습니다. (클라우드 연동 필요)`);
    } else {
      fetchPrompts(); // Refresh IDs
      alert("나의 라이브러리에 안전하게 저장되었습니다!");
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      setSavedPrompts(prev => prev.filter(p => p.id !== id));

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase delete failed, falling back to LocalStorage');
        const currentLocal = JSON.parse(localStorage.getItem('uniPromptLibrary') || '[]');
        const updatedLocal = currentLocal.filter((p: any) => p.id !== id);
        localStorage.setItem('uniPromptLibrary', JSON.stringify(updatedLocal));
      }
    }
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [varName]: value }));
  };

  const getFilledContent = (prompt: SavedPrompt) => {
    let content = prompt.content;
    if (prompt.variables) {
        prompt.variables.forEach(v => {
        const val = variableValues[`${prompt.id}-${v}`] || `{${v}}`;
        content = content.replace(new RegExp(`\\{${v}\\}`, 'g'), val);
        });
    }
    return content;
  };

  const filteredPrompts = useMemo(() => {
    if (selectedCategory === 'All') return savedPrompts;
    return savedPrompts.filter(p => p.category === selectedCategory);
  }, [savedPrompts, selectedCategory]);


  return (
    <div className="min-h-screen bg-mesh py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative font-sans">
      
      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className="glass-card-strong w-full max-w-md p-8 relative shadow-2xl">
            <button 
              onClick={() => {
                setIsLoginModalOpen(false);
                setPendingAction(null); // Cancel pending action on close
              }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <Lock size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">로그인 및 본인 확인</h3>
              <p className="text-slate-500 mt-2 text-sm break-keep">
                개인 라이브러리 보호를 위해<br/>간단한 비밀번호를 설정하여 사용합니다.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                    <User size={14} className="mr-1"/> 이름
                </label>
                <input 
                  type="text" 
                  value={loginForm.name}
                  onChange={e => setLoginForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="예: 김교수 (신규 가입 시 사용)"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                    <Cloud size={14} className="mr-1"/> 이메일
                </label>
                <input 
                  type="email" 
                  value={loginForm.email}
                  onChange={e => setLoginForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="예: prof@univ.ac.kr"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center">
                    <KeyRound size={14} className="mr-1"/> 비밀번호
                </label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={e => setLoginForm(prev => ({...prev, password: e.target.value}))}
                  placeholder="비밀번호 4자리 이상"
                  className="input-premium"
                  autoComplete="current-password"
                />
                <p className="text-xs text-slate-400 mt-1">
                  * 최초 입력 시 자동으로 안전하게 암호화되어 가입됩니다.
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={isCheckingUser}
                className="btn-gradient w-full mt-4"
              >
                {isCheckingUser ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                        확인 중...
                    </>
                ) : (
                    "시작하기 (로그인/가입)"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 m-auto">
            <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                <Cloud className="mr-2" size={20} /> 라이브러리에 저장
              </h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">제목</label>
                  <input 
                    type="text" 
                    value={saveTitle} 
                    onChange={e => setSaveTitle(e.target.value)}
                    placeholder="예: 1학기 강의계획서 템플릿"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">폴더 (카테고리)</label>
                  {/* Category Selection UI: Toggle between Select and Input */}
                  {!isInputMode && categories.filter(c => c !== 'All').length > 0 ? (
                    <div className="relative w-full">
                      <select 
                        value={saveCategory} 
                        onChange={(e) => {
                            if (e.target.value === '___NEW___') {
                                setIsInputMode(true);
                                setSaveCategory(''); // Clear for new input
                            } else {
                                setSaveCategory(e.target.value);
                            }
                        }}
                        className="input-premium appearance-none cursor-pointer bg-slate-50"
                      >
                        {categories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                        <option value="___NEW___" className="font-bold text-indigo-600 bg-indigo-50">+ 새 폴더 만들기 (직접 입력)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                        <ChevronRight className="rotate-90 w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={saveCategory} 
                            onChange={e => setSaveCategory(e.target.value)}
                            placeholder="새 폴더 이름 입력"
                            className="input-premium"
                            autoFocus
                        />
                        {categories.filter(c => c !== 'All').length > 0 && (
                            <button 
                                onClick={() => setIsInputMode(false)}
                                className="px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap border border-indigo-200 transition-colors"
                            >
                                목록 선택
                            </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                  프롬프트 내용 편집
                  <span className="text-xs text-indigo-600 font-normal bg-indigo-50 px-2 py-0.5 rounded-full">
                    Tip: 가변적인 부분은 {'{변수명}'}으로 감싸주세요. (예: {'{날짜}'}, {'{과목명}'})
                  </span>
                </label>
                <textarea 
                  value={saveContent}
                  onChange={e => setSaveContent(e.target.value)}
                  className="input-premium min-h-[200px] font-mono text-sm leading-relaxed"
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg mr-2 font-medium transition-colors">
                  취소
                </button>
                <button onClick={handleSavePrompt} className="btn-gradient w-auto px-6">
                  <Save size={18} className="mr-2" /> 저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main App Layout */}
      {/* Header */}
      <header className="mb-6 md:mb-8 text-center px-2 relative">
        {userInfo && (
          <div className="absolute top-0 right-0 hidden md:flex items-center space-x-2 animate-fadeIn">
            <span className="text-sm text-slate-600 font-medium bg-white/50 px-3 py-1 rounded-full border border-slate-200">
              👋 안녕하세요, <span className="text-indigo-600 font-bold">{userInfo.name}</span>님
            </span>
            <button 
              onClick={handleLogout} 
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="로그아웃"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
        
        <div className="flex justify-center mb-4">
           <div className="glass-card px-3 py-1 md:px-4 md:py-1.5 rounded-full flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] md:text-xs font-semibold text-indigo-800 tracking-wide uppercase">Official Guide Based Education</span>
          </div>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight text-slate-900 mb-3 break-keep leading-tight">
          Uni-Prompt <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 block sm:inline">Master & Tutor</span>
        </h1>
        <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed break-keep px-2">
          단순한 자동 생성을 넘어, <b className="text-indigo-700">프롬프트 엔지니어링의 원리</b>를 함께 학습합니다.<br className="hidden sm:block"/>
          Google, OpenAI, Anthropic의 공식가이드를 통해 교직원분들의 <b className="text-indigo-700">AI 활용 역량</b>을 강화하세요.
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/60 shadow-sm flex space-x-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'generate' 
              ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <Sparkles size={16} className="mr-2" />
            프롬프트 생성
          </button>
          <button
            onClick={() => {
              requireAuth(() => setActiveTab('library'));
            }}
            className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'library' 
              ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <Cloud size={16} className="mr-2" />
            나의 라이브러리
            {savedPrompts.length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full hidden sm:inline-flex">
                {savedPrompts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start fade-in">
          
          {/* Left Column: Input Panel */}
          <div className="glass-card-strong p-5 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-violet-200 to-transparent rounded-full blur-2xl opacity-50"></div>
            
            <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6 flex items-center">
              <span className="bg-indigo-100 p-2 rounded-lg mr-3 text-indigo-600">
                <Briefcase size={20} />
              </span>
              프롬프트 초안 작성
            </h2>

            {/* API Key Warning for Development */}
            {!hasApiKey && (
              <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Zap className="h-5 w-5 text-amber-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      <b>서비스 배포 준비 중:</b> API Key가 감지되지 않았습니다.<br/>
                      Vercel 배포 시 Environment Variables 설정을 확인하세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">사용자 역할 (Persona)</label>
                <div className="relative">
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleInputChange} 
                    className="input-premium appearance-none cursor-pointer"
                  >
                    <option value="PROFESSOR">교수 (교육/연구)</option>
                    <option value="ADMIN_PLANNING">행정직원 (기획/사업)</option>
                    <option value="ADMIN_AFFAIRS">행정직원 (학사/일반)</option>
                    <option value="EXECUTIVE">경영진 (총장/처장)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                    <ChevronRight className="rotate-90 w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">수행 업무 (Task)</label>
                <div className="relative">
                  <select 
                    name="task" 
                    value={formData.task} 
                    onChange={handleInputChange} 
                    className="input-premium appearance-none cursor-pointer"
                  >
                    <option value="NATIONAL_PROJECT">국고사업 (RISE/대학혁신/글로컬)</option>
                    <option value="GENERAL_ADMIN">일반행정 (공문/보고서)</option>
                    <option value="ACADEMIC_RESEARCH">교무/연구/강의계획</option>
                    <option value="ADMISSION_PR">입시/홍보/마케팅</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                    <ChevronRight className="rotate-90 w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    상황 설명 (Context)
                  </label>
                  <span className="text-xs text-indigo-600 font-medium flex items-center bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Wand2 size={12} className="mr-1" />
                    추천 템플릿
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {TASK_TEMPLATES[formData.task]?.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => applyTemplate(t.text)}
                      className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm transition-all flex items-center"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea 
                  name="context"
                  value={formData.context}
                  onChange={handleInputChange}
                  className="input-premium min-h-[140px] resize-none text-sm leading-relaxed"
                  placeholder={`예시:\n작성 목적: 신규 교양 과목 개설 제안서\n핵심 내용: 기후 변화와 지속 가능성\n요청 사항: 학생들의 흥미를 끌 수 있는 강의명 5개 추천해줘.`}
                />
                
                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-2 text-xs text-slate-600 leading-snug">
                  <HelpCircle size={16} className="shrink-0 mt-0.5 text-indigo-400" />
                  <p>
                    <strong className="text-indigo-600 block mb-0.5">처음이라 막막하신가요?</strong>
                    위의 <b>추천 템플릿 버튼</b>을 눌러보세요. 자동으로 예시가 입력됩니다. 
                    상황(Who, What)과 목표(Goal)만 간단히 적어주셔도 AI 코치가 전문가처럼 다듬어 드립니다.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className="btn-gradient group relative overflow-hidden"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow mr-2"></span>
                    최적화 분석 중...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Sparkles size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                    최적화 및 작성 원리 학습
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Result Panel */}
          <div className={`glass-card p-5 md:p-8 min-h-[500px] flex flex-col relative transition-all duration-500 ${loading ? 'opacity-80 scale-[0.99]' : 'opacity-100 scale-100'}`}>
            
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-70">
                <div className="bg-indigo-50 p-6 rounded-full mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                  <BookOpen size={48} className="text-indigo-500 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">AI 역량 강화를 위한 첫걸음</h3>
                <p className="text-slate-500 max-w-xs leading-relaxed break-keep">
                  왼쪽에서 업무 내용을 입력해보세요.<br/>
                  AI가 <span className="font-semibold text-indigo-600">최적의 프롬프트</span>를 설계하고,<br/>
                  그 속에 숨겨진 <b>작성 논리와 핵심 기법</b>을 하나씩 짚어드립니다.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-semibold text-slate-800 animate-pulse">Official Guide 적용 중...</h3>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p>Gemini 3 is thinking...</p>
                    <p>Applying Persona (Anthropic)...</p>
                    <p>Structuring Data (Google)...</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="fade-in space-y-6">
                
                {/* Result Header & Actions */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <span className="bg-green-100 text-green-700 p-1.5 rounded-md mr-2">
                      <Check size={16} strokeWidth={3} />
                    </span>
                    Optimized Prompt
                  </h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={openSaveModal}
                      className="text-xs flex items-center px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all font-semibold"
                    >
                      <Bookmark size={14} className="mr-1" />
                      Save
                    </button>
                    <button 
                      onClick={() => copyToClipboard(result.prompt)}
                      className={`text-xs flex items-center px-3 py-1.5 rounded-full transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* The Prompt */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[300px] overflow-y-auto">
                  {result.prompt}
                </div>

                {/* Analysis */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 border border-indigo-100 relative overflow-hidden mt-2">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <GraduationCap size={80} />
                  </div>
                  <h4 className="text-base font-bold text-indigo-900 mb-1 flex items-center relative z-10">
                    <GraduationCap size={20} className="mr-2 text-indigo-600" />
                    Prompt Engineering Lesson
                  </h4>
                  <p className="text-xs text-indigo-600 mb-4 ml-7 relative z-10 break-keep">
                    이 프롬프트가 강력한 이유를 분석했습니다.
                  </p>
                  
                  <div className="space-y-3 relative z-10">
                    {result.analysis.map((item, idx) => (
                      <div key={idx} className="flex items-start text-sm">
                        <div className={`mt-1.5 min-w-[6px] h-[6px] rounded-full mr-3 bg-${item.color}-500`}></div>
                        <div>
                          <span className={`badge badge-${item.color}`}>
                            #{item.tag}
                          </span>
                          <span className="text-slate-700 leading-snug block break-keep">
                            {item.content}
                            <span className="text-xs text-slate-400 block mt-1">Source: {item.source} Guide</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start">
                  <Lightbulb className="text-amber-500 shrink-0 mt-0.5 mr-3" size={20} />
                  <div>
                    <h5 className="text-sm font-bold text-amber-800 mb-1">Official Tip</h5>
                    <p className="text-sm text-amber-700 leading-relaxed break-keep">
                      {result.tip}
                    </p>
                  </div>
                </div>

                {/* Simulation Buttons */}
                <div className="border-t border-slate-200 pt-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                    <Zap size={16} className="text-yellow-500 mr-2" fill="currentColor" />
                    ⚡ 모델별로 실행해보기
                  </h4>
                  <p className="text-xs text-slate-500 mb-3 break-keep">
                    아래 버튼을 클릭하면 <b>내용이 자동으로 복사</b>되고 해당 사이트로 이동합니다.<br className="hidden sm:block"/>
                    개인 계정에 로그인된 상태에서 바로 붙여넣기(Ctrl+V) 하세요.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleOpenExternal('https://gemini.google.com/app', result.prompt)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-100 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                        <Sparkles size={20} className="mb-2 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-indigo-900">Gemini</span>
                    </button>

                    <button 
                      onClick={() => handleOpenExternal('https://chatgpt.com', result.prompt)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all group"
                    >
                        <Bot size={20} className="mb-2 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-emerald-900">ChatGPT</span>
                    </button>

                    <button 
                      onClick={() => handleOpenExternal('https://claude.ai/new', result.prompt)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 hover:shadow-md transition-all group"
                    >
                        <Brain size={20} className="mb-2 text-orange-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-orange-900">Claude</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      ) : (
        /* Library Tab Content */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 fade-in h-full items-start">
          
          {/* Sidebar: Categories */}
          <div className="glass-card p-4 md:col-span-1">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-2 flex justify-between items-center">
              Folders
              <button 
                onClick={() => fetchPrompts()} 
                disabled={isLibraryLoading}
                className="text-indigo-500 hover:bg-indigo-50 p-1 rounded-full transition-colors"
                title="새로고침"
              >
                <RefreshCw size={14} className={isLibraryLoading ? "animate-spin" : ""} />
              </button>
            </h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                    selectedCategory === cat 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Folder size={16} className={`mr-2 ${selectedCategory === cat ? 'fill-indigo-300' : ''}`} />
                  {cat}
                  {cat === 'All' && <span className="ml-auto text-xs opacity-60">{savedPrompts.length}</span>}
                </button>
              ))}
            </div>
            {/* User Info Card in Sidebar */}
            {userInfo && (
                <div className="mt-8 text-center p-4 bg-indigo-50/50 rounded-lg border border-indigo-50">
                    <div className="flex justify-center mb-2 text-indigo-300">
                        <User size={24} />
                    </div>
                    <p className="text-xs font-bold text-indigo-800">{userInfo.name}님</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-1 truncate">
                        {userInfo.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">
                        {isLibraryLoading ? '동기화 중...' : '개인 라이브러리 사용 중'}
                    </p>
                </div>
            )}
          </div>

          {/* Main List */}
          <div className="md:col-span-3 space-y-4">
            {isLibraryLoading ? (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                    <p>라이브러리 동기화 중...</p>
                </div>
            ) : filteredPrompts.length === 0 ? (
                <div className="glass-card p-10 text-center text-slate-400">
                    <Cloud className="mx-auto mb-3 opacity-50" size={48} />
                    <p>
                      {userInfo ? `${userInfo.name}님의 저장된 프롬프트가 없습니다.` : "저장된 프롬프트가 없습니다."}
                    </p>
                    <button onClick={() => setActiveTab('generate')} className="text-indigo-600 hover:underline mt-2 text-sm">
                        생성하러 가기
                    </button>
                </div>
            ) : (
                filteredPrompts.map(prompt => (
                <div key={prompt.id} className="glass-card p-6 transition-all hover:shadow-lg group">
                    <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {prompt.category}
                        </span>
                        {/* created_at format handling */}
                        <span className="text-xs text-slate-400">
                            {prompt.created_at ? new Date(prompt.created_at).toLocaleDateString() : 'Local Draft'}
                        </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{prompt.title}</h3>
                    </div>
                    <button 
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="삭제"
                    >
                        <Trash2 size={16} />
                    </button>
                    </div>

                    {/* Variable Input Form (if variables exist) */}
                    {prompt.variables && prompt.variables.length > 0 && (
                    <div className="mb-4 bg-yellow-50/50 border border-yellow-100 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-yellow-700 mb-2 flex items-center">
                        <Edit3 size={12} className="mr-1" />
                        변수 입력 ({prompt.variables.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {prompt.variables.map(v => (
                            <div key={v}>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{v}</label>
                            <input 
                                type="text" 
                                placeholder={`{${v}} 값 입력`}
                                value={variableValues[`${prompt.id}-${v}`] || ''}
                                onChange={(e) => handleVariableChange(`${prompt.id}-${v}`, e.target.value)}
                                className="input-premium py-1.5 text-sm"
                            />
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* Content Preview */}
                    <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap border border-slate-200 mb-4 max-h-[200px] overflow-y-auto group-hover:bg-white transition-colors">
                    {getFilledContent(prompt)}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-2 border-t border-slate-100">
                    <button 
                        onClick={() => copyToClipboard(getFilledContent(prompt))}
                        className="flex-1 btn-gradient py-2 text-sm flex items-center justify-center"
                    >
                        <Copy size={16} className="mr-2" />
                        {copied ? '복사됨!' : '완성본 복사'}
                    </button>
                    <button 
                        onClick={() => handleOpenExternal('https://gemini.google.com/app', getFilledContent(prompt))}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold flex items-center"
                    >
                        <ExternalLink size={16} className="mr-1" /> Gemini 열기
                    </button>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
