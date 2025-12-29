"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiguService = void 0;
const common_1 = require("@nestjs/common");
let DiguService = class DiguService {
    cardValues = {
        'A': 15,
        'K': 10, 'Q': 10, 'J': 10,
        '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
    };
    rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    botNames = [
        'Bot Aisha 🤖',
        'Bot Ahmed 🤖',
        'Bot Hana 🤖',
        'Bot Zain 🤖',
    ];
    addLog(gameState, message) {
        if (!gameState.gameLog) {
            gameState.gameLog = [];
        }
        gameState.gameLog.push(message);
        if (gameState.gameLog.length > 100) {
            gameState.gameLog = gameState.gameLog.slice(-100);
        }
    }
    createDeck() {
        const suits = ['S', 'H', 'D', 'C'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        return this.shuffle(deck);
    }
    shuffle(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }
    dealCards(gameState) {
        const deck = this.createDeck();
        gameState.players.forEach(player => {
            player.hand = deck.splice(0, 10);
            player.melds = [];
            player.hasKnocked = false;
            player.roundScore = 0;
        });
        gameState.deck = deck.slice(0, -1);
        gameState.discardPile = [deck[deck.length - 1]];
        this.addLog(gameState, `🎴 Round ${gameState.currentRound} started! Each player dealt 10 cards.`);
    }
    fillWithBots(gameState) {
        const humanCount = gameState.players.filter(p => !p.isBot).length;
        const botsNeeded = 4 - gameState.players.length;
        for (let i = 0; i < botsNeeded; i++) {
            const botIndex = humanCount + i;
            const bot = {
                id: `bot-${Date.now()}-${i}`,
                name: this.botNames[botIndex % this.botNames.length],
                hand: [],
                isBot: true,
                socketId: '',
                melds: [],
                roundScore: 0,
                totalScore: 0,
                hasKnocked: false,
                hasDropped: false,
            };
            gameState.players.push(bot);
        }
        this.addLog(gameState, `🤖 ${botsNeeded} bot(s) joined the game`);
    }
    validateMeld(cards) {
        if (cards.length < 3) {
            return { isValid: false, message: 'Meld must have at least 3 cards' };
        }
        const allSameRank = cards.every(c => c.rank === cards[0].rank);
        if (allSameRank) {
            return { isValid: true, type: 'set' };
        }
        const allSameSuit = cards.every(c => c.suit === cards[0].suit);
        if (!allSameSuit) {
            return { isValid: false, message: 'Run must be same suit' };
        }
        const sortedCards = [...cards].sort((a, b) => this.rankOrder.indexOf(a.rank) - this.rankOrder.indexOf(b.rank));
        for (let i = 0; i < sortedCards.length; i++) {
            if (sortedCards[i].rank === 'A') {
                return { isValid: false, message: 'Ace cannot be in runs (Ace = 15 points)' };
            }
            if (i > 0) {
                const prevIndex = this.rankOrder.indexOf(sortedCards[i - 1].rank);
                const currIndex = this.rankOrder.indexOf(sortedCards[i].rank);
                if (currIndex !== prevIndex + 1) {
                    return { isValid: false, message: 'Run must be consecutive ranks' };
                }
            }
        }
        return { isValid: true, type: 'run' };
    }
    calculateDeadwood(hand, melds) {
        const meldedCards = new Set(melds.flatMap(m => m.cards.map(c => `${c.rank}${c.suit}`)));
        const deadwoodCards = hand.filter(c => !meldedCards.has(`${c.rank}${c.suit}`));
        return deadwoodCards.reduce((sum, card) => sum + this.cardValues[card.rank], 0);
    }
    canKnock(player) {
        const meldedCards = new Set(player.melds.flatMap(m => m.cards.map(c => `${c.rank}${c.suit}`)));
        const deadwoodCards = player.hand.filter(c => !meldedCards.has(`${c.rank}${c.suit}`));
        if (player.hand.length === 10) {
            return deadwoodCards.length === 0;
        }
        if (player.hand.length === 11) {
            return deadwoodCards.length === 1;
        }
        return false;
    }
    checkBigDigu(player) {
        const totalMeldedCards = player.melds.reduce((sum, meld) => sum + meld.cards.length, 0);
        return totalMeldedCards === 10;
    }
    processKnock(gameState, playerId) {
        const knocker = gameState.players.find(p => p.id === playerId);
        if (!knocker)
            throw new Error('Player not found');
        if (knocker.hand.length === 11) {
            const meldedCards = new Set(knocker.melds.flatMap(m => m.cards.map(c => `${c.rank}${c.suit}`)));
            const deadwoodCards = knocker.hand.filter(c => !meldedCards.has(`${c.rank}${c.suit}`));
            if (deadwoodCards.length === 1) {
                const discardCard = deadwoodCards[0];
                knocker.hand = knocker.hand.filter(c => !(c.suit === discardCard.suit && c.rank === discardCard.rank));
                gameState.discardPile.push(discardCard);
                this.addLog(gameState, `🔔 ${knocker.name} discards ${discardCard.rank}${discardCard.suit} and knocks!`);
            }
        }
        else {
            this.addLog(gameState, `🔔 ${knocker.name} knocks!`);
        }
        knocker.hasKnocked = true;
        gameState.knockedPlayerId = playerId;
        const scores = {};
        const deadwood = {};
        const melds = {};
        const bonuses = {};
        const knockerDeadwood = this.calculateDeadwood(knocker.hand, knocker.melds);
        deadwood[knocker.id] = knockerDeadwood;
        melds[knocker.id] = knocker.melds;
        bonuses[knocker.id] = [];
        const isBigDigu = this.checkBigDigu(knocker);
        const isGin = knockerDeadwood === 0;
        const winnerMeldPoints = knocker.melds.reduce((sum, meld) => {
            return sum + meld.cards.reduce((cardSum, card) => cardSum + this.cardValues[card.rank], 0);
        }, 0);
        const winnerTotalRoundPoints = winnerMeldPoints + 100;
        scores[knocker.id] = winnerTotalRoundPoints;
        bonuses[knocker.id].push(`Melds: ${winnerMeldPoints}`);
        bonuses[knocker.id].push('Winner Bonus (+100)');
        this.addLog(gameState, `✨ ${knocker.name} wins! (+${winnerTotalRoundPoints} points)`);
        let winnerId = knocker.id;
        gameState.players.forEach(p => {
            if (p.id !== knocker.id && !p.hasDropped) {
                const playerDeadwood = this.calculateDeadwood(p.hand, p.melds);
                const meldPoints = p.melds.reduce((sum, meld) => {
                    return sum + meld.cards.reduce((cardSum, card) => cardSum + this.cardValues[card.rank], 0);
                }, 0);
                deadwood[p.id] = playerDeadwood;
                melds[p.id] = p.melds;
                bonuses[p.id] = [];
                const roundScore = meldPoints - playerDeadwood;
                scores[p.id] = roundScore;
                p.totalScore += roundScore;
            }
        });
        const winner = gameState.players.find(p => p.id === knocker.id);
        if (winner) {
            winner.roundScore = scores[knocker.id];
            winner.totalScore += scores[knocker.id];
        }
        Object.entries(scores).forEach(([playerId, score]) => {
            if (playerId !== knocker.id) {
                const player = gameState.players.find(p => p.id === playerId);
                if (player) {
                    player.roundScore = score;
                }
            }
        });
        return { winnerId, scores, melds, deadwood, bonuses };
    }
    botTurn(gameState, botPlayer) {
        const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
        const wouldFormMeld = this.wouldCardHelpMeld(botPlayer.hand, topDiscard);
        if (wouldFormMeld && Math.random() > 0.3 && gameState.discardPile.length > 0) {
            botPlayer.hand.push(gameState.discardPile.pop());
            this.addLog(gameState, `${botPlayer.name} drew from discard pile`);
        }
        else {
            if (gameState.deck.length === 0) {
                if (gameState.discardPile.length > 1) {
                    const topCard = gameState.discardPile.pop();
                    gameState.deck = this.shuffle([...gameState.discardPile]);
                    gameState.discardPile = [topCard];
                    this.addLog(gameState, `🔄 Deck reshuffled from discard pile`);
                }
                else {
                    this.addLog(gameState, `⚠️ Deck and discard empty, cannot draw.`);
                    return;
                }
            }
            if (gameState.deck.length > 0) {
                botPlayer.hand.push(gameState.deck.pop());
                this.addLog(gameState, `${botPlayer.name} drew from deck`);
            }
        }
        botPlayer.melds = this.findBestMelds(botPlayer.hand);
        const worstCard = this.findWorstCard(botPlayer.hand, botPlayer.melds);
        botPlayer.hand = botPlayer.hand.filter(c => c !== worstCard);
        gameState.discardPile.push(worstCard);
        if (this.canKnock(botPlayer) && Math.random() > 0.4) {
            this.addLog(gameState, `🤖 ${botPlayer.name} is ready to knock!`);
            botPlayer.hasKnocked = true;
        }
    }
    wouldCardHelpMeld(hand, card) {
        return hand.some(c => c.rank === card.rank ||
            (c.suit === card.suit && Math.abs(this.rankOrder.indexOf(c.rank) - this.rankOrder.indexOf(card.rank)) <= 2));
    }
    findBestMelds(hand) {
        const melds = [];
        const used = new Set();
        const rankGroups = new Map();
        hand.forEach(card => {
            if (!rankGroups.has(card.rank))
                rankGroups.set(card.rank, []);
            rankGroups.get(card.rank).push(card);
        });
        rankGroups.forEach((cards, rank) => {
            if (cards.length >= 3) {
                melds.push({ type: 'set', cards: cards.slice(0, Math.min(4, cards.length)) });
                cards.forEach(c => used.add(`${c.rank}${c.suit}`));
            }
        });
        const suits = ['S', 'H', 'D', 'C'];
        suits.forEach(suit => {
            const suitCards = hand
                .filter(c => c.suit === suit && !used.has(`${c.rank}${c.suit}`) && c.rank !== 'A')
                .sort((a, b) => this.rankOrder.indexOf(a.rank) - this.rankOrder.indexOf(b.rank));
            let run = [];
            for (let i = 0; i < suitCards.length; i++) {
                if (run.length === 0 ||
                    this.rankOrder.indexOf(suitCards[i].rank) === this.rankOrder.indexOf(run[run.length - 1].rank) + 1) {
                    run.push(suitCards[i]);
                }
                else {
                    if (run.length >= 3) {
                        melds.push({ type: 'run', cards: [...run] });
                        run.forEach(c => used.add(`${c.rank}${c.suit}`));
                    }
                    run = [suitCards[i]];
                }
            }
            if (run.length >= 3) {
                melds.push({ type: 'run', cards: run });
            }
        });
        return melds;
    }
    findWorstCard(hand, melds) {
        const meldedCards = new Set(melds.flatMap(m => m.cards.map(c => `${c.rank}${c.suit}`)));
        const deadwood = hand.filter(c => !meldedCards.has(`${c.rank}${c.suit}`));
        if (deadwood.length > 0) {
            return deadwood.reduce((worst, card) => this.cardValues[card.rank] > this.cardValues[worst.rank] ? card : worst);
        }
        return hand[0];
    }
    handleDrop(gameState, playerId) {
        const player = gameState.players.find(p => p.id === playerId);
        if (!player)
            return;
        player.hasDropped = true;
        const deadwood = this.calculateDeadwood(player.hand, player.melds);
        const penalty = 25 + deadwood;
        this.addLog(gameState, `❌ ${player.name} dropped! (-${penalty} points)`);
        const activePlayers = gameState.players.filter(p => !p.hasDropped && p.id !== playerId);
        const bonusPerPlayer = Math.floor(penalty / activePlayers.length);
        activePlayers.forEach(p => {
            p.totalScore += bonusPerPlayer;
        });
    }
};
exports.DiguService = DiguService;
exports.DiguService = DiguService = __decorate([
    (0, common_1.Injectable)()
], DiguService);
//# sourceMappingURL=digu.service.js.map