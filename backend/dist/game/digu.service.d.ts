import { Card, DiguPlayer, DiguGameState, Meld, MeldValidation, RoundResult } from './digu.types';
export declare class DiguService {
    private readonly cardValues;
    private readonly rankOrder;
    private botNames;
    private addLog;
    createDeck(): Card[];
    shuffle(deck: Card[]): Card[];
    dealCards(gameState: DiguGameState): void;
    fillWithBots(gameState: DiguGameState): void;
    validateMeld(cards: Card[]): MeldValidation;
    calculateDeadwood(hand: Card[], melds: Meld[]): number;
    canKnock(player: DiguPlayer): boolean;
    checkBigDigu(player: DiguPlayer): boolean;
    processKnock(gameState: DiguGameState, playerId: string): RoundResult;
    botTurn(gameState: DiguGameState, botPlayer: DiguPlayer): void;
    private wouldCardHelpMeld;
    private findBestMelds;
    private findWorstCard;
    handleDrop(gameState: DiguGameState, playerId: string): void;
}
