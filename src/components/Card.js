import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../assets/css/card.css';
import musics from '../assets/data';

const THEMES = [
  { value: 'dark', label: '🌙 Dark' },
  { value: 'light', label: '☀️ Light' },
  { value: 'synthwave', label: '🌈 Synthwave' },
];

const formatTime = (secs) => {
  if (!secs || isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const Card = ({ theme, setTheme }) => {
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const isPlayingRef = useRef(false);
  const repeatRef = useRef(false);
  const shuffleRef = useRef(false);
  const playlistLengthRef = useRef(musics.length);

  const [playlist, setPlaylist] = useState(musics);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { playlistLengthRef.current = playlist.length; }, [playlist]);

  // Set up persistent audio event listeners (only once)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };
    const pickRandom = (prev, len) => {
      if (len <= 1) return 0;
      let next = Math.floor(Math.random() * len);
      while (next === prev) next = Math.floor(Math.random() * len);
      return next;
    };
    const handleEnded = () => {
      if (repeatRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (shuffleRef.current) {
        setCurrentIndex((prev) => pickRandom(prev, playlistLengthRef.current));
        setIsPlaying(true);
      } else {
        setCurrentIndex((prev) => (prev + 1) % playlistLengthRef.current);
        setIsPlaying(true);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Load and (optionally) play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    audio.load();
    if (isPlayingRef.current) {
      const tryPlay = () => {
        audio.play().catch(() => setIsPlaying(false));
        audio.removeEventListener('canplay', tryPlay);
      };
      audio.addEventListener('canplay', tryPlay);
      return () => audio.removeEventListener('canplay', tryPlay);
    }
  }, [currentIndex, playlist]);

  // Sync play/pause state to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (shuffleRef.current) {
      const len = playlistLengthRef.current;
      setCurrentIndex((prev) => {
        if (len <= 1) return 0;
        let next = Math.floor(Math.random() * len);
        while (next === prev) next = Math.floor(Math.random() * len);
        return next;
      });
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlistLengthRef.current);
    }
    setIsPlaying(true);
  }, []);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setCurrentIndex((prev) =>
      (prev - 1 + playlistLengthRef.current) % playlistLengthRef.current
    );
    setIsPlaying(true);
  }, []);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeChange = useCallback((e) => {
    setVolume(Number(e.target.value));
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const fileObjectUrlsRef = useRef([]);

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    const urls = fileObjectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const firstNewIndex = playlistLengthRef.current;
    const newTracks = files.map((file, i) => {
      const url = URL.createObjectURL(file);
      fileObjectUrlsRef.current.push(url);
      return {
        id: Date.now() + i,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        thumbnail: musics[0].thumbnail,
        src: url,
        isLocal: true,
      };
    });
    setPlaylist((prev) => [...prev, ...newTracks]);
    setCurrentIndex(firstNewIndex);
    setIsPlaying(true);
    e.target.value = '';
  }, []);

  const handlePlaylistClick = useCallback((idx) => {
    if (idx === currentIndex) {
      togglePlay();
    } else {
      setCurrentIndex(idx);
      setIsPlaying(true);
    }
  }, [currentIndex, togglePlay]);

  const currentTrack = playlist[currentIndex] || playlist[0];
  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeIcon = volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up';

  return (
    <div className="card">
      {/* Ambient art background */}
      <div
        className="art-ambient"
        style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
        aria-hidden="true"
      />

      {/* Navigation bar */}
      <div className="nav">
        <button
          className="nav-btn"
          onClick={() => setShowPlaylist((s) => !s)}
          title={showPlaylist ? 'Back to player' : 'Show playlist'}
          aria-label={showPlaylist ? 'Back to player' : 'Show playlist'}
        >
          <i className="material-icons">
            {showPlaylist ? 'arrow_back_ios_new' : 'queue_music'}
          </i>
        </button>
        <span className="nav-title">
          {showPlaylist ? 'Your Playlist' : `Now Playing · ${currentIndex + 1} / ${playlist.length}`}
        </span>
        <select
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          title="Change theme"
          aria-label="Select theme"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Playlist view — always in DOM for CSS transition */}
      <div className={`playlist${showPlaylist ? ' visible' : ''}`} aria-hidden={!showPlaylist}>
        <ul>
          {playlist.map((track, idx) => (
            <li
              key={track.id}
              className={`playlist-item${idx === currentIndex ? ' active' : ''}`}
              onClick={() => handlePlaylistClick(idx)}
            >
              <span className="playlist-num">{idx + 1}</span>
              <img
                src={track.thumbnail}
                alt=""
                className="playlist-thumb"
              />
              <div className="playlist-info">
                <span className="playlist-title">{track.title}</span>
                <span className="playlist-artist">{track.artist}</span>
              </div>
              {idx === currentIndex && isPlaying && (
                <i className="material-icons playlist-playing">graphic_eq</i>
              )}
              {track.isLocal && (
                <i className="material-icons playlist-local" title="Local file">
                  folder_open
                </i>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Player view */}
      {!showPlaylist && (
        <div className="player-view">
          {/* Album art */}
          <div className="img">
            <div className={`art-ring${isPlaying ? '' : ' paused'}`}>
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className={isPlaying ? 'spinning' : ''}
              />
            </div>
          </div>

          {/* Track details */}
          <div className="details">
            <p className="title">{currentTrack.title}</p>
            <p className="artist">{currentTrack.artist}</p>
          </div>

          {/* Progress bar */}
          <div className="progress-wrap">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressValue}
              onChange={handleSeek}
              style={{ '--val': `${progressValue}%` }}
              aria-label="Seek"
            />
          </div>

          {/* Timer */}
          <div className="timer">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="controls">
            <button
              className={`ctrl-btn${shuffle ? ' active' : ''}`}
              onClick={toggleShuffle}
              title={shuffle ? 'Shuffle on' : 'Shuffle off'}
              aria-label="Toggle shuffle"
              aria-pressed={shuffle}
            >
              <i className="material-icons">shuffle</i>
            </button>

            <button
              className="ctrl-btn ctrl-skip"
              onClick={handlePrev}
              title="Previous"
              aria-label="Previous track"
            >
              <i className="material-icons">skip_previous</i>
            </button>

            <button
              className="play-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <i className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</i>
            </button>

            <button
              className="ctrl-btn ctrl-skip"
              onClick={handleNext}
              title="Next"
              aria-label="Next track"
            >
              <i className="material-icons">skip_next</i>
            </button>

            <button
              className={`ctrl-btn${repeat ? ' active' : ''}`}
              onClick={toggleRepeat}
              title={repeat ? 'Repeat on' : 'Repeat off'}
              aria-label="Toggle repeat"
              aria-pressed={repeat}
            >
              <i className="material-icons">repeat</i>
            </button>
          </div>

          {/* Volume row */}
          <div className="volume-row">
            <i className="material-icons vol-icon">{volumeIcon}</i>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              style={{ '--val': `${volume}%` }}
              aria-label="Volume"
            />
            <span className="vol-pct">{volume}%</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="section-divider" />

      {/* Upload section */}
      <div className="upload-section">
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current.click()}
          title="Add local music files"
          aria-label="Add music files"
        >
          <i className="material-icons">library_add</i>
          <span>Add Music</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={handleFileUpload}
        />
      </div>

      <audio ref={audioRef} src={currentTrack.src} preload="metadata" />
    </div>
  );
};

export default Card;