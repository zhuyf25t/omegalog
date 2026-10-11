import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
export function Background({ scene }: { scene: 'cover' | 'workspace' }) {
  const video = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!video.current) return;
    if (paused || reduced) video.current.pause();
    else void video.current.play().catch(() => setPaused(true));
  }, [paused, reduced, scene]);
  return <>
    <div className={`scene scene-${scene}`} aria-hidden="true">
      <img src={`/media/${scene}.png`} alt="" />
      {!failed && !reduced && <video ref={video} src={`/media/${scene}.mp4?v=cloud-motion-v3`} poster={`/media/${scene}.png`} autoPlay loop muted playsInline onError={() => setFailed(true)} />}
      <div className="scene-veil" />
    </div>
    {!failed && !reduced && <button type="button" className="motion-toggle" aria-label={paused ? '播放背景' : '暂停背景'} onClick={() => setPaused(p => !p)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}
  </>;
}
