import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToLeaderboard } from '../services/users';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setUsers(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center mb-8 gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-neutral-800 rounded-lg text-neutral-300 transition-all duration-300 ease-out transform hover:scale-105 border border-transparent hover:border-blue-500/30 hover:bg-neutral-800/80 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Community Leaderboard
            </h1>
            <p className="text-neutral-400 text-sm">Top contributors making an impact</p>
          </div>
        </header>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-10 flex justify-center text-neutral-500">Loading civic heroes...</div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-neutral-500">No contributors yet. Be the first to report!</div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {users.map((user, idx) => (
                <div 
                  key={user.id} 
                  className={`flex items-center p-5 transition-colors ${
                    currentUser?.uid === user.id ? 'bg-indigo-900/20 border-l-4 border-indigo-500' : 'hover:bg-neutral-900 border-l-4 border-transparent'
                  }`}
                >
                  <div className="w-12 text-center flex-none">
                    {user.rank === 1 ? (
                      <span className="text-2xl">🥇</span>
                    ) : user.rank === 2 ? (
                      <span className="text-2xl">🥈</span>
                    ) : user.rank === 3 ? (
                      <span className="text-2xl">🥉</span>
                    ) : (
                      <span className="text-xl font-bold text-neutral-500">#{user.rank}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 px-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {user.displayName}
                      {currentUser?.uid === user.id && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">You</span>
                      )}
                    </h3>
                    <div className="text-sm text-neutral-400">
                      {user.reportsCount} Reports • {user.verificationsCount} Verifications
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 px-4 border-l border-neutral-800">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="text-neutral-300 font-medium">{user.badges?.length || 0} Badges</span>
                  </div>

                  <div className="text-right pl-4 border-l border-neutral-800 flex flex-col items-end w-24">
                    <div className="text-2xl font-bold text-white">{user.points || 0}</div>
                    <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
