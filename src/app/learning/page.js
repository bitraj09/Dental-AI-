'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlay, 
  FiPause, 
  FiMaximize2, 
  FiVolume2, 
  FiVolumeX,
  FiBookOpen
} from 'react-icons/fi';
import { TbDental } from 'react-icons/tb';
import styles from './page.module.css';

// Slide titles
const SLIDE_TITLES = [
  "Bony Landmarks in Mandible",
  "Bony Landmarks in Maxilla"
];

export default function LearningPage() {
  // Presentation State
  const [slideIndex, setSlideIndex] = useState(0);

  // Playback & Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [continuousLoop, setContinuousLoop] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Video State
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(76.13);
  const [isMuted, setIsMuted] = useState(true);
  const [videoPlaySpeed, setVideoPlaySpeed] = useState(1);

  const videoRef = useRef(null);
  const slideFrameRef = useRef(null);

  // Get active slide title
  const activeTitle = SLIDE_TITLES[slideIndex];

  // Step navigation logic: Next Chapter
  const handleNext = () => {
    if (slideIndex === 0) {
      setSlideIndex(1);
      if (videoRef.current) {
        videoRef.current.currentTime = 37.5;
        setCurrentTime(37.5);
      }
    } else if (continuousLoop) {
      setSlideIndex(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    }
  };

  // Step navigation logic: Previous Chapter
  const handlePrev = () => {
    if (slideIndex === 1) {
      setSlideIndex(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else if (continuousLoop) {
      setSlideIndex(1);
      if (videoRef.current) {
        videoRef.current.currentTime = 37.5;
        setCurrentTime(37.5);
      }
    }
  };

  // Video Mode time updates & index sync
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Sync active chapter index based on video timestamps
    if (time < 37.5) {
      if (slideIndex !== 0) setSlideIndex(0);
    } else {
      if (slideIndex !== 1) setSlideIndex(1);
    }
  };

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in any input field
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA'
      )) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, videoDuration);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slideIndex, isPlaying, isFullscreen, continuousLoop, videoDuration]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!slideFrameRef.current) return;
    if (!isFullscreen) {
      if (slideFrameRef.current.requestFullscreen) {
        slideFrameRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen change with escape key
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className={styles.learningPage}>
      {/* Background radial glows */}
      <div className={styles.backgroundGlows}>
        <div className={styles.glowPurple} />
        <div className={styles.glowPink} />
      </div>

      <div className="container">
        {/* Header */}
        <header className={styles.header}>
          <motion.div 
            className={styles.badge}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TbDental size={16} />
            Anatomical Education
          </motion.div>
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Mandibular & Maxillary <span className={styles.gradientText}>Bony Landmarks</span>
          </motion.h1>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Radiograph Presentation. Select a chapter below or play continuously to learn bony landmarks.
          </motion.p>
        </header>

        {/* Tab selection */}
        <div className={styles.navTopBar}>
          <div className={styles.tabContainer}>
            {SLIDE_TITLES.map((title, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSlideIndex(idx);
                  if (videoRef.current) {
                    const startTimes = [0, 37.5];
                    videoRef.current.currentTime = startTimes[idx];
                  }
                }}
                className={`${styles.tabBtn} ${slideIndex === idx ? styles.activeTab : ''}`}
              >
                <FiBookOpen size={16} />
                {title}
              </button>
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div className={styles.mainGrid}>
          {/* Central Slideshow Card */}
          <div className={styles.slideshowCard}>
            <div className={styles.sliderWrapper}>
              
              {/* Active Chapter Header */}
              <div className={styles.activeChapterHeader}>
                <span className={`${styles.pulseDot} ${isPlaying ? styles.pulseActive : ''}`}></span>
                <span className={styles.activeChapterTitle}>
                  {activeTitle}
                </span>
              </div>

              {/* Viewport Frame */}
              <div 
                ref={slideFrameRef}
                className={`${styles.slideFrame} ${isFullscreen ? styles.frameFullscreen : ''}`}
              >
                <video
                  ref={videoRef}
                  src="/learning/landmarks_video.mp4"
                  className={styles.slideImage}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  loop={continuousLoop}
                  playsInline
                  autoPlay
                />

                {/* Overlays (Fullscreen, Mute) */}
                <div className={styles.mediaOverlays}>
                  <button 
                    onClick={toggleFullscreen} 
                    className={styles.iconBtn}
                    title="Toggle Fullscreen"
                  >
                    <FiMaximize2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (videoRef.current) videoRef.current.muted = !isMuted;
                    }} 
                    className={styles.iconBtn}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
                  </button>
                </div>
              </div>

              {/* Scrubber slider */}
              <div className={styles.scrubberWrapper}>
                <span className={styles.timeLabel}>
                  {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60) < 10 ? '0' : '') + Math.floor(currentTime % 60)}
                </span>
                <input 
                  type="range"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = t;
                    setCurrentTime(t);
                  }}
                  className={styles.scrubber}
                />
                <span className={styles.timeLabel}>
                  {Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60) < 10 ? '0' : '') + Math.floor(videoDuration % 60)}
                </span>
              </div>

              {/* Controls bar */}
              <div className={styles.controlsBar}>
                {/* Previous/Next Chapter buttons */}
                <div className={styles.navButtons}>
                  <button 
                    onClick={handlePrev} 
                    className={styles.arrowBtn}
                    title="Previous Slide"
                  >
                    <FiChevronLeft size={22} />
                  </button>
                  <span className={styles.slideCounter}>
                    Slide {slideIndex + 1} / 2
                  </span>
                  <button 
                    onClick={handleNext} 
                    className={styles.arrowBtn}
                    title="Next Slide"
                  >
                    <FiChevronRight size={22} />
                  </button>
                </div>

                {/* Play / Pause button */}
                <div className={styles.playControls}>
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play().catch(() => {});
                      }
                    }} 
                    className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
                    <span>{isPlaying ? "PAUSE" : "PLAY"}</span>
                  </button>
                </div>

                {/* Speed & Loop settings */}
                <div className={styles.settingsPanel}>
                  {/* Speed control */}
                  <div className={styles.controlGroup}>
                    <label htmlFor="slideshow-speed">Speed</label>
                    <select 
                      id="slideshow-speed"
                      value={videoPlaySpeed}
                      onChange={(e) => {
                        const speed = Number(e.target.value);
                        setVideoPlaySpeed(speed);
                        if (videoRef.current) videoRef.current.playbackRate = speed;
                      }}
                      className={styles.select}
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1">1.0x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>
                  </div>

                  {/* Loop control */}
                  <div className={styles.checkboxGroup}>
                    <button
                      onClick={() => setContinuousLoop(!continuousLoop)}
                      className={`${styles.toggleSwitch} ${continuousLoop ? styles.switchOn : ''}`}
                      aria-label="Toggle loop"
                    >
                      <span className={styles.switchSlider} />
                    </button>
                    <span className={styles.switchLabel}>Loop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
