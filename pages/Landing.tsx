import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, Image as ImageIcon, BrainCircuit } from 'lucide-react';
import Button from '../components/Button';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-anime-dark text-white overflow-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-anime-primary opacity-20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-anime-accent opacity-20 blur-[100px] rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 py-24 relative z-10 flex flex-col items-center text-center">
        
        <div className="mb-8 inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
           <span className="text-anime-accent font-bold text-sm tracking-widest uppercase">AI-Powered Immersion</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Master CJK Languages <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-anime-primary to-anime-accent">
            Inside Your Own Anime
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop memorizing flashcards. Build a living story where you are the protagonist. 
            Learn Chinese, Japanese, or Korean through context-aware visuals and adaptive storytelling.
        </p>

        <Button 
            onClick={() => navigate('/builder')} 
            className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all"
        >
            Start Your Journey <ArrowRight className="ml-2" />
        </Button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="bg-anime-primary/20 p-3 rounded-lg w-fit mb-4 text-anime-primary">
                    <ImageIcon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Visual Context</h3>
                <p className="text-gray-400">Generates consistent, high-quality anime art for every scene to reinforce meaning through visual association.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="bg-anime-accent/20 p-3 rounded-lg w-fit mb-4 text-anime-accent">
                    <BrainCircuit size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Adaptive AI</h3>
                <p className="text-gray-400">The story adapts to your proficiency level (N5-N1), introducing new grammar and vocab naturally.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="bg-indigo-500/20 p-3 rounded-lg w-fit mb-4 text-indigo-400">
                    <MessageCircle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Live Feedback</h3>
                <p className="text-gray-400">Instant translations, grammar breakdowns, and comprehension quizzes embedded directly in the narrative.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;