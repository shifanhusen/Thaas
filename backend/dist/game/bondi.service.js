"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BondiService = void 0;
const common_1 = require("@nestjs/common");
let BondiService = class BondiService {
    rankValues = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    };
    addLog(gameState, message) {
        if (!gameState.gameLog) {
            gameState.gameLog = [];
        }
        gameState.gameLog.push(message);
        if (gameState.gameLog.length > 50) {
            gameState.gameLog = gameState.gameLog.slice(-50);
        }
    }
    getCardName(card) {
        const suitNames = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
        return `${card.rank}${suitNames[card.suit]}`;
    }
    updateLeadingPlayer(gameState) {
        if (gameState.currentTrick.length === 0) {
            gameState.leadingPlayerId = undefined;
            return;
        }
        const leadingSuit = gameState.leadingSuit;
        if (!leadingSuit) {
            gameState.leadingPlayerId = gameState.currentTrick[0].playerId;
            return;
        }
        let highestCard = gameState.currentTrick[0];
        for (const move of gameState.currentTrick) {
            if (move.card.suit === leadingSuit) {
                if (highestCard.card.suit !== leadingSuit ||
                    this.rankValues[move.card.rank] > this.rankValues[highestCard.card.rank]) {
                    highestCard = move;
                }
            }
        }
        gameState.leadingPlayerId = highestCard.playerId;
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
    dealCards(players, deck) {
        let playerIndex = 0;
        while (deck.length > 0) {
            players[playerIndex].hand.push(deck.pop());
            playerIndex = (playerIndex + 1) % players.length;
        }
        return players;
    }
    isValidMove(gameState, player, card) {
        if (gameState.players[gameState.currentPlayerIndex].id !== player.id)
            return false;
        if (!player.hand.some(c => c.suit === card.suit && c.rank === card.rank))
            return false;
        if (gameState.leadingSuit) {
            const hasLeadingSuit = player.hand.some(c => c.suit === gameState.leadingSuit);
            if (hasLeadingSuit && card.suit !== gameState.leadingSuit) {
                return false;
            }
        }
        return true;
    }
    processTurn(gameState, player, card) {
        if (gameState.currentTrick.length === 0 && gameState.lastCompletedTrick) {
            gameState.lastCompletedTrick = undefined;
        }
        player.hand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
        gameState.currentTrick.push({ playerId: player.id, card });
        this.addLog(gameState, `${player.name} played ${this.getCardName(card)}`);
        if (!gameState.leadingSuit) {
            gameState.leadingSuit = card.suit;
            const suitNames = { 'S': 'Spades', 'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs' };
            this.addLog(gameState, `Leading suit: ${suitNames[card.suit]}`);
        }
        this.updateLeadingPlayer(gameState);
        const isInterrupted = card.suit !== gameState.leadingSuit;
        if (isInterrupted) {
            this.addLog(gameState, `⚠️ Suit interrupted! ${player.name} played off-suit`);
            return this.resolveInterruptedTrick(gameState);
        }
        const activePlayers = gameState.players.filter(p => !p.isSpectator);
        if (gameState.currentTrick.length === activePlayers.length) {
            return this.resolveCompleteTrick(gameState);
        }
        gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
        return gameState;
    }
    checkWinCondition(gameState) {
        gameState.players.forEach(p => {
            if (p.hand.length === 0 && !p.isSpectator) {
                if (!gameState.winners.some(w => w.id === p.id)) {
                    gameState.winners.push(p);
                    p.isSpectator = true;
                    const position = gameState.winners.length;
                    const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
                    this.addLog(gameState, `🏆 ${p.name} finished ${position}${suffix}!`);
                }
            }
        });
        const activePlayers = gameState.players.filter(p => !p.isSpectator);
        if (activePlayers.length <= 1) {
            if (activePlayers.length === 1) {
                gameState.winners.push(activePlayers[0]);
                this.addLog(gameState, `💀 ${activePlayers[0].name} is the loser`);
            }
            gameState.gameStatus = 'finished';
            this.addLog(gameState, `🎮 Game Over!`);
        }
    }
    resolveInterruptedTrick(gameState) {
        const winnerId = this.getTrickWinner(gameState.currentTrick, gameState.leadingSuit);
        const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
        const winner = gameState.players[winnerIndex];
        const cards = gameState.currentTrick.map(m => m.card);
        winner.hand.push(...cards);
        this.addLog(gameState, `${winner.name} won trick (+${cards.length} cards)`);
        gameState.lastCompletedTrick = [...gameState.currentTrick];
        gameState.currentTrick = [];
        gameState.leadingSuit = null;
        gameState.leadingPlayerId = undefined;
        gameState.currentPlayerIndex = winnerIndex;
        gameState.currentPlayerIndex = winnerIndex;
        this.checkWinCondition(gameState);
        return gameState;
    }
    resolveCompleteTrick(gameState) {
        const trick = [...gameState.currentTrick];
        const winnerId = this.getTrickWinner(trick, gameState.leadingSuit);
        const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
        const winner = gameState.players[winnerIndex];
        this.addLog(gameState, `${winner.name} won trick (cards discarded)`);
        gameState.lastCompletedTrick = [...gameState.currentTrick];
        gameState.currentTrick = [];
        gameState.leadingSuit = null;
        this.checkWinCondition(gameState);
        if (gameState.gameStatus === 'finished')
            return gameState;
        if (winner.isSpectator) {
            gameState.currentPlayerIndex = winnerIndex;
            gameState.currentPlayerIndex = this.getNextPlayerIndex(gameState);
        }
        else {
            gameState.currentPlayerIndex = winnerIndex;
        }
        return gameState;
    }
    getTrickWinner(trick, leadingSuit) {
        let highestRank = -1;
        let winnerId = '';
        for (const move of trick) {
            if (move.card.suit === leadingSuit) {
                const val = this.rankValues[move.card.rank];
                if (val > highestRank) {
                    highestRank = val;
                    winnerId = move.playerId;
                }
            }
        }
        return winnerId;
    }
    getNextPlayerIndex(gameState) {
        let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        let count = 0;
        while (gameState.players[nextIndex].isSpectator && count < gameState.players.length) {
            nextIndex = (nextIndex + 1) % gameState.players.length;
            count++;
        }
        return nextIndex;
    }
};
exports.BondiService = BondiService;
exports.BondiService = BondiService = __decorate([
    (0, common_1.Injectable)()
], BondiService);
//# sourceMappingURL=bondi.service.js.map