'use client';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiRefreshCw, FiAward, FiTarget } from 'react-icons/fi';
import ImageUploader from '@/components/ImageUploader';
import { generateQuizQuestion } from '@/utils/mockAI';
import styles from './page.module.css';

const TOTAL_QUESTIONS = 10;

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
    };

    const handleAnswer = (optionId) => {
        if (answered) return;
        setAnswered(optionId);
        const correct = optionId === question.correctId;
        if (correct) setScore((s) => s + 1);
        setHistory((h) => [...h, { question, selected: optionId, correct }]);
        setQuizState('answered');
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
    };

    const onImgLoad = (e) => {
        setImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    };

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
                                    <button className="btn btn-primary" onClick={startQuiz}>
                                        <FiTarget size={18} /> Start Quiz ({TOTAL_QUESTIONS} Questions)
                                    </button>
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
                                    </div>
                                )}
                            </div>

                            <div className={styles.imageContainer}>
                                <img ref={imgRef} src={image} alt="Radiograph" className={styles.radiograph} onLoad={onImgLoad} />
                                {question && (quizState === 'playing' || quizState === 'answered') && (
                                    <motion.div
                                        className={styles.targetMarker}
                                        style={{
                                            left: `${question.position.xPercent * 100}%`,
                                            top: `${question.position.yPercent * 100}%`,
                                        }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring' }}
                                    >
                                        <span className={styles.targetPulse} />
                                        <span className={styles.targetDot} />
                                        {quizState === 'answered' && (
                                            <motion.span
                                                className={styles.targetLabel}
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {question.landmark.name}
                                            </motion.span>
                                        )}
                                    </motion.div>
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
