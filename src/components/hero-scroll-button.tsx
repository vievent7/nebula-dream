"use client";

import type { MouseEvent } from "react";

export function HeroScrollButton() {
  const revealTracks = () => {
    const target = document.getElementById("tracks");
    if (!target) {
      return;
    }

    target.classList.remove("tracks-hidden");
    target.classList.add("tracks-visible");
    target.classList.add("tracks-entry-flash");
    window.setTimeout(() => {
      target.classList.remove("tracks-entry-flash");
    }, 1200);
    return target;
  };

  const handlePrimaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = revealTracks();
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <a
      href="#tracks"
      onClick={handlePrimaryClick}
      className="hero-breathe hero-cta-primary rounded-full px-8 py-3 text-base font-semibold text-[#04111f]"
    >
      Ecouter maintenant
    </a>
  );
}
