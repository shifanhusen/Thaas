import Link from 'next/link';

export default function BondiRules() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-8 block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold mb-8">Bondi Rules</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Objective</h2>
          <p>The objective is to LOSE all your cards. The first player to reach 0 cards wins 1st place, and so on.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Setup</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Standard 52-card deck, NO jokers.</li>
            <li>2 to 8 players.</li>
            <li>All cards are dealt evenly. Some players may have 1 extra card.</li>
            <li>Rank Order: 2 &lt; 3 &lt; ... &lt; 10 &lt; J &lt; Q &lt; K &lt; A.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Gameplay</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Start:</strong> Player with Ace of Spades (A♠) starts. They can lead with ANY card.</li>
            <li><strong>Leading Suit:</strong> The first card played sets the leading suit.</li>
            <li><strong>Follow Suit:</strong> If you have the leading suit, you MUST play it.</li>
            <li><strong>Off-Suit (Interrupt):</strong> If you cannot follow suit, you can play any card. This INTERRUPTS the trick.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Winning a Trick</h2>
          <div className="bg-gray-800 p-4 rounded border border-gray-700 mb-4">
            <h3 className="font-bold mb-2">Non-Interrupted Trick (All followed suit)</h3>
            <p>Highest leading-suit card wins. Cards are discarded (removed from game). Winner leads next.</p>
          </div>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <h3 className="font-bold mb-2">Interrupted Trick (Someone played off-suit)</h3>
            <p>Trick ends immediately. Highest leading-suit player takes ALL cards played into their hand. Winner leads next.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-400">Finishing</h2>
          <p>You can only finish on a non-interrupted trick. If you play your last card and win the trick:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>You become a spectator.</li>
            <li>The next leader is the player who played the NEXT highest leading-suit card in that trick.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
