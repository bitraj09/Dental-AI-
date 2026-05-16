'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiRefreshCw, FiAward, FiTarget, FiClock } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import { generateQuizQuestion } from '@/utils/mockAI';
import styles from './page.module.css';

const TOTAL_QUESTIONS = 10;
const TIME_OPTIONS = [
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '45s', value: 45 },
    { label: '60s', value: 60 },
    { label: 'No Limit', value: 0 },
];

export default function EducationPage() {
    const [image, setImage] = useState(null);
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const [quizState, setQuizState] = useState('idle'); // idle, playing, answered, finished
    const [question, setQuestion] = useState(null);
    const [score, setScore] = useState(0);
    const [questionNum, setQuestionNum] = useState(0);
    const [answered, setAnswered] = useState(null); // selected option id
    const [usedIds, setUsedIds] = useState([]);
    const [history, setHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [selectedTime, setSelectedTime] = useState(30);
    const timerRef = useRef(null);
    const imgRef = useRef(null);

    const handleImage = useCallback((dataUrl) => {
        setImage(dataUrl);
    }, []);

    const startQuiz = () => {
        setScore(0);
        setQuestionNum(1);
        setUsedIds([]);
        setHistory([]);
        const q = generateQuizQuestion([]);
        setQuestion(q);
        setQuizState('playing');
        setAnswered(null);
        setTimeLeft(selectedTime);
    };

    const handleAnswer = (optionId) => {
        if (answered) return;
        setAnswered(optionId);
        const correct = optionId === question.correctId;
        if (correct) setScore((s) => s + 1);
        setHistory((h) => [...h, { question, selected: optionId, correct }]);
        setQuizState('answered');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const nextQuestion = () => {
        const nextNum = questionNum + 1;
        if (nextNum > TOTAL_QUESTIONS) {
            setQuizState('finished');
            return;
        }
        const newUsed = [...usedIds, question.correctId];
        setUsedIds(newUsed);
        setQuestionNum(nextNum);
        const q = generateQuizQuestion(newUsed);
        setQuestion(q);
        setAnswered(null);
        setQuizState('playing');
        setTimeLeft(selectedTime);
    };

    const onImgLoad = (e) => {
        setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    };

    // Countdown timer
    useEffect(() => {
        if (quizState !== 'playing' || selectedTime === 0) return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Time's up — auto-mark as wrong
                    setAnswered('__timeout__');
                    setHistory(h => [...h, { question, selected: null, correct: false }]);
                    setQuizState('answered');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [quizState, question]);
    const getScale = () => {
        if (!imgRef.current || imgSize.w === 0) return { sx: 1, sy: 1 };
        const rect = imgRef.current.getBoundingClientRect();
        return { sx: rect.width / imgSize.w, sy: rect.height / imgSize.h };
    };

    const scorePercent = TOTAL_QUESTIONS > 0 ? Math.round((score / TOTAL_QUESTIONS) * 100) : 0;

    return (
        <div className={styles.page}>
            <div className="container">
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="section-title">Student Education</h1>
                    <p className="section-subtitle">
                        Test your knowledge — identify dental landmarks on radiographs and get instant AI feedback.
                    </p>
                </motion.div>

                {!image ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ maxWidth: 640, margin: '0 auto' }}
                    >
                        <ImageUploader onImageSelect={handleImage} label="Upload a Radiograph to Quiz On" />
                    </motion.div>
                ) : quizState === 'finished' ? (
                    /* Results screen */
                    <motion.div
                        className={styles.resultsScreen}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className={styles.scoreCircle}>
                            <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
                                <circle cx="60" cy="60" r="52" stroke="var(--border)" strokeWidth="8" fill="none" />
                                <motion.circle
                                    cx="60" cy="60" r="52"
                                    stroke="url(#scoreGrad)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 52}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - scorePercent / 100) }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                    transform="rotate(-90 60 60)"
                                />
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className={styles.scoreText}>
                                <span className={styles.scoreValue}>{scorePercent}%</span>
                                <span className={styles.scoreLabel}>{score}/{TOTAL_QUESTIONS}</span>
                            </div>
                        </div>

                        <h2 className={styles.resultsTitle}>
                            <FiAward size={24} />
                            {scorePercent >= 80 ? 'Excellent!' : scorePercent >= 50 ? 'Good effort!' : 'Keep practicing!'}
                        </h2>

                        <div className={styles.historyList}>
                            {history.map((h, i) => (
                                <div key={i} className={`${styles.historyItem} ${h.correct ? styles.historyCorrect : styles.historyWrong}`}>
                                    <span className={styles.historyNum}>Q{i + 1}</span>
                                    <span className={styles.historyName}>{h.question.landmark.name}</span>
                                    {h.correct ? <FiCheck size={16} /> : <FiX size={16} />}
                                </div>
                            ))}
                        </div>

                        <div className={styles.resultsActions}>
                            <button className="btn btn-primary" onClick={startQuiz}>
                                <FiRefreshCw size={16} /> Try Again
                            </button>
                            <button className="btn btn-outline" onClick={() => { setImage(null); setQuizState('idle'); }}>
                                New Image
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* Quiz interface */
                    <div className={styles.quizLayout}>
                        <div className={styles.quizImage}>
                            <div className={styles.quizToolbar}>
                                {quizState === 'idle' ? (
                                    <>
                                        <button className="btn btn-primary" onClick={startQuiz}>
                                            <FiTarget size={18} /> Start Quiz ({TOTAL_QUESTIONS} Questions)
                                        </button>
                                        <div className={styles.timeSelector}>
                                            <FiClock size={14} />
                                            {TIME_OPTIONS.map(opt => (
                                                <button key={opt.value}
                                                    className={`${styles.timeOption} ${selectedTime === opt.value ? styles.timeOptionActive : ''}`}
                                                    onClick={() => { setSelectedTime(opt.value); setTimeLeft(opt.value); }}
                                                >{opt.label}</button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.progress}>
                                        <span className={styles.progressLabel}>Question {questionNum}/{TOTAL_QUESTIONS}</span>
                                        <div className={styles.progressBar}>
                                            <motion.div
                                                className={styles.progressFill}
                                                animate={{ width: `${(questionNum / TOTAL_QUESTIONS) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.scoreInline}>Score: {score}</span>
                                        {/* Timer */}
                                        {selectedTime > 0 && (
                                        <div className={styles.timerWrap}>
                                            <svg viewBox="0 0 36 36" className={styles.timerSvg}>
                                                <circle cx="18" cy="18" r="15" stroke="var(--border)" strokeWidth="3" fill="none" />
                                                <circle cx="18" cy="18" r="15" strokeWidth="3" fill="none" strokeLinecap="round"
                                                    strokeDasharray={2 * Math.PI * 15}
                                                    strokeDashoffset={2 * Math.PI * 15 * (1 - timeLeft / selectedTime)}
                                                    transform="rotate(-90 18 18)"
                                                    stroke={timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#a855f7'}
                                                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                                                />
                                            </svg>
                                            <span className={`${styles.timerText} ${timeLeft <= 5 ? styles.timerDanger : timeLeft <= 10 ? styles.timerWarn : ''}`}>
                                                {timeLeft}s
                                            </span>
                                        </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.imageContainer}>
                                <img ref={imgRef} src={image} alt="Radiograph" className={styles.radiograph} onLoad={onImgLoad} />
                                {question && (quizState === 'playing' || quizState === 'answered') && (
                                    <>
                                        {question.landmark.typicalPolygon && (
                                            <svg
                                                style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, width: '100%', height: '100%',
                                                    pointerEvents: 'none', zIndex: 10
                                                }}
                                                viewBox="0 0 100 100"
                                                preserveAspectRatio="none"
                                            >
                                                <motion.g
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{ transformOrigin: `${question.position.xPercent * 100}% ${question.position.yPercent * 100}%` }}
                                                >
                                                    {(() => {
                                                        const dx = question.position.xPercent - question.landmark.typicalPosition.xPercent;
                                                        const dy = question.position.yPercent - question.landmark.typicalPosition.yPercent;
                                                        const points = question.landmark.typicalPolygon.map(p => `${(p[0] + dx) * 100},${(p[1] + dy) * 100}`).join(' ');
                                                        const color = question.landmark.instanceColor || '#a855f7';
                                                        const r = parseInt(color.slice(1, 3), 16);
                                                        const g = parseInt(color.slice(3, 5), 16);
                                                        const b = parseInt(color.slice(5, 7), 16);
                                                        const rgba = `rgba(${r},${g},${b},0.4)`;

                                                        return (
                                                            <>
                                                                <polygon
                                                                    points={points}
                                                                    fill={rgba}
                                                                    stroke={color}
                                                                    strokeWidth="3"
                                                                    vectorEffect="non-scaling-stroke"
                                                                    strokeLinejoin="round"
                                                                />
                                                                <polygon
                                                                    points={points}
                                                                    fill="none"
                                                                    stroke={color}
                                                                    strokeWidth="8"
                                                                    vectorEffect="non-scaling-stroke"
                                                                    strokeLinejoin="round"
                                                                    opacity="0.25"
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </motion.g>
                                            </svg>
                                        )}
                                        <div
                                            className={styles.targetMarker}
                                            style={{
                                                left: `${question.position.xPercent * 100}%`,
                                                top: `${question.position.yPercent * 100}%`,
                                            }}
                                        >
                                            {quizState === 'answered' && (
                                                <motion.span
                                                    className={styles.targetLabel}
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{ background: question.landmark.instanceColor || '#a855f7' }}
                                                >
                                                    {question.landmark.name}
                                                </motion.span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {question && (quizState === 'playing' || quizState === 'answered') && (
                            <motion.div
                                className={styles.quizPanel}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <h3 className={styles.questionTitle}>
                                    What landmark is indicated by the marker?
                                </h3>

                                <div className={styles.options}>
                                    {question.options.map((opt) => {
                                        const isCorrect = opt.id === question.correctId;
                                        const isSelected = answered === opt.id;
                                        let optClass = styles.option;
                                        if (answered) {
                                            if (isCorrect) optClass += ` ${styles.optionCorrect}`;
                                            else if (isSelected) optClass += ` ${styles.optionWrong}`;
                                        }

                                        return (
                                            <motion.button
                                                key={opt.id}
                                                className={optClass}
                                                onClick={() => handleAnswer(opt.id)}
                                                disabled={!!answered}
                                                whileHover={!answered ? { scale: 1.02 } : {}}
                                                whileTap={!answered ? { scale: 0.98 } : {}}
                                            >
                                                <span>{opt.name}</span>
                                                {answered && isCorrect && <FiCheck size={18} />}
                                                {answered && isSelected && !isCorrect && <FiX size={18} />}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <AnimatePresence>
                                    {quizState === 'answered' && (
                                        <motion.div
                                            className={styles.feedback}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className={`${styles.feedbackBanner} ${answered === question.correctId ? styles.feedbackCorrect : styles.feedbackWrong}`}>
                                                {answered === question.correctId ? (
                                                    <><FiCheck size={20} /> Correct!</>
                                                ) : answered === '__timeout__' ? (
                                                    <><FiClock size={20} /> Time&apos;s up! It&apos;s {question.landmark.name}</>
                                                ) : (
                                                    <><FiX size={20} /> Incorrect — it&apos;s {question.landmark.name}</>
                                                )}
                                            </div>
                                            <p className={styles.feedbackDesc}>{question.landmark.description}</p>
                                            <button className="btn btn-primary" onClick={nextQuestion} style={{ marginTop: 12 }}>
                                                {questionNum >= TOTAL_QUESTIONS ? 'View Results' : 'Next Question →'}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
