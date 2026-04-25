// src/pages/Exams.jsx
import React, { useState } from 'react';
import { FlaskConical, CheckCircle, XCircle, ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const DEMO_TOPICS = [
  { id: '1', name: 'Mathematics Chapter 3', description: 'Algebra & Equations', questions: 10, difficulty: 'Medium' },
  { id: '2', name: 'Science – Photosynthesis', description: 'Biology basics', questions: 8, difficulty: 'Easy' },
  { id: '3', name: 'English Grammar', description: 'Tenses & Vocabulary', questions: 15, difficulty: 'Hard' },
];

const DEMO_QUIZ = [
  { q: 'Solve: 2x + 5 = 13. What is x?', options: ['2','3','4','5'], correct: 2 },
  { q: 'What is the process by which plants make food?', options: ['Respiration','Photosynthesis','Digestion','Absorption'], correct: 1 },
  { q: 'Which tense is used for a recurring action?', options: ['Past Simple','Present Continuous','Present Simple','Future Perfect'], correct: 2 },
];

export default function Exams() {
  const { userType } = useAuth();
  const [phase, setPhase] = useState('topics'); // topics | quiz | results
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [chosen, setChosen] = useState(null);

  const startQuiz = (topic) => { setSelectedTopic(topic); setPhase('quiz'); setCurrent(0); setAnswers([]); setChosen(null); };

  const next = () => {
    const newAnswers = [...answers, chosen];
    setAnswers(newAnswers);
    setChosen(null);
    if (current + 1 >= DEMO_QUIZ.length) setPhase('results');
    else setCurrent(c => c + 1);
  };

  const score = answers.filter((a, i) => a === DEMO_QUIZ[i]?.correct).length;

  if (phase === 'results') return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Quiz Results" showBack />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold-500 to-coral-500 flex items-center justify-center shadow-glow-gold animate-bounce-in">
          <Trophy size={44} className="text-white" />
        </div>
        <div className="text-center">
          <p className="text-white/50 font-body mb-2">Your score</p>
          <p className="font-display font-extrabold text-white text-6xl">{score}<span className="text-white/30 text-3xl">/{DEMO_QUIZ.length}</span></p>
          <p className="text-white/50 font-body mt-2">{score === DEMO_QUIZ.length ? '🎉 Perfect score!' : score >= DEMO_QUIZ.length / 2 ? '👍 Good job!' : '📚 Keep practising!'}</p>
        </div>
        <button onClick={() => setPhase('topics')}
          className="w-full h-14 rounded-2xl btn-gradient font-display font-bold text-navy-900">
          Back to Topics
        </button>
      </div>
      <BottomNav userType={userType} />
    </div>
  );

  if (phase === 'quiz') {
    const q = DEMO_QUIZ[current];
    return (
      <div className="min-h-screen mesh-bg flex flex-col">
        <TopBar title={selectedTopic?.name || 'Quiz'} showBack />
        <div className="flex-1 flex flex-col px-4 pt-4 pb-28">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold-500 to-coral-500 transition-all"
                style={{ width: `${((current) / DEMO_QUIZ.length) * 100}%` }} />
            </div>
            <span className="text-white/40 text-xs font-body shrink-0">{current + 1}/{DEMO_QUIZ.length}</span>
          </div>
          <div className="glass-card p-5 mb-6 flex-1 flex flex-col justify-center">
            <p className="text-white font-display font-bold text-lg leading-relaxed">{q.q}</p>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => setChosen(i)}
                className={`w-full p-4 rounded-2xl text-left font-body text-sm transition-all border
                  ${chosen === i
                    ? 'border-gold-500/60 bg-gold-500/15 text-white'
                    : 'border-white/8 bg-white/5 text-white/70 hover:bg-white/8'}`}>
                <span className="font-semibold mr-2 text-white/40">{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            ))}
          </div>
          <button onClick={next} disabled={chosen === null}
            className="h-14 rounded-2xl btn-gradient font-display font-bold text-navy-900 disabled:opacity-30">
            {current + 1 === DEMO_QUIZ.length ? 'Finish!' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      <TopBar title="Exams & Quizzes" showBack />
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28">
        <div className="flex flex-col gap-3">
          {DEMO_TOPICS.map(t => (
            <button key={t.id} onClick={() => startQuiz(t)}
              className="glass-card p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/15 flex items-center justify-center shrink-0">
                <FlaskConical size={22} className="text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-display font-semibold text-sm">{t.name}</p>
                <p className="text-white/40 text-xs font-body mt-0.5">{t.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/40 font-body">{t.questions} questions</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-body
                    ${t.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-400'
                    : t.difficulty === 'Medium' ? 'bg-gold-500/15 text-gold-400'
                    : 'bg-coral-500/15 text-coral-400'}`}>{t.difficulty}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/25" />
            </button>
          ))}
        </div>
      </div>
      <BottomNav userType={userType} />
    </div>
  );
}
