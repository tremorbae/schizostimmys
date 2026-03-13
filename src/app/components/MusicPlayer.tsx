"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const AUTOPLAY_TITLE = "Future Candy";

const MusicPlayer = memo(() => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeDb, setVolumeDb] = useState(0);
  const [bassBoost, setBassBoost] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [waitingForInteraction, setWaitingForInteraction] = useState(true);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const eqCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleMarqueeRef = useRef<HTMLSpanElement | null>(null);
  const artistMarqueeRef = useRef<HTMLSpanElement | null>(null);
  const tracksRef = useRef<Track[]>([]);
  const isDraggingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Fetch tracks from API (auto-reads public/music/ folder)
  useEffect(() => {
    fetch('/api/tracks')
      .then((res) => res.json())
      .then((data) => {
        let t = data.tracks || [];
        // Sort tracks: Future Candy first, then alphabetically
        t = [...t].sort((a, b) => {
          if (a.title.includes("Future Candy")) return -1;
          if (b.title.includes("Future Candy")) return 1;
          return a.title.localeCompare(b.title);
        });
        setTracks(t);
        tracksRef.current = t;
        if (t.length > 0) {
          setWaitingForInteraction(true);
        }
      })
      .catch(() => {});
  }, []);

  // Global click/keydown listener to trigger autoplay after user interaction
  useEffect(() => {
    if (!waitingForInteraction) return;

    const startAutoplay = (eventType?: string) => {
      console.log('Autoplay triggered by:', eventType || 'unknown');
      setWaitingForInteraction(false);
      const t = tracksRef.current;
      if (!audioRef.current || t.length === 0) return;

      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
      const autoplayTrack = t.find(track => track.title === AUTOPLAY_TITLE) || t[0];
      audioRef.current.src = autoplayTrack.src;
      audioRef.current.play().catch(() => {});
      const index = t.indexOf(autoplayTrack);
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
    };

    const handleClick = () => startAutoplay('click');
    const handleKeydown = () => startAutoplay('keydown');

    document.addEventListener("click", handleClick, { once: true });
    document.addEventListener("keydown", handleKeydown, { once: true });

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [waitingForInteraction]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowshelf";
    filter.frequency.value = 500;
    filter.gain.value = 0;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.25;
    analyser.minDecibels = -80;
    analyser.maxDecibels = -20;
    source.connect(gainNode);
    gainNode.connect(filter);
    filter.connect(analyser);
    analyser.connect(ctx.destination);
    audioCtxRef.current = ctx;
    gainNodeRef.current = gainNode;
    bassFilterRef.current = filter;
    analyserRef.current = analyser;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ended handler when repeat/shuffle changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, shuffle, currentTrackIndex]);

  // Recalculate marquee offsets for new track
  useEffect(() => {
    [titleMarqueeRef, artistMarqueeRef].forEach((ref) => {
      const el = ref.current;
      if (!el) return;
      const parent = el.parentElement;
      if (parent && el.scrollWidth > parent.clientWidth) {
        const offset = parent.clientWidth - el.scrollWidth;
        el.style.setProperty("--marquee-offset", `${offset}px`);
        // Adjust duration based on text length for consistent speed (50px per second)
        const duration = Math.abs(offset) / 50;
        el.style.animationDuration = `${duration}s`;
        // Restart animation by removing and re-adding the class
        el.style.animation = 'none';
        el.offsetHeight; // Trigger reflow
        el.style.animation = '';
      } else if (el) {
        el.style.setProperty("--marquee-offset", "0px");
        el.style.animationDuration = '8s';
      }
    });
  }, [currentTrackIndex]);

  // EQ Visualizer animation loop
  useEffect(() => {
    const bands = 10;
    const bandRanges = [
      [1, 3],    [3, 7],    [7, 14],   [14, 28],  [28, 56],
      [56, 112], [112, 210],[210, 380],[380, 650], [650, 1024]
    ];

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const canvas = eqCanvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      // Resize canvas to fill container (cap height)
      const container = canvas.parentElement;
      if (container) {
        const cw = container.clientWidth - 8;
        const ch = Math.min(container.clientHeight - 8, 72);
        if (cw > 0 && canvas.width !== cw) canvas.width = cw;
        if (ch > 0 && canvas.height !== ch) canvas.height = ch;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barWidth = Math.floor(w / bands) - 2;
      const gap = 2;

      for (let i = 0; i < bands; i++) {
        const [start, end] = bandRanges[i];
        let sum = 0;
        for (let j = start; j < end; j++) sum += dataArray[j];
        const avg = sum / (end - start);
        const barHeight = (avg / 255) * h;

        const x = i * (barWidth + gap) + 1;
        const segmentH = 3;
        const segmentGap = 1;
        const numSegments = Math.floor(barHeight / (segmentH + segmentGap));
        for (let s = 0; s < numSegments; s++) {
          const y = h - (s + 1) * (segmentH + segmentGap);
          ctx.fillStyle = "#ff7fdf";
          ctx.fillRect(x, y, barWidth, segmentH);
        }
      }
    };

    draw();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const playTrack = useCallback((index: number) => {
    // Disable autoplay if user manually selects a song
    if (waitingForInteraction) {
      setWaitingForInteraction(false);
    }
    
    const track = tracks[index];
    if (!track) return;

    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();

    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrackIndex === index && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = track.src;
      audio.play().catch(() => {});
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrackIndex, isPlaying, tracks, waitingForInteraction]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrackIndex === -1 && tracks.length > 0) {
        playTrack(0);
        return;
      }
      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrackIndex, tracks.length, playTrack]);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      playTrack(randomIdx);
    } else {
      const prev = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
      playTrack(prev);
    }
  }, [tracks.length, currentTrackIndex, shuffle, playTrack]);

  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      playTrack(randomIdx);
    } else {
      const next = currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1;
      if (next === 0 && repeat === "off" && currentTrackIndex === tracks.length - 1) {
        setIsPlaying(false);
        setCurrentTrackIndex(0);
        if (audioRef.current) {
          audioRef.current.src = tracks[0].src;
          audioRef.current.currentTime = 0;
        }
        setCurrentTime(0);
        return;
      }
      playTrack(next);
    }
  }, [tracks, currentTrackIndex, shuffle, repeat, playTrack]);

  const handleStop = useCallback(() => {
    // Disable autoplay if user clicks stop first
    if (waitingForInteraction) {
      setWaitingForInteraction(false);
    }
    
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, [waitingForInteraction]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const db = parseFloat(e.target.value);
      setVolumeDb(db);
      if (gainNodeRef.current) gainNodeRef.current.gain.value = db <= -10 ? 0 : Math.pow(10, db / 20);
    },
    []
  );

  const handleBassBoostChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setBassBoost(val);
      if (bassFilterRef.current) bassFilterRef.current.gain.value = val * 2.5;
    },
    []
  );

  const resetVolume = useCallback((e: React.MouseEvent) => {
    if (e.detail === 2 || e.shiftKey) {
      setVolumeDb(0);
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 1;
    }
  }, []);

  const resetBass = useCallback((e: React.MouseEvent) => {
    if (e.detail === 2 || e.shiftKey) {
      setBassBoost(0);
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 0;
    }
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const currentTrack = tracks[currentTrackIndex];
  const baseProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progress = dragProgress !== null ? dragProgress : baseProgress;

  return (
    <div className="player-container">
      {/* Now Playing + EQ */}
      <div className="player-display">
        <div className="player-now-playing">
          <div className="player-track-name">
            <span className="player-marquee" ref={titleMarqueeRef}>
              {currentTrackIndex >= 0 && tracks[currentTrackIndex] ? tracks[currentTrackIndex].title : (tracks.find(t => t.title.includes("Future Candy"))?.title || "Future Candy")}
            </span>
          </div>
          <div className="player-track-artist">
            <span className="player-marquee" ref={artistMarqueeRef}>
              {currentTrackIndex >= 0 && tracks[currentTrackIndex] ? tracks[currentTrackIndex].artist : (tracks.find(t => t.title.includes("Future Candy"))?.artist || "YUC'e")}
            </span>
          </div>
        </div>
        <div className="player-eq-container">
          <canvas ref={eqCanvasRef} className="player-eq-canvas" />
        </div>
        <div className="player-made-with-love">
          made with love!
        </div>
      </div>

      {/* Progress Bar */}
      <div className="player-progress-row">
        <span className="player-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="player-progress-slider"
          min={0}
          max={duration || 1}
          step={0.01}
          value={dragProgress !== null ? (dragProgress / 100) * (duration || 1) : currentTime}
          style={{ background: `linear-gradient(to right, #ff7fdf ${progress}%, #ffffff ${progress}%)` }}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (audioRef.current) audioRef.current.currentTime = val;
          }}
          onMouseDown={() => { isDraggingRef.current = true; }}
          onMouseUp={() => { isDraggingRef.current = false; setDragProgress(null); }}
          onInput={(e) => {
            const val = parseFloat((e.target as HTMLInputElement).value);
            const pct = duration > 0 ? (val / duration) * 100 : 0;
            setDragProgress(pct);
          }}
        />
        <span className="player-time">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="player-controls">
        <div className="player-control-group">
          <span className="player-volume-label">vol</span>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={volumeDb}
            onChange={handleVolumeChange}
            onClick={resetVolume}
            className="player-volume-slider"
            style={{ background: `linear-gradient(to right, #ff7fdf ${((volumeDb + 10) / 20) * 100}%, #ffffff ${((volumeDb + 10) / 20) * 100}%)` }}
          />
          <span className="player-db-label">db{volumeDb > 0 ? `+${Math.round(volumeDb)}` : Math.round(volumeDb)}</span>
        </div>
        <div className="player-control-group center">
          <div className="player-buttons">
            <div className="player-btn-row">
              <button
                className={`player-btn player-btn-text player-btn-inline player-btn-shuffle ${shuffle ? "player-btn-active" : ""}`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                shuffle
              </button>
              <button className="player-btn player-btn-prev" onClick={handlePrev} title="Previous">
                <span className="player-icon-prev" />
              </button>
              <button
                className="player-btn player-btn-play"
                 onClick={togglePlay}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <span className="player-icon-pause" /> : <span className="player-icon-play" />}
              </button>
              <button className="player-btn player-btn-stop" onClick={handleStop} title="Stop">
                <span className="player-icon-stop" />
              </button>
              <button className="player-btn player-btn-next" onClick={handleNext} title="Next">
                <span className="player-icon-next" />
              </button>
              <button
                className={`player-btn player-btn-text player-btn-inline player-btn-repeat ${repeat !== "off" ? "player-btn-active" : ""}`}
                onClick={cycleRepeat}
                title={`Repeat: ${repeat}`}
              >
                {repeat === "one" ? "repeat 1" : "repeat"}
              </button>
            </div>
          </div>
        </div>
        <div className="player-control-group right">
          <span className="player-bass-label">bass</span>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={bassBoost}
            onChange={handleBassBoostChange}
            onClick={resetBass}
            className="player-volume-slider"
            style={{ background: `linear-gradient(to right, #ff7fdf ${((bassBoost + 10) / 20) * 100}%, #ffffff ${((bassBoost + 10) / 20) * 100}%)` }}
          />
          <span className="player-db-label">db{bassBoost > 0 ? `+${Math.round(bassBoost)}` : Math.round(bassBoost)}</span>
        </div>
      </div>

      {/* Track List */}
      <div className="player-tracklist">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`player-tracklist-item ${
              index === currentTrackIndex ? "player-tracklist-active" : ""
            }`}
            onClick={() => playTrack(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") playTrack(index);
            }}
          >
            <span className="player-tracklist-num">
              {`${index + 1}.`}
            </span>
            <div className="player-tracklist-info">
              <span className="player-tracklist-name">{track.title}</span>
              <span className="player-tracklist-artist">{track.artist}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

MusicPlayer.displayName = "MusicPlayer";

export default MusicPlayer;
