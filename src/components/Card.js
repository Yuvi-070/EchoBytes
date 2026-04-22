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
  const playlistLengthRef = useRef(musics.length);

  const [playlist, setPlaylist] = useState(musics);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [showVolume, setShowVolume] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { playlistLengthRef.current = playlist.length; }, [playlist]);

  // Set up persistent audio event listeners (only once)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };
    const handleEnded = () => {
      if (repeatRef.current) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
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
    setCurrentIndex((prev) => (prev + 1) % playlistLengthRef.current);
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
      {/* Navigation bar */}
      <div className="nav">
        <i
          className="material-icons nav-icon"
          onClick={() => setShowPlaylist((s) => !s)}
          title={showPlaylist ? 'Hide playlist' : 'Show playlist'}
        >
          {showPlaylist ? 'expand_less' : 'queue_music'}
        </i>
        <span className="nav-title">
          {showPlaylist ? 'Playlist' : `Now playing ${currentIndex + 1} / ${playlist.length}`}
        </span>
        <select
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          title="Change theme"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Playlist view */}
      {showPlaylist && (
        <div className="playlist">
          <ul>
            {playlist.map((track, idx) => (
              <li
                key={track.id}
                className={`playlist-item${idx === currentIndex ? ' active' : ''}`}
                onClick={() => handlePlaylistClick(idx)}
              >
                <span className="playlist-num">{idx + 1}</span>
                <div className="playlist-info">
                  <span className="playlist-title">{track.title}</span>
                  <span className="playlist-artist">{track.artist}</span>
                </div>
                {idx === currentIndex && isPlaying && (
                  <i className="material-icons playlist-playing">equalizer</i>
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
      )}

      {/* Player view */}
      {!showPlaylist && (
        <>
          <div className="img">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className={isPlaying ? 'spinning' : ''}
            />
          </div>

          <div className="details">
            <p className="title">{currentTrack.title}</p>
            <p className="artist">{currentTrack.artist}</p>
          </div>

          <div className="progress">
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressValue}
              onChange={handleSeek}
            />
          </div>

          <div className="timer">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="controls">
            <i
              className="material-icons ctrl-icon"
              onClick={toggleRepeat}
              style={{ color: repeat ? 'var(--accent)' : 'var(--text-secondary)' }}
              title={repeat ? 'Repeat on' : 'Repeat off'}
            >
              repeat
            </i>

            <i
              className="material-icons ctrl-icon ctrl-skip"
              id="prev"
              onClick={handlePrev}
              title="Previous"
            >
              skip_previous
            </i>

            <div className="play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
              <i className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</i>
            </div>

            <i
              className="material-icons ctrl-icon ctrl-skip"
              id="next"
              onClick={handleNext}
              title="Next"
            >
              skip_next
            </i>

            <i
              className="material-icons ctrl-icon"
              onClick={() => setShowVolume((s) => !s)}
              title="Volume"
            >
              {volumeIcon}
            </i>

            <div className={`volume${showVolume ? ' show' : ''}`}>
              <i className="material-icons">{volumeIcon}</i>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeChange}
              />
              <span>{volume}</span>
            </div>
          </div>
        </>
      )}

      {/* Upload section */}
      <div className="upload-section">
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current.click()}
          title="Add local music files"
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