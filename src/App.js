import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Award, Zap } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;

const WORDS_BY_LENGTH = {
  3: ['ART', 'LAW', 'DNA', 'RNA', 'SUM', 'SET', 'MAP', 'LOG', 'BIT', 'ION'],
  4: ['MATH', 'CODE', 'DATA', 'GENE', 'ATOM', 'CELL', 'WAVE', 'HEAT', 'MASS', 'FORCE'],
  5: ['LOGIC', 'STUDY', 'BRAIN', 'FIELD', 'PROOF', 'GRAPH', 'SPACE', 'LIGHT', 'SOUND', 'POWER'],
  6: ['THEORY', 'METHOD', 'SYSTEM', 'ENERGY', 'MATTER', 'CARBON', 'NEWTON', 'REASON', 'ETHICS', 'SYNTAX'],
  7: ['SCIENCE', 'BIOLOGY', 'PHYSICS', 'HISTORY', 'ALGEBRA', 'GRAMMAR', 'QUANTUM', 'CALCULUS', 'ISOTOPE', 'PROTEIN'],
  8: ['ANALYSIS', 'RESEARCH', 'COMPUTER', 'FUNCTION', 'EQUATION', 'MOLECULE', 'ELECTRON', 'DYNAMICS', 'REACTION', 'VELOCITY'],
  9: ['CHEMISTRY', 'ALGORITHM', 'KNOWLEDGE', 'EVOLUTION', 'ASTRONOMY', 'SOCIOLOGY', 'GEOGRAPHY', 'ECOSYSTEM', 'FREQUENCY', 'MAGNITUDE'],
  10: ['PHILOSOPHY', 'PSYCHOLOGY', 'HYPOTHESIS', 'EXPERIMENT', 'STATISTICS', 'LITERATURE', 'PARAMETRIC', 'POLYNOMIAL', 'VOCABULARY', 'REGRESSION']
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const WordSnake = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [letters, setLetters] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [collectedLetters, setCollectedLetters] = useState('');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [touchStart, setTouchStart] = useState(null);
  const [gameOverReason, setGameOverReason] = useState('');
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [level, setLevel] = useState(1);
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const getRandomLetter = () => {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  };

  const generateLetters = useCallback((word, collected) => {
    const nextLetter = word[collected.length];
    const newLetters = [];
    
    // Add the correct next letter
    const correctPos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      letter: nextLetter,
      isCorrect: true
    };
    
    // Make sure it doesn't spawn on snake
    while (snake.some(segment => segment.x === correctPos.x && segment.y === correctPos.y)) {
      correctPos.x = Math.floor(Math.random() * GRID_SIZE);
      correctPos.y = Math.floor(Math.random() * GRID_SIZE);
    }
    newLetters.push(correctPos);
    
    // Helper function to check if position is adjacent to snake head
    const isAdjacentToHead = (x, y) => {
      const head = snake[0];
      const adjacentPositions = [
        { x: head.x + 1, y: head.y },
        { x: head.x - 1, y: head.y },
        { x: head.x, y: head.y + 1 },
        { x: head.x, y: head.y - 1 }
      ];
      return adjacentPositions.some(pos => pos.x === x && pos.y === y);
    };
    
    // Add 3-4 incorrect letters
    const numIncorrect = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numIncorrect; i++) {
      let pos;
      let attempts = 0;
      do {
        pos = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
          letter: getRandomLetter(),
          isCorrect: false
        };
        attempts++;
        // Prevent infinite loop if board is too crowded
        if (attempts > 100) break;
      } while (
        snake.some(segment => segment.x === pos.x && segment.y === pos.y) ||
        newLetters.some(l => l.x === pos.x && l.y === pos.y) ||
        isAdjacentToHead(pos.x, pos.y)
      );
      if (attempts <= 100) {
        newLetters.push(pos);
      }
    }
    
    return newLetters;
  }, [snake]);

  const startNewWord = useCallback(() => {
    const wordLength = Math.min(3 + level - 1, 10);
    const wordsForLevel = WORDS_BY_LENGTH[wordLength];
    const word = wordsForLevel[Math.floor(Math.random() * wordsForLevel.length)];
    setTargetWord(word);
    setCollectedLetters('');
    setLetters(generateLetters(word, ''));
  }, [generateLetters, level]);

  useEffect(() => {
    if (gameStarted && targetWord === '') {
      startNewWord();
    }
  }, [gameStarted, targetWord, startNewWord]);

  const checkCollision = useCallback((head) => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
  }, [snake]);

  const gameLoop = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      if (checkCollision(newHead)) {
        setGameOver(true);
        setGameOverReason('Hit a wall or yourself!');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if snake ate a letter
      const eatenLetter = letters.find(l => l.x === newHead.x && l.y === newHead.y);
      
      if (eatenLetter) {
        if (eatenLetter.isCorrect) {
          // Correct letter!
          const newCollected = collectedLetters + eatenLetter.letter;
          setCollectedLetters(newCollected);
          setScore(s => s + 10);
          
          if (newCollected === targetWord) {
            // Word completed!
            setScore(s => s + 50);
            setWordsCompleted(w => w + 1);
            
            // Level up every 3 words
            if ((wordsCompleted + 1) % 3 === 0 && level < 8) {
              setLevel(l => l + 1);
            }
            
            startNewWord();
          } else {
            // Generate new letters for next character
            setLetters(generateLetters(targetWord, newCollected));
          }
        } else {
          // Wrong letter - game over!
          setGameOver(true);
          setGameOverReason(`Wrong letter! "${eatenLetter.letter}" doesn't fit in "${targetWord}"`);
          return prevSnake;
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [letters, collectedLetters, targetWord, wordsCompleted, level, checkCollision, generateLetters, startNewWord]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, speed);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [gameStarted, gameOver, gameLoop, speed]);

  const handleKeyPress = useCallback((e) => {
    if (!gameStarted) return;
    
    const key = e.key;
    const newDir = { ...directionRef.current };

    if (key === 'ArrowUp' && directionRef.current.y === 0) {
      newDir.x = 0;
      newDir.y = -1;
    } else if (key === 'ArrowDown' && directionRef.current.y === 0) {
      newDir.x = 0;
      newDir.y = 1;
    } else if (key === 'ArrowLeft' && directionRef.current.x === 0) {
      newDir.x = -1;
      newDir.y = 0;
    } else if (key === 'ArrowRight' && directionRef.current.x === 0) {
      newDir.x = 1;
      newDir.y = 0;
    }

    setDirection(newDir);
  }, [gameStarted]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !gameStarted) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) > 30) {
      if (absDeltaX > absDeltaY) {
        if (deltaX > 0 && directionRef.current.x === 0) {
          setDirection({ x: 1, y: 0 });
        } else if (deltaX < 0 && directionRef.current.x === 0) {
          setDirection({ x: -1, y: 0 });
        }
      } else {
        if (deltaY > 0 && directionRef.current.y === 0) {
          setDirection({ x: 0, y: 1 });
        } else if (deltaY < 0 && directionRef.current.y === 0) {
          setDirection({ x: 0, y: -1 });
        }
      }
    }

    setTouchStart(null);
  };

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setSpeed(INITIAL_SPEED);
    setTargetWord('');
    setCollectedLetters('');
    setWordsCompleted(0);
    setLevel(1);
    setGameOverReason('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Brain className="w-8 h-8" />
            Word Snake
          </h1>
          <div className="flex items-center gap-2 text-lg font-semibold text-purple-600">
            <Award className="w-6 h-6" />
            {score}
          </div>
        </div>

        {gameStarted && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">Level {level}</span>
                <span className="text-xs text-gray-500">({3 + level - 1} letters)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">{wordsCompleted} words</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-gray-700">Build:</span>
              <div className="flex gap-1">
                {targetWord.split('').map((letter, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 flex items-center justify-center border-2 rounded font-bold text-sm ${
                      i < collectedLetters.length
                        ? 'bg-green-500 text-white border-green-600'
                        : 'bg-gray-100 text-gray-400 border-gray-300'
                    }`}
                  >
                    {i < collectedLetters.length ? letter : '?'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div 
          className="relative border-4 border-indigo-900 rounded-lg mx-auto bg-indigo-50"
          style={{ 
            width: GRID_SIZE * CELL_SIZE, 
            height: GRID_SIZE * CELL_SIZE,
            touchAction: 'none'
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {snake.map((segment, i) => {
            const letterIndex = collectedLetters.length - 1 - i;
            const letter = letterIndex >= 0 ? collectedLetters[letterIndex] : '';
            
            return (
              <div
                key={i}
                className={`absolute ${i === 0 ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-indigo-500'} rounded-sm flex items-center justify-center text-white font-bold`}
                style={{
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  zIndex: snake.length - i,
                  fontSize: '8px'
                }}
              >
                {letter}
              </div>
            );
          })}

          {letters.map((letterObj, i) => (
            <div
              key={i}
              className={`absolute flex items-center justify-center font-bold text-xs ${
                letterObj.isCorrect 
                  ? 'bg-green-400 text-white' 
                  : 'bg-red-400 text-white'
              } rounded shadow-lg`}
              style={{
                left: letterObj.x * CELL_SIZE,
                top: letterObj.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2
              }}
            >
              {letterObj.letter}
            </div>
          ))}

          {!gameStarted && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Start Game
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded p-4">
              <h2 className="text-white text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-white text-sm mb-2 text-center">{gameOverReason}</p>
              <p className="text-white text-lg mb-1">Score: {score}</p>
              <p className="text-white text-sm mb-1">Level Reached: {level}</p>
              <p className="text-white text-sm mb-4">Words Completed: {wordsCompleted}</p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p className="mb-2">Swipe or use arrow keys to move</p>
          <p className="text-xs">Progress through levels by completing words!</p>
          <p className="text-xs font-semibold text-purple-600 mt-1">Level up every 3 words (max 10-letter words)</p>
        </div>

        <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
          <div className="flex items-center gap-2 text-xs mb-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span>Correct letter</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span>Wrong letter (avoid!)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordSnake;