import Link from 'next/link';

export default function Home() {
  const games = [
    {
      id: 'bondi',
      name: 'Bondi',
      description: 'A strategic card game where the goal is to lose all your cards. 2-8 players.',
      players: '2-8',
      status: 'Playable',
    },
    {
      id: 'digu',
      name: 'Digu',
      description: 'Coming soon.',
      players: 'TBD',
      status: 'Coming Soon',
    },
    {
      id: 'dhihaeh',
      name: 'Dhihaeh',
      description: 'Coming soon.',
      players: 'TBD',
      status: 'Coming Soon',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Card Game Platform</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {games.map((game) => (
          <div key={game.id} className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-700">
            <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
            <p className="text-gray-400 mb-4">{game.description}</p>
            <div className="flex justify-between items-center mb-6">
              <span className="bg-gray-700 px-3 py-1 rounded text-sm">{game.players} Players</span>
              <span className={`px-3 py-1 rounded text-sm ${game.status === 'Playable' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                {game.status}
              </span>
            </div>
            <div className="flex gap-4">
              <Link href={`/games/${game.id}/rules`} className="flex-1 bg-gray-700 hover:bg-gray-600 text-center py-2 rounded transition-colors">
                Rules
              </Link>
              {game.status === 'Playable' ? (
                <Link href={`/games/${game.id}`} className="flex-1 bg-blue-600 hover:bg-blue-500 text-center py-2 rounded transition-colors">
                  Play
                </Link>
              ) : (
                <button disabled className="flex-1 bg-gray-600 text-gray-400 cursor-not-allowed py-2 rounded">
                  Play
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Bondi Rules Summary</h2>
        <p className="mb-4">
          Bondi is a game where the objective is to lose all your cards. The player with the Ace of Spades starts.
          You must follow the suit led. If you cannot follow suit, you play any card, interrupting the trick.
          The highest card of the leading suit wins the trick. If the trick was interrupted, the winner takes all cards!
        </p>
        <Link href="/games/bondi/rules" className="text-blue-400 hover:underline">Read full rules &rarr;</Link>
      </div>
    </main>
  );
}
