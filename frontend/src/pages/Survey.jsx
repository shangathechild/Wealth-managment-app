import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const QUESTIONS = [
  {
    id: 'risk',
    question: 'How would you describe your risk tolerance?',
    options: [
      { label: 'Conservative (Protect my capital)', value: 'conservative', score: 1 },
      { label: 'Moderate (Balanced growth and risk)', value: 'moderate', score: 2 },
      { label: 'Aggressive (Maximize growth, high volatility)', value: 'aggressive', score: 3 },
    ],
  },
  {
    id: 'goal',
    question: 'What is your primary investment goal?',
    options: [
      { label: 'Retirement Planning', value: 'retirement' },
      { label: 'Buying a Home', value: 'real_estate' },
      { label: 'Education Fund', value: 'education' },
      { label: 'General Wealth Building', value: 'wealth' },
    ],
  },
  {
    id: 'horizon',
    question: 'What is your investment time horizon?',
    options: [
      { label: 'Short Term (1-3 years)', value: 'short' },
      { label: 'Medium Term (5-10 years)', value: 'medium' },
      { label: 'Long Term (15-25+ years)', value: 'long' },
    ],
  },
];

export default function Survey() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (value) => {
    const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: value };
    setAnswers(newAnswers);
    
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitSurvey(newAnswers);
    }
  };

  const submitSurvey = async (finalAnswers) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5001/api/survey/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, answers: finalAnswers }),
      });
      if (!response.ok) throw new Error('Failed to analyze survey');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error submitting survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto pt-20 px-6">
      <div className="mb-12">
        <div className="h-1 w-full bg-white/10 rounded-full mb-8">
          <div 
            className="h-full bg-[#10b981] rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Investment Survey</h1>
        <p className="text-gray-400">Step {currentStep + 1} of {QUESTIONS.length}</p>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-semibold mb-8">{QUESTIONS[currentStep].question}</h2>
        <div className="space-y-4">
          {QUESTIONS[currentStep].options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              disabled={isSubmitting}
              className="w-full text-left p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#10b981] transition-all group flex items-center justify-between"
            >
              <span className="font-medium">{option.label}</span>
              <div className="w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-[#10b981] transition-colors"></div>
            </button>
          ))}
        </div>
      </div>

      {isSubmitting && (
        <div className="mt-8 text-center animate-pulse">
          <p className="text-[#10b981] font-semibold">AI is analyzing your profile and generating a plan...</p>
        </div>
      )}
    </div>
  );
}
