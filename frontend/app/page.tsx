import Link from 'next/link';

export default function Home() {
  const games = [
    {
      id: 'bondi',
      name: 'Bondi',
      description: 'The classic trick-taking game where strategy meets intuition. Outsmart your opponents and avoid the traps.',
      status: 'Playable',
    },
    {
      id: 'digu',
      name: 'Digu (Gin Rummy)',
      description: 'Form sets and runs to minimize deadwood. Knock when ready and score points. Ace = 15!',
      status: 'Playable',
    },
    {
      id: 'dhihaeh',
      name: 'Dhihaeh',
      description: 'A fast-paced point-collection game. Coming soon to the platform.',
      status: 'Coming Soon',
    },
  ];

  return (
    <main className="min-h-screen bg-[#020617] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 mt-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-7xl font-black tracking-tighter mb-4">THAAS</h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                The Maldivian Card Game Platform.
                <br />
                Play your favorite classic games with friends or challenge our AI.
              </p>
            </div>
            <Link 
              href="/history" 
              className="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-full transition-colors border border-gray-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Game History
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="bg-[#0f172a] rounded-2xl p-8 border border-gray-800 flex flex-col h-96 relative overflow-hidden group hover:border-gray-600 transition-colors"
            >
              <div className="relative z-10 flex flex-col h-full">
                <h2 className="text-3xl font-bold mb-4">{game.name}</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {game.description}
                </p>
                
                <div className="mt-auto">
                  {game.status === 'Playable' ? (
                    <Link 
                      href={`/games/${game.id}`} 
                      className="inline-flex items-center bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-full transition-colors"
                    >
                      Play Now <span className="ml-2">→</span>
                    </Link>
                  ) : (
                    <div className="flex items-center text-gray-500 font-medium">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      COMING SOON
                    </div>
                  )}
                </div>
              </div>
              
              {/* Decorative gradient glow */}
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
