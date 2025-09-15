

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Chat } from '@google/genai';
import PocketBase, { ClientResponseError } from 'pocketbase';

// --- PocketBase 설정 ---
// 🚀 여기에 Railway에서 만든 나만의 PocketBase 서버 주소를 붙여넣으세요!
const POCKETBASE_URL = 'https://pocketbase-production-15bd.up.railway.app'; 
const pb = new PocketBase(POCKETBASE_URL);

// --- CONSTANTS ---
const SECONDS_PER_EXP = 1800;
const EXP_PER_LEVEL = 5;

const STUDY_QUOTES = [
    "성공의 비결은 시작하는 것이다.", "오늘의 노력이 내일의 너를 만든다.", "포기하지 않는 한, 실패는 없다.",
    "가장 큰 위험은 아무런 위험도 감수하지 않는 것이다.", "배움은 끝이 없는 여정이다.", "꿈을 향한 작은 발걸음이 역사를 만든다.",
    "지식에 대한 투자는 최고의 이자를 지불한다.", "성공은 우연이 아니라, 노력과 끈기의 결과다.", "도전하지 않으면 한계도 알 수 없다."
    "작은 습관이 큰 차이를 만든다.", "끝까지 해낸 사람이 결국 승리한다."
];

const CHARACTER_EVOLUTIONS: Record<string, string[]> = {
    dragon: ['🔴', '🦎', '🐊', '🐉', '🐲'], wizard: ['🟣', '🌱', '🪄', '🧙', '🔮'], space: ['⚫️', '🛰️', '🛸', '🚀', '🌌'],
    robot: ['💙', '🔩', '⚙️', '🤖', '🦾'], fantasy: ['🟥', '✨', '🦄', '🧚', '🧝'], nature: ['🟢', '🦊', '🐺', '🦁', '🌳'],
    star: ['🟡', '✨', '🌟', '⭐', '🌠'], music: ['🔵', '🎧', '🎵', '🎶', '🎤'], art: ['🟠', '💧', '🎨', '🖌️', '🖼️'],
    atom: ['💚', '⚛️', '🔬', '🧬', '💥'], light: ['🟨', '🕯️', '💡', '🔦', '🎇'], trophy: ['🟧', '🥉', '🥈', '🥇', '🏆'],
    ocean: ['🟦', '🐠', '🐙', '🦈', '🐋'], cooking: ['🤎', '🍞', '🍕', '🎂', '🧑‍🍳'], sports: ['🧡', '🏀', '⚾️', '🏈', '🏟️'],
};

const CHARACTER_THEMES = Object.keys(CHARACTER_EVOLUTIONS);

const EGG_MAPPING: Record<string, string> = {
    dragon: '🔴', wizard: '🟣', space: '⚫️', robot: '💙', fantasy: '🟥', nature: '🟢', star: '🟡', music: '🔵',
    art: '🟠', atom: '💚', light: '🟨', trophy: '🟧', ocean: '🟦', cooking: '🤎', sports: '🧡',
};

const SCHOOL_LIST = [
    '가온고등학교', '강동중학교', '격동초등학교', '경기고등학교', '경남과학고등학교', '광주소프트웨어마이스터고등학교', '굴화초등학교', 
    '남목고등학교', '남목초등학교', '남외중학교', '남외초등학교', '남창고등학교', '남창중학교', '농서초등학교', '농소중학교', 
    '다운고등학교', '다운중학교', '다운초등학교', '다전초등학교', '달천중학교', '달천초등학교', '대구일과학고등학교', '대전대신고등학교', 
    '대송중학교', '대현고등학교', '대현중학교', '대현초등학교', '덕신초등학교', '도산초등학교', '동대초등학교', '동백초등학교', 
    '동부초등학교', '동서대학교', '동천초등학교', '동평중학교', '동평초등학교', '두광중학교', '두왕초등학교', '매곡중학교', 
    '매곡초등학교', '매산초등학교', '명촌초등학교', '문수고등학교', '문수중학교', '문수초등학교', '무거고등학교', '무거중학교', 
    '무거초등학교', '무룡중학교', '미포초등학교', '민족사관고등학교', '반곡초등학교', '방기초등학교', '방어진고등학교', '방어진중학교', 
    '방어진초등학교', '백양초등학교', '범서고등학교', '범서중학교', '범서초등학교', '병영초등학교', '복산초등학교', '부산고등학교', 
    '부산대학교', '삼남중학교', '삼동초등학교', '삼산고등학교', '삼산초등학교', '삼신초등학교', '삼평초등학교', '삼호중학교', 
    '상산고등학교', '상안중학교', '상안초등학교', '서부초등학교', '서생중학교', '서울대학교사범대학부설고등학교', '성광여자고등학교', 
    '성안중학교', '성안초등학교', '세종과학예술영재학교', '송정초등학교', '수암초등학교', '신복초등학교', '신선여자고등학교', 
    '신언중학교', '신일중학교', '신정고등학교', '신정중학교', '신정초등학교', '약사초등학교', '양사초등학교', '야음중학교', 
    '언양고등학교', '언양중학교', '언양초등학교', '여천초등학교', '연암중학교', '연암초등학교', '염포초등학교', '옥동중학교', 
    '옥동초등학교', '옥산초등학교', '옥서초등학교', '옥성초등학교', '옥현고등학교', '옥현중학교', '옥현초등학교', '온남초등학교', 
    '온산중학교', '온산초등학교', '온양초등학교', '외솔중학교', '외솔초등학교', '용연초등학교', '용인한국외국어대학교부설고등학교', 
    '우신고등학교', '우정초등학교', '울산강남고등학교', '울산가온고등학교', '울산고등학교', '울산공업고등학교', '울산과학고등학교', 
    '울산대학교', '울산마이스터고등학교', '울산상업고등학교', '울산산업고등학교', '울산애니원고등학교', '울산에너지고등학교', 
    '울산예술고등학교', '울산외국어고등학교', '울산여자고등학교', '울산여자상업고등학교', '울산자연과학고등학교', '울산중앙중학교', 
    '울산초등학교', '울산스포츠과학고등학교', '울주명지초등학교', '웅촌초등학교', '월계초등학교', '월봉초등학교', '월평초등학교', 
    '유곡중학교', '은월초등학교', '이화중학교', '인제대학교', '인천하늘고등학교', '일산중학교', '장검중학교', '전남외국어고등학교', 
    '전하초등학교', '제주과학고등학교', '천곡중학교', '천곡초등학교', '천상고등학교', '천상중학교', '천상초등학교', '청량중학교', 
    '청량초등학교', '충남삼성고등학교', '태화중학교', '태화초등학교', '포항제철고등학교', '평산초등학교', '학성고등학교', 
    '학성중학교', '학성여자고등학교', '학성초등학교', '하나고등학교', '함월중학교', '함월초등학교', '현대고등학교', 
    '현대공업고등학교', '현대중학교', '현대청운고등학교', '호계초등학교', '화암고등학교', '화암중학교', '화암초등학교', 
    '화정초등학교', '화진중학교', '효정중학교'
].sort((a, b) => a.localeCompare(b, 'ko-KR'));


// --- TYPE DEFINITIONS ---
interface Profile { id: string; nickname: string; school: string; grade: string; classId: number; character: string; totalStudyTime: number; activeTitle?: string; titleExpiration?: string; }
interface Class { id: string; name: string; totalTime: number; title: string; character: string; }
interface DailyRecord { id: string; user: string; date: string; dailyTime: number; maxSessionTime: number; morningStudyTime: number; nightStudyTime: number; }
interface MissionClaim { id: string; user: string; date: string; missionId: string; }
interface AIChat { id: string; user: string; messages: { role: 'user' | 'model', text: string }[]; }
interface Mission { id: string; title: string; description: string; goal: number; reward: number; type: 'totalTime' | 'sessionTime' | 'morningTime' | 'nightTime' | 'weeklyConsistency'; icon: string; }
interface CommunityPost { id: string; user: string; category: 'free' | 'suggestion' | 'deletion_request'; title: string; content: string; authorNickname: string; created: string; }
type ClassWithDailyTime = Class & { todaysDailyTime: number };

// --- NEW MISSION SYSTEM ---
const ALL_MISSIONS: Mission[] = [
    { id: 'total_1h', title: '신입 탐험가', description: '오늘 하루 총 1시간 이상 공부에 집중하세요!', goal: 3600, reward: 1, type: 'totalTime', icon: '🌱' },
    { id: 'total_3h', title: '지식의 수호자', description: '오늘 하루 총 3시간 이상 공부하여 꾸준함을 증명하세요!', goal: 10800, reward: 3, type: 'totalTime', icon: '📚' },
    { id: 'total_5h', title: '정복자의 길', description: '오늘 하루 총 5시간 이상 정진하세요!', goal: 18000, reward: 5, type: 'totalTime', icon: '🧭' },
    { id: 'total_7h', title: '지혜의 등불', description: '오늘 하루 총 7시간 이상 던전을 탐험하세요!', goal: 25200, reward: 7, type: 'totalTime', icon: '💡' },
    { id: 'total_10h', title: '신의 경지', description: '오늘 하루 총 10시간 이상 몰입의 경지에 도달하세요!!', goal: 36000, reward: 10, type: 'totalTime', icon: '👑' },
    { id: 'session_40m', title: '성실한 학습자', description: '쉬지 않고 40분 이상 집중력을 발휘해 보세요!', goal: 2400, reward: 4, type: 'sessionTime', icon: '🧘' },
    { id: 'session_80m', title: '끈기의 탐험가', description: '쉬지 않고 80분 이상 집중하여 한계를 돌파하세요!', goal: 4800, reward: 8, type: 'sessionTime', icon: '🚀' },
];

const WEEKLY_MISSIONS: Mission[] = [
    { id: 'weekly_consistency_7d', title: '수련의 고수', description: '매일 1시간 이상, 일주일 동안 꾸준히 공부하여 칭호를 획득하세요!', goal: 7, reward: 0, type: 'weeklyConsistency', icon: '📅' },
    { id: 'weekly_total_35h', title: '던전의 지배자', description: '이번 주 총 35시간 이상 공부하여 한계를 돌파하고 특별 칭호를 획득하세요!', goal: 126000, reward: 50000, type: 'totalTime', icon: '⌛' },
];

const BADGES: { time: number; name: string; icon: string; }[] = [
    { time: 46800, name: '현자의 돌', icon: '💎' },      // 13 hours
    { time: 36000, name: '던전의 초월자', icon: '👑' },  // 10 hours
    { time: 32400, name: '정복자의 길', icon: '🗺️' },     // 9 hours
    { time: 25200, name: '지혜의 등불', icon: '💡' },     // 7 hours
    { time: 18000, name: '끈기의 탐험가', icon: '🧭' },  // 5 hours
    { time: 10800, name: '성실한 학습자', icon: '📚' },  // 3 hours
    { time: 3600, name: '지식의 씨앗', icon: '🌱' },    // 1 hour
    { time: 0, name: '신입 탐험가', icon: '🥚' },       // 0 hours
];

// --- HELPER FUNCTIONS ---
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const calculateLevelInfo = (totalSeconds: number) => {
    const totalExp = Math.floor(totalSeconds / SECONDS_PER_EXP);
    const level = Math.floor(totalExp / EXP_PER_LEVEL) + 1;
    const expIntoLevel = totalExp % EXP_PER_LEVEL;
    const xpPercentage = (expIntoLevel / EXP_PER_LEVEL) * 100;
    const secondsForNextLevel = (Math.floor(totalExp / EXP_PER_LEVEL) + 1) * EXP_PER_LEVEL * SECONDS_PER_EXP;
    const secondsUntilNextLevel = Math.max(0, secondsForNextLevel - totalSeconds);
    return { level, xpPercentage, expIntoLevel, totalExp, secondsUntilNextLevel };
};

const getBadgeForTotalTime = (totalSeconds: number): { name: string; icon: string; } | null => {
    return BADGES.find(badge => totalSeconds >= badge.time) || null;
};

const getCharacterForLevel = (theme: string, level: number): string => {
    const evolutionChain = CHARACTER_EVOLUTIONS[theme];
    if (!evolutionChain) return '❓';
    if (level <= 1) return evolutionChain[0]; if (level <= 4) return evolutionChain[1];
    if (level <= 8) return evolutionChain[2]; if (level <= 13) return evolutionChain[3];
    return evolutionChain[4];
};

const getTodayDateString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};

const formatClassName = (school: string, grade: string, classId: number): string => {
    if (school.endsWith('대학교')) return `${school} ${grade}학년`;
    return `${school} ${grade}학년 ${classId}반`;
};

const getDailyMissions = (userId: string, dateString: string): Mission[] => {
    // Daily missions are now fixed for all users every day.
    return ALL_MISSIONS;
};

// --- COMPONENTS ---
const Loader = () => <div className="status-container"><div className="loader-spinner"></div><p>데이터를 불러오는 중...</p></div>;

const ErrorDisplay = ({ message, details }: { message: string; details: React.ReactNode; }) => (
    <div className="status-container">
        <div className="error-message">
            <h3>앗! 문제가 발생했어요.</h3>
            <p>{message}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{details}</div>
        </div>
    </div>
);

const CharacterPicker = ({ selected, onSelect, label }: { selected: string; onSelect: (theme: string) => void; label?: string }) => (
    <div className="form-group">
        {label && <label>{label}</label>}
        <div className="character-picker" role="radiogroup">
            {CHARACTER_THEMES.map(theme => (
                <button key={theme} type="button" role="radio" aria-checked={selected === theme}
                    className={`character-option ${selected === theme ? 'selected' : ''}`} onClick={() => onSelect(theme)}
                    aria-label={`신비한 ${EGG_MAPPING[theme]} 알 선택`}>{EGG_MAPPING[theme]}</button>
            ))}
        </div>
    </div>
);

const SavedUsers = ({ profiles, onLogin, onDelete }: { profiles: Profile[], onLogin: (profile: Profile) => void, onDelete: (id: string) => void }) => {
  const [localProfiles, setLocalProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let savedUserIds = [];
    try {
        savedUserIds = JSON.parse(localStorage.getItem('dungeon-local-profiles') || '[]');
    } catch (e) {
        console.error("Error parsing local profiles, resetting.", e);
        localStorage.removeItem('dungeon-local-profiles');
    }
    const savedUsers = profiles.filter(p => savedUserIds.includes(p.id));
    setLocalProfiles(savedUsers);
  }, [profiles]);
  
  const handleDelete = (id: string) => {
    onDelete(id);
    setLocalProfiles(prev => prev.filter(p => p.id !== id));
  };

  if (localProfiles.length === 0) return null;
  return (
    <div className="saved-users-container">
      <h3>기존 계정으로 로그인</h3>
      <div className="saved-users-list">
        {localProfiles.map((profile) => {
            const { level } = calculateLevelInfo(profile.totalStudyTime || 0);
            const isTitleActive = profile.activeTitle && profile.titleExpiration && new Date() < new Date(profile.titleExpiration);
            return (
              <div key={profile.id} className="saved-user-card">
                <button className="saved-user-button" onClick={() => onLogin(profile)} aria-label={`${profile.nickname} 계정으로 로그인`}>
                    <span className="saved-user-character" aria-hidden="true">{getCharacterForLevel(profile.character, level)}</span>
                    <div className="saved-user-info">
                        <span className="saved-user-nickname">{profile.nickname}{isTitleActive && <span className="user-title">{profile.activeTitle}</span>}</span>
                        <span className="saved-user-school">{formatClassName(profile.school, profile.grade, profile.classId)}</span>
                    </div>
                </button>
                <button className="delete-user-button" onClick={() => handleDelete(profile.id)} aria-label={`${profile.nickname} 계정 삭제`}>×</button>
              </div>
            );
        })}
      </div>
    </div>
  );
};

const Login = ({ onLogin, profiles, onDeleteProfile, error }: { onLogin: (profile: Omit<Profile, 'id' | 'totalStudyTime'> | Profile) => Promise<void>, profiles: Profile[], onDeleteProfile: (id: string) => void, error: string | null }) => {
  const [nickname, setNickname] = useState('');
  const [school, setSchool] = useState('');
  const [schoolQuery, setSchoolQuery] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<string[]>([]);
  const [isSchoolListVisible, setIsSchoolListVisible] = useState(false);
  const [grade, setGrade] = useState('1');
  const [classId, setClassId] = useState(1);
  const [character, setCharacter] = useState(CHARACTER_THEMES[0]);
  const schoolSearchRef = useRef<HTMLDivElement>(null);

  const schoolType = useMemo(() => {
    if (schoolQuery.endsWith('대학교')) return 'university';
    if (schoolQuery.endsWith('초등학교')) return 'elementary';
    if (schoolQuery.endsWith('중학교') || schoolQuery.endsWith('고등학교')) return 'secondary';
    return 'other';
  }, [schoolQuery]);

  useEffect(() => {
    const maxGrade = { secondary: 3, university: 4, elementary: 6, other: 6 }[schoolType];
    if (parseInt(grade, 10) > maxGrade) setGrade('1');
  }, [schoolType, grade]);

  const gradeOptions = useMemo(() => {
    const length = { elementary: 6, secondary: 3, university: 4, other: 6 }[schoolType];
    return Array.from({ length }, (_, i) => i + 1);
  }, [schoolType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (schoolSearchRef.current && !schoolSearchRef.current.contains(event.target as Node)) setIsSchoolListVisible(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSchoolSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSchoolQuery(query);
      if (query) {
          setFilteredSchools(SCHOOL_LIST.filter(s => s.toLowerCase().includes(query.toLowerCase())));
          setIsSchoolListVisible(true);
      } else {
          setFilteredSchools([]);
          setIsSchoolListVisible(false);
      }
  };

  const handleSchoolSelect = (selectedSchool: string) => {
      setSchool(selectedSchool);
      setSchoolQuery(selectedSchool);
      setIsSchoolListVisible(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSchool = schoolQuery.trim();
    if (!finalSchool) {
        alert("학교 이름을 입력해주세요.");
        return;
    }
    const finalClassId = schoolType === 'university' ? 1 : Number(classId);
    if (nickname.trim() && finalSchool && grade && finalClassId && character) {
        onLogin({ nickname: nickname.trim(), school: finalSchool, grade, classId: finalClassId, character });
    }
  };

  return (
    <div className="login-container">
      <h1>지식의 던전</h1>
      {error && <div className="login-error">{error}</div>}
      <SavedUsers profiles={profiles} onLogin={onLogin} onDelete={onDeleteProfile} />
      <div className="divider"><span>또는</span></div>
      <h2>새로운 도전</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group"><label htmlFor="nickname">닉네임</label><input id="nickname" type="text" className="form-input" value={nickname} onChange={(e) => setNickname(e.target.value)} required aria-label="닉네임" /></div>
        <div className="form-group" ref={schoolSearchRef}>
            <label htmlFor="school">학교</label>
            <input id="school" type="text" className="form-input" value={schoolQuery} onChange={handleSchoolSearchChange} onFocus={() => { if (schoolQuery) setIsSchoolListVisible(true); }} placeholder="학교 이름을 검색하세요" autoComplete="off" required aria-label="학교 검색" />
            <p className="form-helper-text">'~~학교'까지 전체 학교 이름을 정확하게 입력해주세요.</p>
            {isSchoolListVisible && filteredSchools.length > 0 && (
                <ul className="school-search-results">{filteredSchools.map(s => <li key={s} onClick={() => handleSchoolSelect(s)} onMouseDown={(e) => e.preventDefault()}>{s}</li>)}</ul>
            )}
        </div>
        <div className="form-group">
            <label htmlFor="grade">학년</label>
            <select id="grade" className="form-select" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="학년">
                {gradeOptions.map(g => (<option key={g} value={g}>{g}</option>))}
            </select>
        </div>
        {schoolType !== 'university' && (
            <div className="form-group">
                <label htmlFor="class">반</label>
                <select id="class" className="form-select" value={classId} onChange={(e) => setClassId(Number(e.target.value))} aria-label="반">
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(id => (<option key={id} value={id}>{id}반</option>))}
                </select>
            </div>
        )}
        <CharacterPicker selected={character} onSelect={setCharacter} label="신비한 알 선택" />
        <button type="submit" className="login-button" disabled={!nickname.trim() || !schoolQuery.trim()}>도전 시작</button>
      </form>
    </div>
  );
};

// FIX: 'rank' prop was added to fix compile errors
const ClassCard = ({ classData, onSelect, rank }: { classData: ClassWithDailyTime; onSelect: (classId: string) => void; rank: number }) => {
    const { level, xpPercentage } = calculateLevelInfo(classData.totalTime);
    const rankClasses: { [key: number]: string } = { 1: 'gold', 2: 'silver', 3: 'bronze' };
    
    return (
        <div className={`class-card interactive ${rankClasses[rank] || ''}`} role="button" tabIndex={0} onClick={() => onSelect(classData.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(classData.id) }} aria-label={`${classData.name}, ${rank}위, 상세 정보 보기`}>
            {rank <= 3 && <div className="rank-badge">{rank}</div>}
            <div className="class-avatar" aria-hidden="true">{getCharacterForLevel(classData.character, level)}</div>
            <div className="class-details">
                <div className="class-header">
                    <h4>{classData.name} {classData.title && <span className="class-title-nickname">"{classData.title}"</span>}</h4>
                    <span className="class-level">레벨 {level}</span>
                </div>
                <div className="xp-bar-container" title={`레벨 ${level} 달성률`}><div className="xp-bar" style={{ width: `${xpPercentage}%` }} /></div>
                <div className="class-stats">
                    <span className="class-stat-item">오늘 공부: <strong>{formatTime(classData.todaysDailyTime)}</strong></span>
                    <span className="class-stat-item">누적 공부: <strong>{formatTime(classData.totalTime)}</strong></span>
                </div>
            </div>
        </div>
    );
};

const Timer = ({ dailyTime, sessionTime, isTimerRunning, onTimerToggle }: { dailyTime: number; sessionTime: number; isTimerRunning: boolean; onTimerToggle: () => void; }) => (
    <div className="card timer-section">
        <div className="timer-displays">
            <div className="timer-display-item total-time"><h4>오늘의 공부 타이머</h4><div className="timer-value">{formatTime(isTimerRunning ? dailyTime + sessionTime : dailyTime)}</div></div>
            <div className="timer-display-item focus-time"><h4>Focus Time</h4><div className="timer-value">{formatTime(sessionTime)}</div></div>
        </div>
        <button id="timer-toggle-button" onClick={onTimerToggle} className={`timer-button ${isTimerRunning ? 'stop' : 'start'}`} aria-live="polite">{isTimerRunning ? '타이머 중지' : '타이머 시작'}</button>
    </div>
);

const ClassDetailView = ({ user, classData, profiles, onBack, onUpdateProfile, ...timerProps }: { user: Profile; classData: ClassWithDailyTime; profiles: Profile[]; onBack: () => void; onUpdateProfile: (classId: string, newProfile: Partial<Class>) => void; dailyTime: number; sessionTime: number; isTimerRunning: boolean; onTimerToggle: () => void; }) => {
    const [quote, setQuote] = useState('');
    const [activeDetailTab, setActiveDetailTab] = useState('members');
    const [editableTitle, setEditableTitle] = useState(classData.title || '');
    const [editableCharacter, setEditableCharacter] = useState(classData.character || CHARACTER_THEMES[0]);
    const [members, setMembers] = useState<(Profile & { todaysTime: number; weeklyTime: number; })[]>([]);
    const [rankingPeriod, setRankingPeriod] = useState<'today' | 'weekly'>('today');

    const { level: classLevel } = calculateLevelInfo(classData.totalTime);
    
    useEffect(() => {
        setQuote(STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]);
    }, []);
        
    useEffect(() => {
        const fetchMemberTimes = async () => {
          try {
            const classMembers = profiles.filter(u => formatClassName(u.school, u.grade, u.classId) === classData.name);
            if (classMembers.length === 0) {
                setMembers([]);
                return;
            }
            
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const monday = new Date(today);
            monday.setDate(today.getDate() - diffToMonday);
            monday.setHours(0,0,0,0);
            const mondayStr = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;
            const todayStr = getTodayDateString();
            
            const filter = `(${classMembers.map(m => `user = "${m.id}"`).join(' || ')}) && date >= "${mondayStr} 00:00:00"`;
            const allWeeklyRecords = await pb.collection('daily_records').getFullList<DailyRecord>({ filter });

            const membersWithTime = classMembers.map(member => {
                const memberRecords = allWeeklyRecords.filter(r => r.user === member.id);
                
                const todayRecord = memberRecords.find(r => r.date.startsWith(todayStr));
                let todaysTime = todayRecord ? todayRecord.dailyTime : 0;
                
                let weeklyTime = memberRecords.reduce((sum, record) => sum + record.dailyTime, 0);

                if (member.id === user.id) {
                    const liveDailyTime = timerProps.isTimerRunning ? timerProps.dailyTime + timerProps.sessionTime : timerProps.dailyTime;
                    const savedDailyTime = todayRecord ? todayRecord.dailyTime : 0;
                    
                    todaysTime = liveDailyTime;
                    weeklyTime = (weeklyTime - savedDailyTime) + liveDailyTime;
                }
                
                return { ...member, todaysTime, weeklyTime };
            });
            setMembers(membersWithTime);

          } catch(error) {
            if (error instanceof Error && error.message.includes('autocancelled')) {
                console.log('A member times fetch was auto-cancelled. This is normal during fast updates and can be ignored.');
                return;
            }
            console.error("Error fetching member times:", error);
            setMembers([]);
          }
        };
        fetchMemberTimes();
    }, [classData, profiles, user.id, timerProps.dailyTime, timerProps.sessionTime, timerProps.isTimerRunning]);

    const sortedMembers = useMemo(() => {
        return [...members].sort((a, b) => {
            if (rankingPeriod === 'today') return b.todaysTime - a.todaysTime;
            return b.weeklyTime - a.weeklyTime;
        });
    }, [members, rankingPeriod]);

    const isMember = useMemo(() => members.some(m => m.id === user.id), [user.id, members]);

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(classData.id, { title: editableTitle.trim(), character: editableCharacter });
        alert('프로필이 저장되었습니다!');
    };
    
    return (
        <div className="class-detail-view" role="region" aria-labelledby="class-detail-heading">
            <div className="class-detail-left">
                <div className="card class-detail-avatar-card">
                    <div className="class-detail-avatar" aria-hidden="true">{getCharacterForLevel(classData.character, classLevel)}</div>
                    <p className="class-detail-quote">"{quote}"</p>
                </div>
                <Timer {...timerProps} />
            </div>
            <div className="class-detail-right">
                <div className="class-detail-header card">
                    <h2 id="class-detail-heading">{classData.name} {classData.title && <span className="class-title-nickname">"{classData.title}"</span>}</h2>
                    <div className="class-detail-times">
                        <div className="class-detail-time-item"><span>오늘 공부 시간</span><span>{formatTime(classData.todaysDailyTime)}</span></div>
                        <div className="class-detail-time-item"><span>누적 공부 시간</span><span>{formatTime(classData.totalTime)}</span></div>
                    </div>
                </div>
                <div className="detail-tabs">
                    <button onClick={() => setActiveDetailTab('members')} className={`detail-tab-button ${activeDetailTab === 'members' ? 'active' : ''}`} role="tab">멤버 랭킹</button>
                    <button onClick={() => setActiveDetailTab('profile')} className={`detail-tab-button ${activeDetailTab === 'profile' ? 'active' : ''}`} role="tab">학급 프로필</button>
                </div>
                <div className="detail-tab-content">
                    {activeDetailTab === 'members' && (
                        <div className="member-list card">
                            <div className="ranking-period-tabs">
                                <button onClick={() => setRankingPeriod('today')} className={`ranking-period-button ${rankingPeriod === 'today' ? 'active' : ''}`}>오늘 랭킹</button>
                                <button onClick={() => setRankingPeriod('weekly')} className={`ranking-period-button ${rankingPeriod === 'weekly' ? 'active' : ''}`}>주간 랭킹</button>
                            </div>
                            <h3>{rankingPeriod === 'today' ? '오늘의 학급 내 랭킹' : '이번 주 학급 내 랭킹'}</h3>
                            <div className="member-list-container">
                                {sortedMembers.length > 0 ? (
                                    sortedMembers.map((member, index) => {
                                        const rank = index + 1;
                                        const { level: memberLevel } = calculateLevelInfo(member.totalStudyTime || 0);
                                        const displayTime = rankingPeriod === 'today' ? member.todaysTime : member.weeklyTime;
                                        const isTitleActive = member.activeTitle && member.titleExpiration && new Date() < new Date(member.titleExpiration);
                                        return (
                                            <div key={member.id} className="member-card">
                                                <div className="member-rank">
                                                    {rankingPeriod === 'weekly' && rank === 1 ? '🥇' :
                                                     rankingPeriod === 'weekly' && rank === 2 ? '🥈' :
                                                     rankingPeriod === 'weekly' && rank === 3 ? '🥉' :
                                                     rank}
                                                </div>
                                                <div className="member-info">
                                                    <span className="member-character" aria-hidden="true">{getCharacterForLevel(member.character, memberLevel)}</span>
                                                    <span className="member-nickname">{member.nickname}{isTitleActive && <span className="user-title">{member.activeTitle}</span>}</span>
                                                </div>
                                                <span className="member-time">{formatTime(displayTime)}</span>
                                            </div>
                                        );
                                    })
                                ) : <p className="no-members-message">아직 참여한 멤버가 없습니다.</p>}
                            </div>
                        </div>
                    )}
                    {activeDetailTab === 'profile' && (
                        <div className="class-profile-tab card">
                            <h3>학급 프로필 수정</h3>
                            {isMember ? (
                                <form onSubmit={handleProfileSave} className="class-profile-form">
                                    <div className="form-group"><label htmlFor="class-title">우리 반 칭호 (별명)</label><input id="class-title" type="text" className="form-input" value={editableTitle} onChange={(e) => setEditableTitle(e.target.value)} placeholder="예: 열공 A반" maxLength={20} /></div>
                                    <CharacterPicker selected={editableCharacter} onSelect={setEditableCharacter} label="우리 반 대표 캐릭터 테마" />
                                    <button type="submit" className="login-button">프로필 저장</button>
                                </form>
                            ) : <p className="no-permission-message">이 반의 멤버만 프로필을 수정할 수 있습니다.</p>}
                        </div>
                    )}
                </div>
            </div>
            <button className="back-to-leaderboard-button" onClick={onBack}>학급 대항전으로 돌아가기</button>
        </div>
    );
};

const Profile = ({ user, onBack, onUpdateCharacter, onNavigateToCalendar }: { user: Profile; onBack: () => void; onUpdateCharacter: (newCharacter: string) => void; onNavigateToCalendar: () => void; }) => {
    const { level, xpPercentage, expIntoLevel, secondsUntilNextLevel } = calculateLevelInfo(user.totalStudyTime || 0);
    const isTitleActive = user.activeTitle && user.titleExpiration && new Date() < new Date(user.titleExpiration);

    return (
        <div className="profile-container">
            <h1>프로필</h1>
            <div className="profile-content">
                <div className="card profile-details-card">
                    <div className="profile-avatar" aria-hidden="true">{getCharacterForLevel(user.character, level)}</div>
                    <h2>{user.nickname}{isTitleActive && <span className="user-title">{user.activeTitle}</span>}</h2>
                    <div className="profile-info-list">
                        <p><strong>학교:</strong> {user.school}</p>
                        <p><strong>학년:</strong> {user.grade}학년</p>
                        {!user.school.endsWith('대학교') && <p><strong>반:</strong> {user.classId}반</p>}
                    </div>
                </div>
                <div className="card stats-card">
                    <h3>내 학습 통계</h3>
                    <div className="stat-item"><span className="stat-label">내 총 공부 시간</span><span className="stat-value">{formatTime(user.totalStudyTime || 0)}</span></div>
                    <div className="stat-item"><span className="stat-label">현재 레벨</span><span className="stat-value accent">{level}</span></div>
                    <div className="xp-section">
                        <div className="xp-details"><span className="stat-label">현재 경험치</span><span className="stat-value">{expIntoLevel} / {EXP_PER_LEVEL} EXP</span></div>
                        <div className="xp-bar-container"><div className="xp-bar" style={{ width: `${xpPercentage}%` }}></div></div>
                        <div className="xp-details"><span>다음 레벨까지: {formatTime(secondsUntilNextLevel)}</span></div>
                    </div>
                     <div className="character-change-section"><h3>신비한 알 변경</h3><CharacterPicker selected={user.character} onSelect={onUpdateCharacter} /></div>
                </div>
                <div className="card records-navigation-card">
                    <h3><span role="img" aria-label="Calendar">📅</span> 학습 기록</h3>
                    <p>일별 학습 기록을 달력에서 확인해보세요.</p>
                    <button className="navigate-button" onClick={onNavigateToCalendar}>학습 달력 보기</button>
                </div>
            </div>
            <button className="back-button" onClick={onBack}>대시보드로 돌아가기</button>
        </div>
    );
};

const StudyCalendar = ({ user, onBack }: { user: Profile; onBack: () => void; }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            setIsLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const firstDayStr = `${firstDay.getFullYear()}-${(firstDay.getMonth() + 1).toString().padStart(2, '0')}-${firstDay.getDate().toString().padStart(2, '0')}`;
            const lastDayStr = `${lastDay.getFullYear()}-${(lastDay.getMonth() + 1).toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;

            try {
                const dailyRecords = await pb.collection('daily_records').getFullList<DailyRecord>({
                    filter: `user = "${user.id}" && date >= "${firstDayStr}" && date <= "${lastDayStr}"`,
                });
                
                const recordsMap = dailyRecords.reduce((acc, record) => {
                    const day = new Date(record.date).getDate();
                    acc[day] = (acc[day] || 0) + record.dailyTime;
                    return acc;
                }, {} as Record<string, number>);
                
                setRecords(recordsMap);
            } catch (error) {
                console.error("Failed to fetch calendar records:", error);
                setRecords({});
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [user.id, currentDate]);

    const renderCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const studyTime = records[day];
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;
            days.push(
                <div key={day} className={`calendar-day ${studyTime ? 'has-record' : ''} ${isToday ? 'today' : ''}`}>
                    <span className="day-number">{day}</span>
                    {studyTime > 0 && <span className="study-time">{formatTime(studyTime)}</span>}
                </div>
            );
        }
        return days;
    };
    
    const changeMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(1); // Avoid issues with end-of-month dates
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    return (
        <div className="calendar-container card">
            <h1>학습 기록</h1>
            <div className="calendar-header">
                <button onClick={() => changeMonth(-1)} aria-label="이전 달">&lt;</button>
                <h2>{currentDate.toLocaleString('ko-KR', { year: 'numeric', month: 'long' })}</h2>
                <button onClick={() => changeMonth(1)} aria-label="다음 달">&gt;</button>
            </div>
            <div className="calendar-grid">
                <div className="day-name">일</div><div className="day-name">월</div><div className="day-name">화</div>
                <div className="day-name">수</div><div className="day-name">목</div><div className="day-name">금</div>
                <div className="day-name">토</div>
                {isLoading 
                  ? <div className="calendar-loader-container"><div className="loader-spinner"></div></div> 
                  : renderCalendarDays()
                }
            </div>
            <button className="back-button" onClick={onBack}>프로필로 돌아가기</button>
        </div>
    );
};

const Leaderboard = ({ sortedClasses, onSelectClass }: { sortedClasses: ClassWithDailyTime[]; onSelectClass: (classId: string) => void }) => (
    <div className="leaderboard" role="region" aria-labelledby="leaderboard-heading">
        <h2 id="leaderboard-heading" className="leaderboard-header">학급 대항전</h2>
        <div className="class-cards-container" role="list">{sortedClasses.map((c, index) => <ClassCard key={c.id} classData={c} rank={index + 1} onSelect={onSelectClass} />)}</div>
    </div>
);

const BadgeChallenge = ({ user }: { user: Profile }) => {
    const totalTime = user.totalStudyTime || 0;
    const currentBadge = getBadgeForTotalTime(totalTime);
    const nextBadge = [...BADGES].reverse().find(b => totalTime < b.time);

    const progressInfo = useMemo(() => {
        if (!nextBadge) return { progress: 100 };
        const previousBadgeTime = BADGES.find(b => b.time < nextBadge.time)?.time ?? 0;
        const totalRange = nextBadge.time - previousBadgeTime;
        const progressInRange = totalTime - previousBadgeTime;
        const progress = totalRange > 0 ? Math.min((progressInRange / totalRange) * 100, 100) : 0;
        return { progress };
    }, [totalTime, nextBadge]);

    return (
        <div className="card badge-challenge-card">
            <h3>칭호 챌린지</h3>
            <div className="badge-progress-display">
                <span className="badge-icon current-badge-icon" title={currentBadge?.name}>{currentBadge?.icon ?? '🥚'}</span>
                <div className="badge-progress-bar-container">
                    <div className="xp-bar" style={{ width: `${progressInfo.progress}%` }}></div>
                </div>
                <span className="badge-icon next-badge-icon" title={nextBadge?.name}>{nextBadge?.icon ?? '🏆'}</span>
            </div>
            <div className="badge-progress-text">
                {nextBadge ? (
                    <p>다음 칭호 '<strong>{nextBadge.name}</strong>'까지 <strong>{formatTime(nextBadge.time - totalTime)}</strong> 남았습니다!</p>
                ) : (
                    <p>모든 칭호를 획득하셨습니다! 당신은 진정한 던전의 지배자!</p>
                )}
            </div>
        </div>
    );
};

const Missions = ({ missions, dailyProgress, onClaimReward, missionClaims }: { missions: Mission[]; dailyProgress: { totalTime: number; maxSessionTime: number; morningStudyTime: number; nightStudyTime: number; }; onClaimReward: (mission: Mission) => void; missionClaims: MissionClaim[]; }) => {
    
    const getProgress = (mission: Mission) => {
        switch (mission.type) {
            case 'totalTime': return dailyProgress.totalTime;
            case 'sessionTime': return dailyProgress.maxSessionTime;
            case 'morningTime': return dailyProgress.morningStudyTime;
            case 'nightTime': return dailyProgress.nightStudyTime;
            default: return 0;
        }
    };

    return (
        <div className="missions-container">
            <h2>일일 미션</h2>
            <div className="missions-list">
                {missions.map(mission => {
                    const isClaimed = missionClaims.some(claim => claim.missionId === mission.id);
                    const currentProgress = getProgress(mission);
                    const isCompleted = currentProgress >= mission.goal;
                    const progressPercent = Math.min((currentProgress / mission.goal) * 100, 100);

                    return (
                        <div key={mission.id} className={`mission-card card ${isCompleted && !isClaimed ? 'completed' : ''}`}>
                            <div className="mission-icon">{mission.icon}</div>
                            <div className="mission-details">
                                <h3>{mission.title}</h3><p>{mission.description}</p>
                                <div className="mission-progress">
                                    <div className="xp-bar-container" title={`달성률: ${progressPercent.toFixed(0)}%`}><div className="xp-bar" style={{ width: `${progressPercent}%` }} /></div>
                                    <span className="progress-text">{formatTime(currentProgress)} / {formatTime(mission.goal)}</span>
                                </div>
                                <button className="claim-button" onClick={() => onClaimReward(mission)} disabled={!isCompleted || isClaimed}>
                                    {isClaimed ? '보상 수령 완료' : (isCompleted ? `보상 받기 (+${mission.reward} EXP)` : '미션 진행 중')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WeeklyMissions = ({ weeklyTotalTime, missionClaims, onClaimReward, weeklyConsistencyDays, dailyRecord, isTimerRunning, sessionTime }: { weeklyTotalTime: number; missionClaims: MissionClaim[]; onClaimReward: (mission: Mission) => void; weeklyConsistencyDays: number; dailyRecord: DailyRecord | null; isTimerRunning: boolean; sessionTime: number; }) => {
    return (
        <div className="missions-container">
            <h2>주간 미션</h2>
            <p className="missions-info-text">주간 미션은 매주 월요일에 초기화됩니다.</p>
            <div className="missions-list">
                {WEEKLY_MISSIONS.map(mission => {
                    let currentProgress = 0;
                    if (mission.type === 'totalTime') {
                        currentProgress = weeklyTotalTime;
                    } else if (mission.type === 'weeklyConsistency') {
                        const todayStoredTime = dailyRecord?.dailyTime ?? 0;
                        const liveTodayTime = todayStoredTime + (isTimerRunning ? sessionTime : 0);
                        const isTodayConsistent = liveTodayTime >= 3600;
                        currentProgress = weeklyConsistencyDays + (isTodayConsistent ? 1 : 0);
                    }
                    
                    const isClaimed = missionClaims.some(claim => claim.missionId === mission.id);
                    const isCompleted = currentProgress >= mission.goal;
                    const progressPercent = Math.min((currentProgress / mission.goal) * 100, 100);

                    const progressText = mission.type === 'weeklyConsistency'
                        ? `${currentProgress}일 / ${mission.goal}일`
                        : `${formatTime(currentProgress)} / ${formatTime(mission.goal)}`;
                    
                    const rewardText = mission.type === 'weeklyConsistency'
                        ? '칭호 받기'
                        : `보상 받기 (+${formatTime(mission.reward)})`;

                    return (
                        <div key={mission.id} className={`mission-card card ${isCompleted && !isClaimed ? 'completed' : ''}`}>
                            <div className="mission-icon">{mission.icon}</div>
                            <div className="mission-details">
                                <h3>{mission.title}</h3>
                                <p>{mission.description}</p>
                                <div className="mission-progress">
                                    <div className="xp-bar-container" title={`달성률: ${progressPercent.toFixed(0)}%`}>
                                        <div className="xp-bar" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                    <span className="progress-text">{progressText}</span>
                                </div>
                                <button className="claim-button" onClick={() => onClaimReward(mission)} disabled={!isCompleted || isClaimed}>
                                    {isClaimed ? '보상 수령 완료' : (isCompleted ? rewardText : '미션 진행 중')}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AICounselor = ({ user, aiChat, onUpdateChat }: { user: Profile; aiChat: AIChat | null; onUpdateChat: (messages: {role: 'user' | 'model', text: string}[]) => void; }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatHistory = useMemo(() => aiChat?.messages || [], [aiChat]);
  const messagesToDisplay = useMemo(() => chatHistory.length > 0 
    ? chatHistory 
    : [{role: 'model' as const, text: '안녕하세요! 저는 AI 학습 상담사입니다. 공부법, 스트레스 관리 등 어떤 고민이든 편하게 이야기해주세요.'}]
  , [chatHistory]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesToDisplay]);

  useEffect(() => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const history = chatHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
        
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          history: history,
          config: { systemInstruction: '당신은 학생들을 위한 친절하고 지지적인 AI 상담가입니다. 격려, 공부 팁, 스트레스 관리에 대한 도움을 제공하세요. 답변은 항상 한국어로, 이모지를 적절히 사용하여 따뜻하고 친근한 어조를 유지해주세요. 답변은 간결하지만 진심이 담기도록 해주세요.' },
        });
    } catch(e) { console.error("AI 초기화 실패:", e); }
  }, [chatHistory]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatRef.current) return;
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const newHistory = [...chatHistory, { role: 'user' as const, text: currentInput }];
    onUpdateChat(newHistory);

    try {
      const responseStream = await chatRef.current.sendMessageStream({ message: currentInput });
      
      let modelResponse = '';
      let finalHistory = [...newHistory, { role: 'model' as const, text: '' }];
      
      for await (const chunk of responseStream) {
        modelResponse += chunk.text;
        finalHistory[finalHistory.length - 1].text = modelResponse;
        onUpdateChat([...finalHistory]);
      }
    } catch (error) {
      console.error("AI 응답 오류:", error);
      const errorHistory = [...newHistory, { role: 'model' as const, text: '죄송합니다, 답변을 생성하는 중 오류가 발생했습니다.' }];
      onUpdateChat(errorHistory);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-counselor">
        <div className="ai-counselor-header">
            <h2>AI 상담실</h2>
        </div>
        <div className="chat-window card">
            <div className="message-list">
                {messagesToDisplay.map((msg, index) => <div key={index} className={`message ${msg.role}`}><div className="message-bubble">{msg.text}</div></div>)}
                {isLoading && <div className="message model"><div className="message-bubble loading-indicator"><span>.</span><span>.</span><span>.</span></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <p className="ai-counselor-disclaimer">이 대화는 나만 볼 수 있도록 안전하게 저장됩니다.</p>
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="고민을 이야기해주세요..." aria-label="메시지 입력" disabled={isLoading} />
                <button type="submit" disabled={isLoading || !input.trim()} aria-label="메시지 전송">전송</button>
            </form>
        </div>
    </div>
  );
};

const CommunityBoard = ({ user, posts, profiles, onCreatePost, onDeletePost }: { user: Profile; posts: CommunityPost[]; profiles: Profile[]; onCreatePost: (postData: Omit<CommunityPost, 'id' | 'user' | 'authorNickname' | 'created'>) => void; onDeletePost: (postId: string) => void; }) => {
    const [activeBoardTab, setActiveBoardTab] = useState<'free' | 'suggestion' | 'deletion_request'>('free');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => post.category === activeBoardTab);
    }, [posts, activeBoardTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        await onCreatePost({ title: title.trim(), content: content.trim(), category: activeBoardTab });
        setTitle('');
        setContent('');
        setIsSubmitting(false);
    };

    const tabInfo = {
        free: { title: '자유 게시판', placeholder: '자유롭게 글을 작성해보세요!' },
        suggestion: { title: '기능 추가 제안', placeholder: '어떤 기능이 추가되면 좋을까요? 여러분의 소중한 의견을 들려주세요.' },
        deletion_request: { title: '계정 삭제 요청', placeholder: '계정 삭제를 요청하시려면, 닉네임과 학교 정보를 포함하여 요청 사항을 작성해주세요.' },
    };

    return (
        <div className="community-board-container">
            <h2>커뮤니티</h2>
            <div className="community-tabs">
                <button onClick={() => setActiveBoardTab('free')} className={`community-tab-button ${activeBoardTab === 'free' ? 'active' : ''}`}>자유 게시판</button>
                <button onClick={() => setActiveBoardTab('suggestion')} className={`community-tab-button ${activeBoardTab === 'suggestion' ? 'active' : ''}`}>기능 추가 제안</button>
                <button onClick={() => setActiveBoardTab('deletion_request')} className={`community-tab-button ${activeBoardTab === 'deletion_request' ? 'active' : ''}`}>계정 삭제 요청</button>
            </div>
            <div className="post-list-section card">
                <h3>{tabInfo[activeBoardTab].title}</h3>
                <form onSubmit={handleSubmit} className="post-form">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" required disabled={isSubmitting} />
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={tabInfo[activeBoardTab].placeholder} required disabled={isSubmitting} />
                    <button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
                        {isSubmitting ? '등록 중...' : '게시글 등록'}
                    </button>
                </form>
                <div className="post-list">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map(post => {
                            const author = profiles.find(p => p.id === post.user);
                            const isTitleActive = author && author.activeTitle && author.titleExpiration && new Date() < new Date(author.titleExpiration);
                            const authorTitle = isTitleActive ? author.activeTitle : null;
                            return (
                                <div key={post.id} className="post-card">
                                    <div className="post-header">
                                        <h4>{post.title}</h4>
                                        <div className="post-meta">
                                            <span className="post-author">{post.authorNickname}{authorTitle && <span className="user-title">{authorTitle}</span>}</span>
                                            <span className="post-date">{new Date(post.created).toLocaleString('ko-KR')}</span>
                                        </div>
                                    </div>
                                    <p className="post-content">{post.content}</p>
                                    {post.category === 'free' && post.user === user.id && (
                                        <div className="post-actions">
                                            <button onClick={() => onDeletePost(post.id)} className="delete-post-button">삭제</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="no-posts-message">아직 게시글이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user, profiles, classes, dailyRecord, missionClaims, aiChat, allDailyRecords, communityPosts, onUpdateClassTime, onUpdateUserTotalTime, onLogout, onNavigateToProfile, onUpdateClassProfile, onUpdateUserProfile, onUpdateDailyRecord, onClaimMissionReward, onUpdateChat, onCreatePost, onDeletePost }: { user: Profile; profiles: Profile[]; classes: Class[]; dailyRecord: DailyRecord | null; missionClaims: MissionClaim[]; aiChat: AIChat | null; allDailyRecords: DailyRecord[]; communityPosts: CommunityPost[]; onUpdateClassTime: (classId: string, timeToAdd: number) => void; onUpdateUserTotalTime: (timeToAdd: number) => void; onLogout: () => void; onNavigateToProfile: () => void; onUpdateClassProfile: (classId: string, newProfile: Partial<Class>) => void; onUpdateUserProfile: (updates: Partial<Profile>) => void; onUpdateDailyRecord: (updates: Partial<DailyRecord>) => void; onClaimMissionReward: (mission: Mission) => void; onUpdateChat: (messages: {role: 'user'|'model', text: string}[]) => void; onCreatePost: (postData: Omit<CommunityPost, 'id' | 'user' | 'authorNickname' | 'created'>) => void; onDeletePost: (postId: string) => void; }) => {
    const [sessionTime, setSessionTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [activeMissionTab, setActiveMissionTab] = useState('daily');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [dailyQuote, setDailyQuote] = useState('');
    const [isLevelingUp, setIsLevelingUp] = useState(false);
    const [weeklyTotalTime, setWeeklyTotalTime] = useState(0);
    const [weeklyConsistencyDays, setWeeklyConsistencyDays] = useState(0);

    const sessionTimeRef = useRef(sessionTime);
    sessionTimeRef.current = sessionTime;

    const dailyMissions = useMemo(() => getDailyMissions(user.id, getTodayDateString()), [user.id]);
    const userClassName = formatClassName(user.school, user.grade, user.classId);
    const userClass = classes.find(c => c.name === userClassName);
    
    const { dailyTime = 0, maxSessionTime = 0, morningStudyTime = 0, nightStudyTime = 0 } = dailyRecord || {};

    const liveUserStudyTime = (user.totalStudyTime || 0) + (isTimerRunning ? sessionTime : 0);
    const { level: liveLevel, xpPercentage: liveXpPercentage, expIntoLevel: liveExpIntoLevel } = calculateLevelInfo(liveUserStudyTime);
    
    const prevLevelRef = useRef(liveLevel);
    
    useEffect(() => {
        if (prevLevelRef.current < liveLevel) {
            setIsLevelingUp(true);
            const timer = setTimeout(() => setIsLevelingUp(false), 1000);
            return () => clearTimeout(timer);
        }
        prevLevelRef.current = liveLevel;
    }, [liveLevel]);

    useEffect(() => {
        setDailyQuote(STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]);
    }, []);

    useEffect(() => {
        let interval: number | undefined;
        if (isTimerRunning) {
            interval = window.setInterval(() => setSessionTime((prev) => prev + 1), 1000);
        }
        return () => window.clearInterval(interval);
    }, [isTimerRunning]);
    
     useEffect(() => {
        const fetchWeeklyData = async () => {
            if (user) {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const monday = new Date(today);
                monday.setDate(today.getDate() - diffToMonday);
                monday.setHours(0, 0, 0, 0);
                
                const mondayStr = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;

                try {
                    const records = await pb.collection('daily_records').getFullList<DailyRecord>({
                        filter: `user = "${user.id}" && date >= "${mondayStr} 00:00:00"`
                    });
                    const total = records.reduce((sum, record) => sum + record.dailyTime, 0);
                    setWeeklyTotalTime(total);

                    const todayStr = getTodayDateString();
                    const recordsFromOtherDays = records.filter(r => !r.date.startsWith(todayStr));
                    
                    const dailyTimesByDate = recordsFromOtherDays.reduce((acc, record) => {
                        const dateKey = record.date.substring(0, 10);
                        acc[dateKey] = (acc[dateKey] || 0) + record.dailyTime;
                        return acc;
                    }, {} as Record<string, number>);

                    const consistencyDays = Object.values(dailyTimesByDate).filter(time => time >= 3600).length;
                    setWeeklyConsistencyDays(consistencyDays);

                } catch (error) {
                    if (error instanceof Error && error.message.includes('autocancelled')) {
                        console.log('A weekly data fetch was auto-cancelled. This is normal during fast updates and can be ignored.');
                        return;
                    }
                    console.error("Failed to fetch weekly records:", error);
                }
            }
        };
        fetchWeeklyData();
    }, [user, dailyRecord]);

    const liveWeeklyTotalTime = weeklyTotalTime + (isTimerRunning ? sessionTime : 0);

    const sortedClasses: ClassWithDailyTime[] = useMemo(() => {
        const classDailyTimes = classes.map(c => {
            const classMembers = profiles.filter(p => formatClassName(p.school, p.grade, p.classId) === c.name);
            const totalDailyTime = classMembers.reduce((sum, member) => {
                if (member.id === user.id) {
                    return sum + dailyTime + (isTimerRunning ? sessionTime : 0);
                }
                const record = allDailyRecords.find(r => r.user === member.id);
                return sum + (record?.dailyTime || 0);
            }, 0);
            return { ...c, todaysDailyTime: totalDailyTime };
        });
        return classDailyTimes.sort((a, b) => b.todaysDailyTime - a.todaysDailyTime);
    }, [classes, profiles, allDailyRecords, user.id, dailyTime, sessionTime, isTimerRunning]);
    
    useEffect(() => { if (activeTab !== 'leaderboard') setSelectedClassId(null); }, [activeTab]);

    const selectedClassData = useMemo(() => selectedClassId ? sortedClasses.find(c => c.id === selectedClassId) : null, [selectedClassId, sortedClasses]);
    
    const handleTimerToggle = useCallback(() => {
        setIsTimerRunning(currentIsRunning => {
            const isNowStarting = !currentIsRunning;
    
            if (isNowStarting) {
                setSessionTime(0);
            } else if (userClass) {
                const stoppedSessionTime = sessionTimeRef.current;
                const newDailyTime = dailyTime + stoppedSessionTime;
                const newMaxSessionTime = Math.max(maxSessionTime, stoppedSessionTime);
                let newMorningStudyTime = morningStudyTime;
                let newNightStudyTime = nightStudyTime;
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) newMorningStudyTime += stoppedSessionTime;
                if (hour >= 19 || hour < 2) newNightStudyTime += stoppedSessionTime;

                onUpdateUserTotalTime(stoppedSessionTime);
                onUpdateClassTime(userClass.id, stoppedSessionTime);
                onUpdateDailyRecord({
                    dailyTime: newDailyTime, maxSessionTime: newMaxSessionTime,
                    morningStudyTime: newMorningStudyTime, nightStudyTime: newNightStudyTime,
                });
            }
            return isNowStarting;
        });
    }, [dailyTime, maxSessionTime, morningStudyTime, nightStudyTime, onUpdateClassTime, onUpdateDailyRecord, userClass, onUpdateUserTotalTime]);

    const handleClaimMissionReward = (mission: Mission) => {
      if (!userClass) return;
      
      if (mission.id.startsWith('weekly_')) {
        // 주간 미션: 보상을 시간으로 간주하여 총 공부 시간 및 학급 시간에 추가
        if (mission.reward > 0) {
            onUpdateUserTotalTime(mission.reward);
            onUpdateClassTime(userClass.id, mission.reward);
        }
        
        let title: string | null = null;
        if (mission.id === 'weekly_total_35h') title = '시간의 지배자';
        if (mission.id === 'weekly_consistency_7d') title = '꾸준함의 대가';

        if (title) {
            const expiration = new Date();
            expiration.setDate(expiration.getDate() + 7);
            onUpdateUserProfile({
                activeTitle: title,
                titleExpiration: expiration.toISOString(),
            });
        }
      } else {
        // 일일 미션: 보상을 EXP로 간주하고, 초로 환산하여 개인 총 공부 시간에만 추가
        const rewardInSeconds = mission.reward * SECONDS_PER_EXP;
        onUpdateUserTotalTime(rewardInSeconds);
      }
      
      onClaimMissionReward(mission);
    };
    
    const dailyMissionClaims = useMemo(() => {
        const today = getTodayDateString();
        return missionClaims.filter(claim => claim.date.startsWith(today));
    }, [missionClaims]);

    const timerProps = { dailyTime, sessionTime, isTimerRunning, onTimerToggle: handleTimerToggle };
    const dailyProgress = { totalTime: dailyTime + (isTimerRunning ? sessionTime : 0), maxSessionTime, morningStudyTime, nightStudyTime };
    const isTitleActive = user.activeTitle && user.titleExpiration && new Date() < new Date(user.titleExpiration);

    return (
        <div className={`dashboard ${selectedClassId ? 'full-width' : ''}`}>
            {!selectedClassId && (
              <aside className="sidebar">
                  <div className="card user-info">
                      <h3>내 정보</h3>
                      <div className="user-info-header">
                          <span className={`user-info-character ${isLevelingUp ? 'level-up-animation' : ''}`} aria-hidden="true">{getCharacterForLevel(user.character, liveLevel)}</span>
                          <div className="user-info-main">
                            <h2>{user.nickname}{isTitleActive && <span className="user-title">{user.activeTitle}</span>}</h2>
                          </div>
                      </div>
                      <p className="user-quote">"{dailyQuote}"</p><p className="user-detail">{userClassName}</p>
                      <div className="user-xp-section">
                          <div className="user-level-info"><span>레벨 {liveLevel}</span><span>{liveExpIntoLevel} / {EXP_PER_LEVEL} EXP</span></div>
                          <div className="xp-bar-container"><div className="xp-bar" style={{ width: `${liveXpPercentage}%` }}></div></div>
                      </div>
                      <button className="profile-button" onClick={onNavigateToProfile}>내 프로필</button>
                      <button className="logout-button" onClick={onLogout}>로그아웃</button>
                  </div>
                  <Timer {...timerProps} />
              </aside>
            )}
            <main className="main-content-area" role="main">
                 <div className="main-tabs">
                    <button onClick={() => setActiveTab('leaderboard')} className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`} role="tab">학급 대항전</button>
                    <button onClick={() => setActiveTab('missions')} className={`tab-button ${activeTab === 'missions' ? 'active' : ''}`} role="tab">미션</button>
                    <button onClick={() => setActiveTab('counseling')} className={`tab-button ${activeTab === 'counseling' ? 'active' : ''}`} role="tab">AI 상담실</button>
                    <button onClick={() => setActiveTab('community')} className={`tab-button ${activeTab === 'community' ? 'active' : ''}`} role="tab">커뮤니티</button>
                </div>
                <div className="tab-content">
                    {activeTab === 'leaderboard' && (
                        selectedClassId && selectedClassData ? (
                            <ClassDetailView user={user} classData={selectedClassData} profiles={profiles} onBack={() => setSelectedClassId(null)} onUpdateProfile={onUpdateClassProfile} {...timerProps} />
                        ) : <Leaderboard sortedClasses={sortedClasses} onSelectClass={setSelectedClassId} />
                    )}
                    {activeTab === 'missions' && (
                        <>
                            <div className="mission-sub-tabs">
                                <button onClick={() => setActiveMissionTab('daily')} className={`sub-tab-button ${activeMissionTab === 'daily' ? 'active' : ''}`}>일일 미션</button>
                                <button onClick={() => setActiveMissionTab('weekly')} className={`sub-tab-button ${activeMissionTab === 'weekly' ? 'active' : ''}`}>주간 미션</button>
                            </div>
                            {activeMissionTab === 'daily' && (
                                <Missions missions={dailyMissions} dailyProgress={dailyProgress} onClaimReward={handleClaimMissionReward} missionClaims={dailyMissionClaims} />
                            )}
                            {activeMissionTab === 'weekly' && <WeeklyMissions weeklyTotalTime={liveWeeklyTotalTime} missionClaims={missionClaims} onClaimReward={handleClaimMissionReward} weeklyConsistencyDays={weeklyConsistencyDays} dailyRecord={dailyRecord} isTimerRunning={isTimerRunning} sessionTime={sessionTime}/>}
                        </>
                    )}
                    {activeTab === 'counseling' && <AICounselor user={user} aiChat={aiChat} onUpdateChat={onUpdateChat} />}
                    {activeTab === 'community' && <CommunityBoard user={user} posts={communityPosts} profiles={profiles} onCreatePost={onCreatePost} onDeletePost={onDeletePost} />}
                </div>
            </main>
        </div>
    );
};

type Page = 'login' | 'dashboard' | 'profile' | 'calendar';

const App = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(null);
  const [allDailyRecords, setAllDailyRecords] = useState<DailyRecord[]>([]);
  const [missionClaims, setMissionClaims] = useState<MissionClaim[]>([]);
  const [aiChat, setAiChat] = useState<AIChat | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchUserData = useCallback(async (loggedInUser: Profile) => {
      const todayStr = getTodayDateString();
      const today = new Date(todayStr);

      const dayOfWeek = today.getDay(); // Sunday = 0
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);
      const mondayStr = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;
      
      try {
          const [recordRes, claimsRes, chatRes] = await Promise.all([
              pb.collection('daily_records').getList<DailyRecord>(1, 1, { filter: `user = "${loggedInUser.id}" && date ~ "${todayStr}"` }),
              pb.collection('mission_claims').getFullList<MissionClaim>({ filter: `user = "${loggedInUser.id}" && date >= "${mondayStr}"` }),
              pb.collection('ai_chats').getList<AIChat>(1, 1, { filter: `user = "${loggedInUser.id}"` })
          ]);
          setDailyRecord(recordRes.items[0] || null);
          setMissionClaims(claimsRes);
          setAiChat(chatRes.items[0] || null);
      } catch (e) { 
          if (e instanceof Error && e.message.includes('autocancelled')) {
              console.warn('A user data fetch request was auto-cancelled. This is likely due to a quick re-render and can be ignored.');
              return;
          }
          console.error("Error fetching user-specific data:", e); 
          if (e instanceof ClientResponseError && e.status === 404) {
             // This can happen if collections don't exist yet, which is a setup issue.
          } else if (e instanceof Error) {
            console.warn("Could not fetch all user data, but continuing:", e.message);
          }
      }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await pb.health.check();
        const today = getTodayDateString();
        let [profilesRes, classesRes, dailyRecordsRes, postsRes] = await Promise.all([
          pb.collection('profiles').getFullList<Profile>(),
          pb.collection('classes').getFullList<Class>(),
          pb.collection('daily_records').getFullList<DailyRecord>({ filter: `date ~ "${today}"` }),
          pb.collection('community_posts').getFullList<CommunityPost>({ sort: '-created' })
        ]);
        
        const classesToUpdate = classesRes.filter(c => !c.character || !CHARACTER_THEMES.includes(c.character));
        if (classesToUpdate.length > 0) {
            console.log(`Found ${classesToUpdate.length} classes with missing characters. Assigning random characters...`);
            const updatePromises = classesToUpdate.map(c => {
                const randomCharacterTheme = CHARACTER_THEMES[Math.floor(Math.random() * CHARACTER_THEMES.length)];
                // FIX: Added generic type <Class> to fix type error on `classesRes`
                return pb.collection('classes').update<Class>(c.id, { character: randomCharacterTheme });
            });
            const updatedRecords = await Promise.all(updatePromises);
            
            const updatedClassesMap = new Map(updatedRecords.map(rec => [rec.id, rec]));
            classesRes = classesRes.map(c => updatedClassesMap.get(c.id) || c);
            console.log("Character assignment complete.");
        }

        setProfiles(profilesRes); 
        setClasses(classesRes); 
        setAllDailyRecords(dailyRecordsRes);
        setCommunityPosts(postsRes);

        let savedUserIds = [];
        try {
            const savedProfiles = localStorage.getItem('dungeon-local-profiles');
            if (savedProfiles) {
                savedUserIds = JSON.parse(savedProfiles);
            }
        } catch (e) {
            console.error("Error parsing local profiles, resetting.", e);
            localStorage.removeItem('dungeon-local-profiles');
        }
        
        if (savedUserIds.length > 0) {
            const lastUserId = savedUserIds[savedUserIds.length - 1];
            const currentUser = profilesRes.find(p => p.id === lastUserId);
            if (currentUser) {
                setUser(currentUser);
                await fetchUserData(currentUser);
                setCurrentPage('dashboard');
            }
        }
      } catch (e) { 
          console.error("Failed to load initial data from PocketBase", e);
          if (e instanceof ClientResponseError && (e.status === 404 || e.message.includes("collection") || (e.data?.message && e.data.message.includes("collection")))) {
              setError("db_setup_incomplete");
          } else if (e instanceof Error && e.message.toLowerCase().includes('superuser')) {
              setError("api_rules_error");
          }
          else {
              setError("network_error");
          }
      } finally { 
          setIsLoading(false); 
      }
    };
    init();

    // 서비스 워커 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => console.log('Service Worker registered:', registration))
          .catch(error => console.log('Service Worker registration failed:', error));
      });
    }

    pb.collection('profiles').subscribe<Profile>('*', (e) => setProfiles(prev => e.action === 'delete' ? prev.filter(p => p.id !== e.record.id) : [...prev.filter(p => p.id !== e.record.id), e.record]));
    pb.collection('classes').subscribe<Class>('*', (e) => setClasses(prev => e.action === 'delete' ? prev.filter(c => c.id !== e.record.id) : [...prev.filter(c => c.id !== e.record.id), e.record]));
    pb.collection('daily_records').subscribe<DailyRecord>('*', (e) => {
        const today = getTodayDateString();
        if (!e.record.date.startsWith(today)) return; // Use startsWith to be safe with timezones
        setAllDailyRecords(prev => {
            const filtered = prev.filter(r => r.id !== e.record.id);
            return e.action === 'delete' ? filtered : [...filtered, e.record];
        });
        if (userRef.current && e.record.user === userRef.current.id) {
            setDailyRecord(e.action === 'delete' ? null : e.record);
        }
    });
    pb.collection('community_posts').subscribe<CommunityPost>('*', (e) => {
        setCommunityPosts(prev => {
            if (e.action === 'delete') return prev.filter(p => p.id !== e.record.id);
            if (e.action === 'create') return [e.record, ...prev];
            // 'update' case
            return [e.record, ...prev.filter(p => p.id !== e.record.id)];
        })
    });
    
    return () => { 
        pb.collection('profiles').unsubscribe(); 
        pb.collection('classes').unsubscribe(); 
        pb.collection('daily_records').unsubscribe();
        pb.collection('community_posts').unsubscribe();
    };
  }, [fetchUserData]);

  const handleLogin = async (loginData: Omit<Profile, 'id' | 'totalStudyTime'> | Profile) => {
    setIsLoading(true);
    setLoginError(null);
    try {
        let loggedInUser: Profile;
        if ('id' in loginData) { // Existing user login
            loggedInUser = loginData;
        } else { // New user creation
            const existingUser = profiles.find(p => p.nickname === loginData.nickname && p.school === loginData.school && p.grade === loginData.grade && p.classId === loginData.classId);
            if(existingUser) {
                loggedInUser = existingUser;
            } else {
                const profileData = { ...loginData, totalStudyTime: 0 };
                loggedInUser = await pb.collection('profiles').create<Profile>(profileData);
                setProfiles(prev => [...prev.filter(p => p.id !== loggedInUser.id), loggedInUser]);
            }
        }
        
        const className = formatClassName(loggedInUser.school, loggedInUser.grade, loggedInUser.classId);
        
        // Before creating, check server directly for the most up-to-date class list.
        const serverClasses = await pb.collection('classes').getFullList<Class>({ filter: `name = "${className}"`});
        
        if (serverClasses.length === 0) {
            try {
                const randomCharacterTheme = CHARACTER_THEMES[Math.floor(Math.random() * CHARACTER_THEMES.length)];
                const newClassData = { name: className, totalTime: 0, title: '', character: randomCharacterTheme };
                const newClass = await pb.collection('classes').create<Class>(newClassData);
                setClasses(prev => [...prev.filter(c => c.id !== newClass.id), newClass]);
            } catch (error) {
                if (error instanceof ClientResponseError && error.data?.data?.name?.code === 'validation_not_unique') {
                    console.warn(`Race condition handled: Class '${className}' was created by another user.`);
                    // Fetch the class created by another user to ensure our state is up to date
                    const existingClass = await pb.collection('classes').getFirstListItem<Class>(`name = "${className}"`);
                    if (existingClass) {
                       setClasses(prev => [...prev.filter(c => c.id !== existingClass.id), existingClass]);
                    }
                } else {
                    throw error;
                }
            }
        }

        const savedUserIds = JSON.parse(localStorage.getItem('dungeon-local-profiles') || '[]');
        if (!savedUserIds.includes(loggedInUser.id)) {
            localStorage.setItem('dungeon-local-profiles', JSON.stringify([...savedUserIds, loggedInUser.id]));
        }
        
        setUser(loggedInUser);
        await fetchUserData(loggedInUser);
        setCurrentPage('dashboard');
    } catch (error) { 
        console.error("Login failed:", error);
        if (error instanceof ClientResponseError) {
            const validationErrors = error.data?.data;
            if (validationErrors && Object.keys(validationErrors).length > 0) {
                const firstErrorKey = Object.keys(validationErrors)[0];
                const errorDetails = validationErrors[firstErrorKey];
                setLoginError(`로그인 실패: ${errorDetails.message}`);
            } else {
                setLoginError(`로그인 실패: ${error.message || '서버 오류가 발생했습니다.'}`);
            }
        } else if (error instanceof Error) {
            setLoginError(`로그인 중 오류가 발생했습니다: ${error.message}`);
        } else {
            setLoginError("알 수 없는 오류로 로그인에 실패했습니다.");
        }
    }
    finally { setIsLoading(false); }
  };
  
  const handleDeleteProfile = (id: string) => {
      const currentIds = JSON.parse(localStorage.getItem('dungeon-local-profiles') || '[]');
      const newIds = currentIds.filter((savedId: string) => savedId !== id);
      localStorage.setItem('dungeon-local-profiles', JSON.stringify(newIds));
  };


  const handleLogout = () => { setUser(null); setCurrentPage('login'); };

  const handleUpdateClassTime = async (classId: string, timeToAdd: number) => {
    try { await pb.collection('classes').update(classId, { 'totalTime+': timeToAdd }); } 
    catch (error) { console.error("Failed to update class time:", error); }
  };
  
  const handleUpdateUserTotalTime = (timeToAdd: number) => {
      if (!user) return;
      const newTotalTime = (user.totalStudyTime || 0) + timeToAdd;
      const updatedUser = { ...user, totalStudyTime: newTotalTime };
      setUser(updatedUser);
      setProfiles(prev => prev.map(p => p.id === user.id ? updatedUser : p));
      pb.collection('profiles').update(user.id, { 'totalStudyTime+': timeToAdd }).catch(error => {
          console.error("Failed to update user total study time:", error);
          setUser(user);
          setProfiles(prev => prev.map(p => p.id === user.id ? user : p));
      });
  };

  const handleUpdateCharacter = async (newCharacter: string) => {
    if (!user) return;
    try {
        const updatedUser = await pb.collection('profiles').update<Profile>(user.id, { character: newCharacter });
        setUser(updatedUser);
        setProfiles(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
    } catch (error) { console.error("Failed to update character:", error); }
  };

  const handleUpdateClassProfile = async (classId: string, newProfile: Partial<Class>) => {
    try { await pb.collection('classes').update(classId, newProfile); } 
    catch (error) { console.error("Failed to update class profile:", error); }
  };

  const handleUpdateDailyRecord = async (updates: Partial<Omit<DailyRecord, 'id' | 'user' | 'date'>>) => {
      if (!user) return;
      const today = getTodayDateString();
      try {
          if (dailyRecord) {
              const updatedRecord = await pb.collection('daily_records').update<DailyRecord>(dailyRecord.id, updates);
              setDailyRecord(updatedRecord);
          } else {
              const newRecordData = { user: user.id, date: today, dailyTime: 0, maxSessionTime: 0, morningStudyTime: 0, nightStudyTime: 0, ...updates };
              const newRecord = await pb.collection('daily_records').create<DailyRecord>(newRecordData);
              setDailyRecord(newRecord);
          }
      } catch (error) { console.error("Failed to update daily record:", error); }
  };

  const handleClaimMissionReward = async (mission: Mission) => {
      if (!user) return;
      try {
          const newClaim = await pb.collection('mission_claims').create<MissionClaim>({ user: user.id, date: getTodayDateString(), missionId: mission.id });
          setMissionClaims(prev => [...prev, newClaim]);
      } catch(error) { console.error("Failed to claim mission:", error); }
  };

  const handleUpdateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
        const updatedUser = await pb.collection('profiles').update<Profile>(user.id, updates);
        setUser(updatedUser);
        setProfiles(prev => prev.map(p => p.id === updatedUser.id ? updatedUser : p));
    } catch (error) {
        console.error("Failed to update user profile:", error);
    }
  };

  const handleUpdateChat = async (messages: {role: 'user'|'model', text: string}[]) => {
      if (!user) return;
      try {
          if (aiChat) {
              const updatedChat = await pb.collection('ai_chats').update<AIChat>(aiChat.id, { messages });
              setAiChat(updatedChat);
          } else {
              const newChat = await pb.collection('ai_chats').create<AIChat>({ user: user.id, messages });
              setAiChat(newChat);
          }
      } catch (error) { console.error("Failed to update chat:", error); }
  };

  const handleCreatePost = async (postData: Omit<CommunityPost, 'id' | 'user' | 'authorNickname' | 'created'>) => {
    if (!user) return;
    try {
        const newPost = await pb.collection('community_posts').create<CommunityPost>({
            ...postData,
            user: user.id,
            authorNickname: user.nickname,
        });
        if (postData.category === 'deletion_request') {
            alert('계정 삭제 요청이 성공적으로 접수되었습니다.');
        }
    } catch (error) {
        console.error("Failed to create post:", error);
        alert(`게시글 작성에 실패했습니다. ${error instanceof ClientResponseError ? error.message : ''}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
      try {
          await pb.collection('community_posts').delete(postId);
      } catch (error) {
          console.error("Failed to delete post:", error);
          alert('게시글 삭제에 실패했습니다.');
      }
  };

  const renderPage = () => {
    if (isLoading) return <Loader />;
    if (error === "api_rules_error") return <ErrorDisplay message="API 규칙(권한) 설정에 문제가 있습니다." details="PocketBase 관리자 페이지에서 'profiles', 'classes' 등 직접 만드신 Collection들의 API Rules가 모두 비어있는지(Superusers only가 아닌지) 다시 한번 확인해주세요." />;
    if (error === "db_setup_incomplete") return <ErrorDisplay message="데이터베이스 설정이 완료되지 않았습니다." details={<>PocketBase 관리자 페이지에 접속하여 'profiles', 'classes', 'community_posts' 등의 Collection이 정확하게 생성되었는지 확인해주세요. <a href={`${POCKETBASE_URL}/_/`} target="_blank" rel="noopener noreferrer">여기를 클릭하여 관리자 페이지로 이동</a></>} />;
    if (error === "network_error") return <ErrorDisplay message="서버에 연결할 수 없습니다." details="인터넷 연결을 확인하거나, PocketBase 서버 주소가 정확한지 확인해주세요." />;

    switch(currentPage) {
        case 'profile': return user && <Profile user={user} onBack={() => setCurrentPage('dashboard')} onUpdateCharacter={handleUpdateCharacter} onNavigateToCalendar={() => setCurrentPage('calendar')} />;
        case 'calendar': return user && <StudyCalendar user={user} onBack={() => setCurrentPage('profile')} />;
        case 'dashboard': return user && <Dashboard user={user} profiles={profiles} classes={classes} dailyRecord={dailyRecord} missionClaims={missionClaims} aiChat={aiChat} allDailyRecords={allDailyRecords} communityPosts={communityPosts} onUpdateClassTime={handleUpdateClassTime} onUpdateUserTotalTime={handleUpdateUserTotalTime} onLogout={handleLogout} onNavigateToProfile={() => setCurrentPage('profile')} onUpdateClassProfile={handleUpdateClassProfile} onUpdateUserProfile={handleUpdateUserProfile} onUpdateDailyRecord={handleUpdateDailyRecord} onClaimMissionReward={handleClaimMissionReward} onUpdateChat={handleUpdateChat} onCreatePost={handleCreatePost} onDeletePost={handleDeletePost} />;
        case 'login': default: return <Login onLogin={handleLogin} profiles={profiles} onDeleteProfile={handleDeleteProfile} error={loginError} />;
    }
  };

  return <div className="app-container">{renderPage()}</div>;
};

const container = document.getElementById('root');
if (container) createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);