import { useEffect } from "react";
import { motion } from "framer-motion";
import { FINALIST_TRACKS } from "../data/finalists.static";
import { getTrackInfo } from "../constants/tracks";

const PAGE_SEED = "openclaw-finalists-2026";

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function shuffle(list, seed) {
  const random = createRandom(seed);
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const shuffledTracks = shuffle(
  FINALIST_TRACKS.map((track) => ({
    ...track,
    projects: shuffle(track.projects, `${PAGE_SEED}:${track.trackId}`),
  })),
  `${PAGE_SEED}:track-order`,
);

function TrackPanel({ track, index }) {
  const theme = getTrackInfo(track.trackId);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className="glass-panel rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold ${theme?.color ?? "text-slate-300"}`}>
            赛道 {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">
            {track.trackLabel}
          </h2>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme?.border ?? "border-white/20"} ${theme?.color ?? "text-slate-300"}`}
        >
          {track.projects.length} 项
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {track.projects.map((project, projectIndex) => (
          <motion.article
            key={`${track.trackId}-${project.groupNo}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05 + projectIndex * 0.02,
            }}
            className="glass-card rounded-xl p-4"
          >
            <h3 className="mt-2 text-base font-semibold text-white">
              {project.title}
            </h3>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

export default function FinalistGallery() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-background-dark text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gradient-primary">
            北纬龙虾大赛 OpenClaw 决赛入围清单
          </h1>
        </header>

        <main className="grid gap-6 lg:grid-cols-2">
          {shuffledTracks.map((track, index) => (
            <TrackPanel key={track.trackId} track={track} index={index} />
          ))}
        </main>
      </div>
    </div>
  );
}
