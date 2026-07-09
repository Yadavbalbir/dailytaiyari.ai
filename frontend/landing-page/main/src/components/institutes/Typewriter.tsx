"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
}

/** Lightweight typewriter that cycles through phrases. */
export default function Typewriter({
  words,
  className = "",
  typingSpeed = 90,
  deletingSpeed = 45,
  pauseMs = 1400,
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[index % words.length];
    let delay = deleting ? deletingSpeed : typingSpeed;

    if (!deleting && text === current) {
      delay = pauseMs;
      const t = setTimeout(() => setDeleting(true), delay);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return;
    }

    const t = setTimeout(() => {
      setText((prev) =>
        deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
      );
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, index, words, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className} aria-live="polite">
      {text}
      <span className="inline-block w-[2px] h-[1em] align-middle bg-current ml-0.5 animate-pulse" />
    </span>
  );
}
