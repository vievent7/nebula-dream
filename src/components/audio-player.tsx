"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type AudioPlayerProps = {
  src: string;
  label: string;
  maxSeconds?: number;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, label, maxSeconds }: AudioPlayerProps) {
  const playerId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const effectiveDuration = useMemo(() => {
    if (!duration) return 0;
    if (!maxSeconds) return duration;
    return Math.min(duration, maxSeconds);
  }, [duration, maxSeconds]);

  const progress = useMemo(() => {
    if (!effectiveDuration) return 0;
    return (currentTime / effectiveDuration) * 100;
  }, [currentTime, effectiveDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (maxSeconds && audio.currentTime >= maxSeconds) {
        audio.currentTime = maxSeconds;
        audio.pause();
        setCurrentTime(maxSeconds);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(audio.currentTime);
    };
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [maxSeconds]);

  useEffect(() => {
    const handleExternalPlay = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail === playerId) {
        return;
      }

      const audio = audioRef.current;
      if (!audio || audio.paused) {
        return;
      }

      audio.pause();
      setIsPlaying(false);
    };

    window.addEventListener("nebula-audio-play", handleExternalPlay as EventListener);
    return () => {
      window.removeEventListener("nebula-audio-play", handleExternalPlay as EventListener);
    };
  }, [playerId]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (maxSeconds && audio.currentTime >= maxSeconds) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      await audio.play();
      window.dispatchEvent(new CustomEvent("nebula-audio-play", { detail: playerId }));
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !effectiveDuration) return;
    const nextTime = (value / 100) * effectiveDuration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="w-full rounded-xl border border-cyan-100/20 bg-[#0a1628]/70 p-2.5 backdrop-blur-md">
      <audio ref={audioRef} src={src} preload="none" />
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-cyan-200/80">{label}</p>
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          className="h-9 w-9 shrink-0 rounded-full border border-cyan-100/50 bg-cyan-200/15 text-xs font-bold text-cyan-100 shadow-[0_0_18px_rgba(56,189,248,0.35)] transition hover:scale-105 hover:bg-cyan-200/25"
        >
          {isPlaying ? "II" : ">"}
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={Number.isFinite(progress) ? progress : 0}
            onChange={(event) => seek(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-300"
          />
          <div className="mt-0.5 flex items-center justify-between text-[10px] text-zinc-300">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
