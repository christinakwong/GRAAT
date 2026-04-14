import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Play, 
  Edit3, 
  Home, 
  Trophy, 
  Settings, 
  HelpCircle,
  CloudRain,
  Droplets,
  Zap,
  Shield,
  Bath,
  Lock,
  RefreshCw,
  User,
  Bot,
  LogOut,
  RotateCcw
} from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "./lib/utils";
import { 
  CardType, 
  Card, 
  Character, 
  Player, 
  GameState, 
  CARD_DATA 
} from "./types";

const BOT_NAMES = ["PixelBot", "BitBuddy", "Glitch", "Cyber", "Voxel"];

const STARS = Array.from({ length: 80 }).map((_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2 + 1,
  opacity: Math.random() * 0.7 + 0.3,
}));

const getRandomCardType = (): CardType => {
  const r = Math.random() * 100;
  if (r < 18.5) return CardType.HOUSE;
  if (r < 18.5 + 7.4) return CardType.MUD_RAIN;
  if (r < 18.5 + 7.4 + 14.8) return CardType.MUD_BUCKET;
  if (r < 18.5 + 7.4 + 14.8 + 38.9) return CardType.BATHTUB;
  if (r < 18.5 + 7.4 + 14.8 + 38.9 + 5.56) return CardType.LIGHTNING_ROD;
  if (r < 18.5 + 7.4 + 14.8 + 38.9 + 5.56 + 7.4) return CardType.LIGHTNING;
  return CardType.LOCK_DOOR;
};

const createCard = (type?: CardType): Card => {
  const cardType = type || getRandomCardType();
  return {
    id: Math.random().toString(36).substr(2, 9),
    type: cardType,
    ...CARD_DATA[cardType],
  };
};

const createCharacter = (): Character => ({
  id: Math.random().toString(36).substr(2, 9),
  isDirty: true,
  hasHouse: false,
  hasLightningRod: false,
  hasLock: false,
  imageSeed: Math.random().toString(36).substr(2, 5),
});

export default function App() {
  const [gameState, setGameState] = useState<GameState>("TITLE");
  const [playerName, setPlayerName] = useState("");
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const setGameLogSafe = (message: string) => {
    setGameLog(prev => {
      if (prev[0] === message) return prev;
      return [message, ...prev.slice(0, 4)];
    });
  };

  const initGame = () => {
    if (!playerName.trim()) return;

    const charCount = playerCount === 2 ? 5 : playerCount === 3 ? 4 : 3;
    
    // Create players
    const newPlayers: Player[] = [];
    
    // Human player
    newPlayers.push({
      id: "player-1",
      name: playerName,
      isBot: false,
      characters: Array.from({ length: charCount }, createCharacter),
      hand: Array.from({ length: 3 }, () => createCard()),
    });

    // Bot players
    const filteredBotNames = BOT_NAMES.filter(name => name.toLowerCase() !== playerName.trim().toLowerCase());
    const shuffledBotNames = [...filteredBotNames].sort(() => Math.random() - 0.5);
    for (let i = 1; i < playerCount; i++) {
      newPlayers.push({
        id: `bot-${i}`,
        name: shuffledBotNames[i - 1],
        isBot: true,
        characters: Array.from({ length: charCount }, createCharacter),
        hand: Array.from({ length: 3 }, () => createCard()),
      });
    }

    setPlayers(newPlayers);
    setDiscardPile([]);
    setCurrentPlayerIndex(0);
    setWinner(null);
    setSelectedCard(null);
    setIsProcessingTurn(false);
    setGameState("GAME");
    setGameLog(["Game started! Good luck!"]);
  };

  const drawCards = (playerIndex: number, count: number) => {
    const cardsToDraw = Array.from({ length: count }, () => createCard());

    setPlayers(prevPlayers => {
      const updated = [...prevPlayers];
      if (!updated[playerIndex]) return prevPlayers;
      
      const combinedHand = [...updated[playerIndex].hand, ...cardsToDraw];
      updated[playerIndex].hand = combinedHand.slice(0, 3);
      return updated;
    });
  };

  const checkWinCondition = useCallback((updatedPlayers: Player[]) => {
    const winnerPlayer = updatedPlayers.find(p => p.characters.every(c => !c.isDirty));
    if (winnerPlayer) {
      setWinner(winnerPlayer);
      setGameState("WIN");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      return true;
    }
    return false;
  }, []);

  const nextTurn = useCallback(() => {
    setCurrentPlayerIndex(prev => (prev + 1) % players.length);
  }, [players.length]);

  const canPlayCard = useCallback((card: Card, player: Player, targetPlayer?: Player, targetCharIndex?: number): boolean => {
    const targetChar = targetPlayer?.characters[targetCharIndex ?? -1];
    
    switch (card.type) {
      case CardType.MUD_RAIN:
        return true;
      case CardType.MUD_BUCKET:
        if (!targetChar || targetPlayer?.id === player.id) return false;
        return !targetChar.isDirty && !targetChar.hasLock;
      case CardType.HOUSE:
        if (!targetChar || targetPlayer?.id !== player.id) return false;
        return !targetChar.hasHouse;
      case CardType.LIGHTNING:
        if (!targetChar || targetPlayer?.id === player.id) return false;
        return targetChar.hasHouse && !targetChar.hasLightningRod;
      case CardType.LIGHTNING_ROD:
        if (!targetChar || targetPlayer?.id !== player.id) return false;
        return targetChar.hasHouse && !targetChar.hasLightningRod;
      case CardType.BATHTUB:
        if (!targetChar || targetPlayer?.id !== player.id) return false;
        return targetChar.isDirty;
      case CardType.LOCK_DOOR:
        if (!targetChar || targetPlayer?.id !== player.id) return false;
        return targetChar.hasHouse && !targetChar.isDirty && !targetChar.hasLock;
      default:
        return false;
    }
  }, []);

  const hasPlayableCard = useCallback((player: Player) => {
    return player.hand.some(card => {
      if (card.type === CardType.MUD_RAIN) return true;
      return players.some(p => p.characters.some((_, idx) => canPlayCard(card, player, p, idx)));
    });
  }, [players, canPlayCard]);

  const playCard = (cardId: string, targetPlayerId?: string, targetCharIndex?: number) => {
    if (isProcessingTurn) return;
    
    const currentPlayer = players[currentPlayerIndex];
    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    const targetPlayer = players.find(p => p.id === targetPlayerId);
    
    if (!canPlayCard(card, currentPlayer, targetPlayer, targetCharIndex)) {
      if (!currentPlayer.isBot) {
        setGameLog(prev => ["Invalid move!", ...prev.slice(0, 4)]);
      }
      return;
    }

    setIsProcessingTurn(true);
    
    // 1. Apply Effects and Remove Card
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const pIdx = currentPlayerIndex;
      
      updatedPlayers[pIdx].hand = updatedPlayers[pIdx].hand.filter(c => c.id !== cardId);
      setDiscardPile(prev => [card, ...prev]);

      switch (card.type) {
        case CardType.MUD_RAIN:
          updatedPlayers.forEach(p => {
            p.characters.forEach(c => {
              if (!c.hasHouse) c.isDirty = true;
            });
          });
          setGameLogSafe(`${currentPlayer.name} played Mud Rain!`);
          break;
        case CardType.MUD_BUCKET:
          if (targetPlayer && targetCharIndex !== undefined) {
            const tIdx = updatedPlayers.findIndex(p => p.id === targetPlayerId);
            updatedPlayers[tIdx].characters[targetCharIndex].isDirty = true;
            setGameLogSafe(`${currentPlayer.name} used Mud Bucket on ${targetPlayer.name}'s character!`);
          }
          break;
        case CardType.HOUSE:
          if (targetCharIndex !== undefined) {
            updatedPlayers[pIdx].characters[targetCharIndex].hasHouse = true;
            setGameLogSafe(`${currentPlayer.name} built a House!`);
          }
          break;
        case CardType.LIGHTNING:
          if (targetPlayer && targetCharIndex !== undefined) {
            const tIdx = updatedPlayers.findIndex(p => p.id === targetPlayerId);
            const char = updatedPlayers[tIdx].characters[targetCharIndex];
            char.hasHouse = false;
            char.hasLock = false;
            setGameLogSafe(`Lightning struck ${targetPlayer.name}'s house!`);
          }
          break;
        case CardType.LIGHTNING_ROD:
          if (targetCharIndex !== undefined) {
            updatedPlayers[pIdx].characters[targetCharIndex].hasLightningRod = true;
            setGameLogSafe(`${currentPlayer.name} installed a Lightning Rod!`);
          }
          break;
        case CardType.BATHTUB:
          if (targetCharIndex !== undefined) {
            updatedPlayers[pIdx].characters[targetCharIndex].isDirty = false;
            setGameLogSafe(`${currentPlayer.name} cleaned a character!`);
          }
          break;
        case CardType.LOCK_DOOR:
          if (targetCharIndex !== undefined) {
            updatedPlayers[pIdx].characters[targetCharIndex].hasLock = true;
            setGameLogSafe(`${currentPlayer.name} locked the door!`);
          }
          break;
      }

      checkWinCondition(updatedPlayers);
      return updatedPlayers;
    });

    // 2. Draw 1 card and move to next turn
    setTimeout(() => {
      drawCards(currentPlayerIndex, 1);
      setSelectedCard(null);
      setIsProcessingTurn(false);
      nextTurn();
    }, 600);
  };

  const forfeitHand = () => {
    if (isProcessingTurn) return;
    
    const currentPlayer = players[currentPlayerIndex];
    setIsProcessingTurn(true);
    
    setGameLogSafe(`${currentPlayer.name} is showing their cards and forfeiting!`);
    
    setTimeout(() => {
      // Discard current hand
      setDiscardPile(prev => [...currentPlayer.hand, ...prev]);
      
      // Clear hand and draw 3 new cards in one atomic update
      setPlayers(prevPlayers => {
        const updatedPlayers = [...prevPlayers];
        updatedPlayers[currentPlayerIndex].hand = []; // Clear first
        return updatedPlayers;
      });

      // Draw exactly 3
      drawCards(currentPlayerIndex, 3);

      setIsProcessingTurn(false);
      setGameLogSafe(`${currentPlayer.name} got 3 new cards. They must play one!`);
    }, 1000);
  };

  // Bot Turn Logic
  useEffect(() => {
    if (gameState === "GAME" && players[currentPlayerIndex]?.isBot && !isProcessingTurn && !winner) {
      const bot = players[currentPlayerIndex];
      
      const timer = setTimeout(() => {
        // 1. Evaluate Playable Cards with Priorities
        const getScore = (card: Card, targetPlayer: Player, targetIdx: number): number => {
          const char = targetPlayer.characters[targetIdx];
          const isSelf = targetPlayer.id === bot.id;
          
          switch (card.type) {
            case CardType.BATHTUB:
              return isSelf && char.isDirty ? 100 : 0;
            case CardType.HOUSE:
              return isSelf && !char.hasHouse ? 80 : 0;
            case CardType.LIGHTNING_ROD:
              return isSelf && char.hasHouse && !char.hasLightningRod ? 70 : 0;
            case CardType.LOCK_DOOR:
              return isSelf && char.hasHouse && !char.isDirty && !char.hasLock ? 60 : 0;
            case CardType.MUD_RAIN:
              // Good if many opponents are clean and unprotected
              const opponentsClean = players
                .filter(p => p.id !== bot.id)
                .flatMap(p => p.characters)
                .filter(c => !c.isDirty && !c.hasHouse).length;
              const selfClean = bot.characters.filter(c => !c.isDirty && !c.hasHouse).length;
              return (opponentsClean * 30) - (selfClean * 40);
            case CardType.MUD_BUCKET:
              if (isSelf) return 0;
              // Target opponent with fewest dirty characters
              const targetProgress = targetPlayer.characters.filter(c => !c.isDirty).length;
              return !char.isDirty && !char.hasLock ? 40 + (targetProgress * 10) : 0;
            case CardType.LIGHTNING:
              if (isSelf) return 0;
              return char.hasHouse ? 35 : 0;
            default:
              return 0;
          }
        };

        let bestMove: { cardId: string; tId?: string; cIdx?: number; score: number } | null = null;

        bot.hand.forEach(card => {
          // Check global cards
          if (card.type === CardType.MUD_RAIN) {
            const score = getScore(card, bot, 0); // dummy index
            if (!bestMove || score > bestMove.score) {
              bestMove = { cardId: card.id, score };
            }
          } else {
            // Check all possible targets
            players.forEach(p => {
              p.characters.forEach((_, idx) => {
                if (canPlayCard(card, bot, p, idx)) {
                  const score = getScore(card, p, idx);
                  if (!bestMove || score > bestMove.score) {
                    bestMove = { cardId: card.id, tId: p.id, cIdx: idx, score };
                  }
                }
              });
            });
          }
        });

        // 2. Execute Best Move or Forfeit
        if (bestMove && (bestMove as any).score > 0) {
          playCard(bestMove.cardId, bestMove.tId, bestMove.cIdx);
        } else {
          // If no good moves, check if we can play anything at all just to cycle
          const anyPlayable = bot.hand.find(c => {
            if (c.type === CardType.MUD_RAIN) return true;
            return players.some(p => p.characters.some((_, idx) => canPlayCard(c, bot, p, idx)));
          });

          if (anyPlayable) {
            // Just play it
            if (anyPlayable.type === CardType.MUD_RAIN) {
              playCard(anyPlayable.id);
            } else {
              const p = players.find(p => p.characters.some((_, idx) => canPlayCard(anyPlayable, bot, p, idx)))!;
              const idx = p.characters.findIndex((_, idx) => canPlayCard(anyPlayable, bot, p, idx));
              playCard(anyPlayable.id, p.id, idx);
            }
          } else {
            // If still no moves, forfeit. If they already forfeited this turn, pass.
            forfeitHand();
            // To prevent infinite forfeit loops, we'll force a turn end if they still can't play
            setTimeout(() => {
              // Check if it's still the same bot's turn and they still can't play
              setPlayers(currentPlayers => {
                const currentBot = currentPlayers[currentPlayerIndex];
                if (currentBot?.id === bot.id && !hasPlayableCard(currentBot)) {
                  nextTurn();
                }
                return currentPlayers;
              });
            }, 2000);
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, gameState, players, isProcessingTurn, winner]);

  const renderTitleScreen = () => (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {STARS.map(star => (
          <div 
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
      
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
        <div className="w-full max-w-md flex flex-col items-center">
          <img 
            src="https://i.imgur.com/vwUmPYQ.png" 
            alt="GRAT!" 
            className="w-full max-w-[320px] mb-8"
            referrerPolicy="no-referrer"
          />

          <div className="w-full space-y-8">
            <div className="flex flex-col gap-2">
              <label className="text-left text-xs font-bold uppercase tracking-wider text-slate-300 px-1">Player Name</label>
              <div className="relative group">
                <input 
                  className="w-full bg-white border-2 border-slate-200 focus:border-[#0d59f2] focus:ring-0 rounded-lg h-14 px-4 text-center font-bold tracking-wide uppercase placeholder:text-slate-300 transition-all outline-none"
                  maxLength={12}
                  placeholder="ENTER YOUR NAME"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#0d59f2]">
                  <Edit3 className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-left text-xs font-bold uppercase tracking-wider text-slate-300 px-1">Choose Number of Players</label>
              <div className="relative py-4 flex items-center">
                <div className="absolute h-2 w-full bg-slate-800 rounded-full" />
                <div 
                  className="absolute h-2 bg-[#0d59f2]/60 rounded-full transition-all duration-300" 
                  style={{ width: `${((playerCount - 2) / 2) * 100}%` }}
                />
                <div className="flex justify-between w-full relative z-10">
                  {[2, 3, 4].map(num => (
                    <button 
                      key={num}
                      onClick={() => setPlayerCount(num)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                        playerCount === num 
                          ? "bg-[#0d59f2] text-white shadow-lg ring-4 ring-black" 
                          : "bg-slate-900 text-slate-400 border-2 border-slate-700"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#0d59f2]/20 border border-[#0d59f2]/30 rounded px-3 py-2">
                <p className="text-[10px] text-[#0d59f2] font-bold uppercase tracking-tight">
                  Total 2: 5 chars each | 3: 4 chars | 4: 3 chars
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 w-full">
            <button 
              onClick={initGame}
              disabled={!playerName.trim()}
              className="w-full bg-[#0d59f2] hover:bg-[#0d59f2] disabled:opacity-50 text-white font-bold text-xl py-5 rounded-full shadow-[0_6px_0_0_#063bad] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              START GAME
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameScreen = () => {
    const human = players.find(p => !p.isBot)!;
    const bots = players.filter(p => p.isBot);
    const currentPlayer = players[currentPlayerIndex];

    return (
      <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
        {/* Stars background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {STARS.map(star => (
            <div 
              key={star.id}
              className="absolute bg-white rounded-full"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-20 px-8 py-4 border-b border-white/10 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="bg-[#0d59f2]/20 p-2 rounded-xl">
              <Sparkles className="text-[#0d59f2] w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm uppercase tracking-wider text-white">GRAT!</h2>
              <p className="text-[10px] text-[#0d59f2] uppercase font-bold tracking-widest">
                {currentPlayer?.name}'s Turn
              </p>
            </div>
          </div>
          <div className="flex gap-4 relative">
            <div className="relative">
              <button 
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  showSettingsMenu ? "bg-white/10 text-[#0d59f2]" : "text-slate-300 hover:text-[#0d59f2]"
                )}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => setShowInstructions(true)}
              className="text-slate-300 hover:text-[#0d59f2] transition-colors p-2"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="relative z-20 flex-1 p-4 flex gap-4 overflow-hidden">
          {/* Left Spacer to balance the right Player section */}
          <div className="w-72 hidden xl:block shrink-0" />

          {/* Center: Deck, Discard, Bots */}
          <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-6 overflow-y-auto scrollbar-hide">
            {/* Deck & Discard (Moved Up) */}
            <div className="flex gap-4 items-start shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-24 bg-[#0d59f2] rounded-lg shadow-lg flex flex-col items-center justify-center text-white gap-1 border-2 border-white/20">
                  <div className="bg-white rounded-full p-1">
                    <RefreshCw className="w-3 h-3 text-[#0d59f2]" />
                  </div>
                  <span className="text-lg font-black">∞</span>
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Deck</span>
              </div>
              
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-16 h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 relative">
                  {discardPile.length > 0 ? (
                    <div className="text-center p-1">
                      <p className="text-[8px] font-black uppercase text-white/80 tracking-tighter leading-none">{discardPile[0].name}</p>
                    </div>
                  ) : (
                    <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Empty</span>
                  )}
                </div>
                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Discard</span>
              </div>
            </div>

            {/* Bots (Moved to Middle) */}
            <div className="flex flex-wrap justify-center gap-3 w-full pb-4">
              {bots.map(bot => (
                <div key={bot.id} className={cn(
                  "w-48 p-3 rounded-xl bg-slate-900/40 backdrop-blur-md border-2 transition-all shrink-0",
                  currentPlayerIndex === players.indexOf(bot) ? "border-[#0d59f2] shadow-md" : "border-white/5"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-200">{bot.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bot.characters.map((char, idx) => (
                      <div 
                        key={char.id}
                        onClick={() => selectedCard && playCard(selectedCard.id, bot.id, idx)}
                        className={cn(
                          "relative aspect-[3/4] rounded-lg border-2 overflow-hidden cursor-pointer group",
                          char.isDirty ? "border-amber-700/20" : "border-emerald-500/20",
                          selectedCard && canPlayCard(selectedCard, human, bot, idx) ? "ring-2 ring-[#0d59f2] animate-pulse" : ""
                        )}
                      >
                        <img 
                          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${char.imageSeed}&backgroundColor=b6e3f4`}
                          className={cn("w-full h-full object-cover", char.isDirty && "grayscale sepia brightness-75")}
                          alt="character"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-0.5 left-0.5 flex flex-col gap-0.5">
                          {char.hasHouse && <div className="bg-white/90 p-0.5 rounded shadow-sm"><Home className="w-2 h-2 text-slate-700" /></div>}
                          {char.hasLightningRod && <div className="bg-white/90 p-0.5 rounded shadow-sm"><Zap className="w-2 h-2 text-yellow-500" /></div>}
                          {char.hasLock && <div className="bg-white/90 p-0.5 rounded shadow-sm"><Lock className="w-2 h-2 text-blue-600" /></div>}
                        </div>
                        {char.isDirty && <div className="absolute inset-0 bg-amber-900/10" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Player */}
          <div className="w-72 flex flex-col justify-center relative shrink-0">
            <div className={cn(
              "p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border-4 transition-all shadow-lg",
              currentPlayerIndex === players.indexOf(human) ? "border-[#0d59f2]" : "border-white/5"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <User className="w-4 h-4 text-[#0d59f2]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">{human.name} (You)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {human.characters.map((char, idx) => (
                  <div 
                    key={char.id}
                    onClick={() => selectedCard && playCard(selectedCard.id, human.id, idx)}
                    className={cn(
                      "relative aspect-[3/4] rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.02]",
                      char.isDirty ? "border-amber-700/20" : "border-emerald-500/20",
                      selectedCard && canPlayCard(selectedCard, human, human, idx) ? "ring-4 ring-[#0d59f2] ring-offset-2" : ""
                    )}
                  >
                    <img 
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${char.imageSeed}&backgroundColor=b6e3f4`}
                      className={cn("w-full h-full object-cover", char.isDirty && "grayscale sepia brightness-75")}
                      alt="character"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                      {char.hasHouse && <div className="bg-white/90 p-0.5 rounded-md shadow-sm"><Home className="w-2.5 h-2.5 text-slate-700" /></div>}
                      {char.hasLightningRod && <div className="bg-white/90 p-0.5 rounded-md shadow-sm"><Zap className="w-2.5 h-2.5 text-yellow-500" /></div>}
                      {char.hasLock && <div className="bg-white/90 p-0.5 rounded-md shadow-sm"><Lock className="w-2.5 h-2.5 text-blue-600" /></div>}
                    </div>
                    <div className={cn(
                      "absolute bottom-0 inset-x-0 py-1 text-center text-[8px] font-bold uppercase tracking-widest",
                      char.isDirty ? "bg-[#925a31] text-white" : "bg-emerald-600 text-white"
                    )}>
                      {char.isDirty ? "Dirty" : "Clean!"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Hand & Log Section */}
        <div className="relative z-20 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 flex gap-6">
          {/* Left Spacer to balance the right Log section */}
          <div className="w-72 hidden xl:block shrink-0" />

          <div className="flex-1">
            <div className="flex items-center justify-center mb-3 relative">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Your Hand</h3>
              <button 
                onClick={forfeitHand}
                disabled={currentPlayerIndex !== players.indexOf(human) || isProcessingTurn || hasPlayableCard(human)}
                className="absolute right-0 text-[9px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-full transition-all disabled:opacity-30"
              >
                Forfeit Hand
              </button>
            </div>
            
            <div className="flex justify-center gap-3 overflow-x-auto pb-2">
              {human.hand.slice(0, 3).map(card => (
                <motion.div
                  key={card.id}
                  whileHover={{ y: -8 }}
                  onClick={() => {
                    if (currentPlayerIndex !== players.indexOf(human) || isProcessingTurn) return;
                    if (card.type === CardType.MUD_RAIN) {
                      playCard(card.id);
                    } else {
                      setSelectedCard(selectedCard?.id === card.id ? null : card);
                    }
                  }}
                  className={cn(
                    "w-28 h-40 rounded-xl border-4 p-3 flex flex-col justify-between cursor-pointer transition-all shadow-md shrink-0",
                    selectedCard?.id === card.id 
                      ? "border-[#0d59f2] bg-white ring-4 ring-[#0d59f2]/20 -translate-y-2" 
                      : "border-white/10 bg-white/5 hover:border-white/20",
                    currentPlayerIndex !== players.indexOf(human) && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-1">
                      {card.type === CardType.MUD_RAIN && <CloudRain className="w-6 h-6 text-blue-400" />}
                      {card.type === CardType.MUD_BUCKET && <Droplets className="w-6 h-6 text-[#925a31]" />}
                      {card.type === CardType.HOUSE && <Home className="w-6 h-6 text-slate-300" />}
                      {card.type === CardType.LIGHTNING && <Zap className="w-6 h-6 text-yellow-400" />}
                      {card.type === CardType.LIGHTNING_ROD && <Shield className="w-6 h-6 text-emerald-400" />}
                      {card.type === CardType.BATHTUB && <Bath className="w-6 h-6 text-indigo-300" />}
                      {card.type === CardType.LOCK_DOOR && <Lock className="w-6 h-6 text-blue-400" />}
                    </div>
                    <div className="text-center">
                      <h4 className={cn(
                        "text-[9px] font-black uppercase tracking-tighter mb-0.5 leading-none",
                        selectedCard?.id === card.id ? "text-slate-900" : "text-white"
                      )}>{card.name}</h4>
                      <p className={cn(
                        "text-[7px] font-bold leading-tight",
                        selectedCard?.id === card.id ? "text-slate-500" : "text-slate-400"
                      )}>{card.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Game Log Section */}
          <div className="w-72 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col shrink-0">
            <h3 className="text-[9px] font-bold uppercase text-slate-400 mb-3 tracking-widest">Game Log</h3>
            <div className="space-y-1.5 h-32 overflow-y-auto scrollbar-hide">
              {gameLog.map((log, i) => (
                <p key={i} className={cn(
                  "text-[10px] font-bold leading-tight",
                  i === 0 ? "text-white" : "text-slate-400"
                )}>
                  {log}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWinScreen = () => (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center p-8 text-center">
      {/* Stars background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {STARS.map(star => (
          <div 
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />

      <div className="relative z-20 flex flex-col items-center">
        <div className="mb-8 bg-yellow-500/20 p-6 rounded-full">
          <Trophy className="w-20 h-20 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold text-[#0d59f2] uppercase mb-2">Winner!</h1>
        <p className="text-2xl font-bold text-white uppercase mb-8">{winner?.name}</p>
        <p className="text-slate-300 mb-12">Congratulations! All characters are clean and sparkling!</p>
        
        <button 
          onClick={() => setGameState("TITLE")}
          className="w-full max-w-xs bg-[#0d59f2] text-white font-bold py-4 rounded-full shadow-lg hover:bg-[#0d59f2]/90 transition-all"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {gameState === "TITLE" && renderTitleScreen()}
          {gameState === "GAME" && renderGameScreen()}
          {gameState === "WIN" && renderWinScreen()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-start justify-end p-6" 
            onClick={() => setShowSettingsMenu(false)} 
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20, y: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-50 text-center">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Settings</h3>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    initGame();
                  }}
                  className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-[#0d59f2]" />
                  Restart Game
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setGameState("TITLE");
                  }}
                  className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Quit Game
                </button>
              </div>
              <div className="p-2 border-t border-slate-50">
                <button
                  onClick={() => setShowSettingsMenu(false)}
                  className="w-full px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" 
            onClick={() => setShowInstructions(false)} 
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0d59f2]">How to Play</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Master the art of cleaning</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <section>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d59f2]" />
                    The Goal
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Be the first player to <span className="font-bold text-[#0d59f2]">clean all your characters</span>. Each character starts dirty and needs a good scrub in the bathtub!
                  </p>
                </section>

                <section>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d59f2]" />
                    Card Types
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: <Bath className="w-4 h-4" />, name: "Bathtub", desc: "Cleans one of your dirty characters." },
                      { icon: <Home className="w-4 h-4" />, name: "House", desc: "Protects characters from Mud Rain." },
                      { icon: <CloudRain className="w-4 h-4" />, name: "Mud Rain", desc: "Dirties all characters without a house." },
                      { icon: <Droplets className="w-4 h-4" />, name: "Mud Bucket", desc: "Dirties one character without a lock." },
                      { icon: <Zap className="w-4 h-4" />, name: "Lightning", desc: "Destroys a house (unless it has a rod)." },
                      { icon: <Shield className="w-4 h-4" />, name: "Lightning Rod", desc: "Protects a house from Lightning." },
                      { icon: <Lock className="w-4 h-4" />, name: "Lock the Door", desc: "Permanent protection from Mud Buckets. Requires a House and a Clean character." },
                    ].map((card, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-[#0d59f2] shrink-0 h-fit">
                          {card.icon}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">{card.name}</p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{card.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0d59f2]" />
                    Turn Rules
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Play one card from your hand, then draw a new one from the deck.",
                      "If you cannot play any cards, you must forfeit your entire hand to draw 3 new cards.",
                      "Some cards target your own characters, while others are used to sabotage your opponents!",
                    ].map((rule, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="font-black text-[#0d59f2] tabular-nums">{i + 1}.</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full py-4 bg-[#0d59f2] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-[#0d59f2]/20 hover:bg-[#0d59f2]/90 transition-all"
                >
                  Got it, let's play!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
