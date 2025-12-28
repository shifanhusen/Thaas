import Link from 'next/link';

export default function DiguRules() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-4xl font-bold text-white">🃏 Digu (Gin Rummy) Rules</h1>
          <Link href="/games/digu" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
            Play Now
          </Link>
        </div>

        <div className="space-y-6 text-white">
          {/* Overview */}
          <section>
            <h2 className="text-2xl font-bold mb-3">📖 Overview</h2>
            <p className="text-white/90 leading-relaxed">
              Digu is a variant of Gin Rummy played with 4 players (human players are automatically filled with bots). 
              The goal is to form valid melds (sets or runs) and minimize deadwood (unmelded cards) to score points. 
              First player to reach 100 points wins!
            </p>
          </section>

          {/* Card Values */}
          <section>
            <h2 className="text-2xl font-bold mb-3">💰 Card Values</h2>
            <ul className="list-disc list-inside space-y-2 text-white/90">
              <li><strong>Ace:</strong> 15 points (⚠️ Special Rule: Can only be used in sets, NOT in runs!)</li>
              <li><strong>King, Queen, Jack:</strong> 10 points each</li>
              <li><strong>Number cards (2-10):</strong> Face value</li>
            </ul>
          </section>

          {/* Melds */}
          <section>
            <h2 className="text-2xl font-bold mb-3">🎯 Valid Melds</h2>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Set (Same Rank)</h3>
                <p className="text-white/80">3 or 4 cards of the same rank (any suits)</p>
                <p className="text-sm text-green-300 mt-1">Example: 7♠ 7♥ 7♦ or A♠ A♥ A♦ A♣</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Run (Consecutive Sequence)</h3>
                <p className="text-white/80">3+ consecutive cards of the same suit</p>
                <p className="text-sm text-green-300 mt-1">Example: 4♥ 5♥ 6♥ or J♠ Q♠ K♠</p>
                <p className="text-sm text-red-300 mt-1">❌ Invalid: A♥ 2♥ 3♥ (Ace cannot be in runs!)</p>
              </div>
            </div>
          </section>

          {/* Gameplay */}
          <section>
            <h2 className="text-2xl font-bold mb-3">🎮 How to Play</h2>
            <ol className="list-decimal list-inside space-y-3 text-white/90">
              <li>Each player is dealt 10 cards to start</li>
              <li>On your turn:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Draw 1 card from the deck or discard pile</li>
                  <li>Discard 1 card to the discard pile</li>
                </ul>
              </li>
              <li>Build melds in secret (they're hidden until you knock)</li>
              <li>When your deadwood is 10 or less, you can knock</li>
              <li>All players reveal their melds and calculate scores</li>
            </ol>
          </section>

          {/* Knocking and Scoring */}
          <section>
            <h2 className="text-2xl font-bold mb-3">🔔 Knocking & Scoring</h2>
            <div className="space-y-3 text-white/90">
              <p><strong>Knock:</strong> When deadwood ≤ 10, you can knock to end the round</p>
              <ul className="list-disc list-inside ml-6 space-y-2">
                <li><strong>Normal Knock:</strong> Knocker scores = (Opponent's deadwood - Knocker's deadwood)</li>
                <li><strong>Gin Bonus:</strong> If deadwood = 0, you score opponent's deadwood + 25 bonus</li>
                <li><strong>Big Digu Bonus:</strong> If all 10 initial cards form melds, you get +50 bonus!</li>
                <li><strong>Undercut:</strong> If opponent has ≤ knocker's deadwood, they score the difference + 25</li>
              </ul>
            </div>
          </section>

          {/* Drop Penalty */}
          <section>
            <h2 className="text-2xl font-bold mb-3">❌ Drop Penalty</h2>
            <p className="text-white/90">
              You can drop out of a round at any time, but you'll receive a penalty:
            </p>
            <div className="bg-red-500/20 p-4 rounded-lg mt-2 border border-red-400">
              <p className="font-semibold">Penalty = 25 + your current deadwood</p>
              <p className="text-sm mt-1">This penalty is distributed among remaining players</p>
            </div>
          </section>

          {/* End Game Voting */}
          <section>
            <h2 className="text-2xl font-bold mb-3">🗳️ End Game Voting</h2>
            <p className="text-white/90">
              After each round, players vote whether to end the game or continue:
            </p>
            <ul className="list-disc list-inside ml-6 space-y-1 text-white/90 mt-2">
              <li>30-second voting window</li>
              <li>Majority wins (ties default to end game)</li>
              <li>If no vote, automatically votes "end game"</li>
            </ul>
          </section>

          {/* Winning */}
          <section>
            <h2 className="text-2xl font-bold mb-3">🏆 Winning the Game</h2>
            <p className="text-white/90">
              The game ends when:
            </p>
            <ul className="list-disc list-inside ml-6 space-y-1 text-white/90 mt-2">
              <li>A player reaches 100 points (target score)</li>
              <li>Only 1 player remains (others dropped)</li>
              <li>Majority votes to end after a round</li>
            </ul>
          </section>

          {/* Strategy Tips */}
          <section>
            <h2 className="text-2xl font-bold mb-3">💡 Strategy Tips</h2>
            <ul className="list-disc list-inside space-y-2 text-white/90">
              <li>Remember: Aces = 15 points but can't be in runs!</li>
              <li>Watch the discard pile - it reveals opponent strategies</li>
              <li>Don't rush to knock - opponents might undercut you</li>
              <li>Keep track of which cards have been discarded</li>
              <li>Balance forming melds with reducing deadwood</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <Link href="/" className="text-white/80 hover:text-white underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
