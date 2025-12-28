import { Card, GameState, Player } from './types';
export declare class BondiService {
    private readonly rankValues;
    private addLog;
    private getCardName;
    private updateLeadingPlayer;
    createDeck(): Card[];
    private shuffle;
    dealCards(players: Player[], deck: Card[]): Player[];
    isValidMove(gameState: GameState, player: Player, card: Card): boolean;
    processTurn(gameState: GameState, player: Player, card: Card): GameState;
    private checkWinCondition;
    private resolveInterruptedTrick;
    private resolveCompleteTrick;
    private getTrickWinner;
    private getNextPlayerIndex;
}
