/* ═══════════════════════════════════════════════════════════════
   BIRTHDAY ENVELOPE — Interactive Experience
   Pure Vanilla JS + GSAP (3D drag, physics, scroll & celebration)
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ─── DOM ELEMENTS ─────────────────────────────────────────────
  const envelopeFlap       = document.getElementById("envelope-flap");
  const envelopeSeal       = document.getElementById("envelope-seal");
  const envelopeWrapper    = document.getElementById("envelope-wrapper");
  const envelopeShadow     = document.getElementById("envelope-shadow");
  const letterContainer    = document.getElementById("letter-container");
  const letterContent      = document.getElementById("letter-content");
  const letterTab          = document.getElementById("letter-tab");
  const instructionPill    = document.getElementById("instruction-pill");
  const instructionText    = document.getElementById("instruction-text");
  const celebrationBadge   = document.getElementById("celebration-badge");
  const finalOverlay       = document.getElementById("final-overlay");
  const replayBtn          = document.getElementById("replay-btn");
  const confettiCanvas     = document.getElementById("confetti-canvas");
  const floatingBalloons   = document.getElementById("floating-balloons");
  const floatingSparkles   = document.getElementById("floating-sparkles");

  // ─── APPLICATION STATE ────────────────────────────────────────
  let phase = "flap"; // "flap" | "letter" | "reading" | "closing" | "done"
  let isClosing = false;
  let scrollObserver = null;

  // Flap drag state
  let isFlapDragging = false;
  let flapStartY = 0;
  let flapDeltaY = 0;

  // Letter drag state
  let isLetterDragging = false;
  let letterStartY = 0;
  let letterCurrentY = 0;
  const PEEK_OFFSET = -50; // Letter peeks out by 50px when flap opens

  // ─── UTILITY: Get pointer Y from Touch or Mouse ───────────────
  function getPointerY(e) {
    if (e.touches && e.touches.length > 0) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientY;
    return e.clientY;
  }

  /* ═══════════════════════════════════════════════════════════════
     0. AMBIENT BACKGROUND PARTICLES & BALLOONS
     ═══════════════════════════════════════════════════════════════ */
  function initAmbientCelebration() {
    // 1. Pastel Floating Balloons
    const balloonColors = [
      "rgba(255, 182, 193, 0.8)", // Pastel pink
      "rgba(186, 230, 253, 0.8)", // Sky blue
      "rgba(254, 240, 138, 0.75)", // Soft yellow
      "rgba(244, 114, 182, 0.7)",  // Rose
      "rgba(196, 181, 253, 0.75)"  // Lavender
    ];

    const balloonCount = 14;
    for (let i = 0; i < balloonCount; i++) {
      const b = document.createElement("div");
      b.className = "balloon";
      const size = 32 + Math.random() * 38;
      const left = Math.random() * 95;
      const duration = 14 + Math.random() * 16;
      const delay = Math.random() * 8;
      const color = balloonColors[i % balloonColors.length];

      b.style.width = size + "px";
      b.style.height = (size * 1.25) + "px";
      b.style.left = left + "%";
      b.style.bottom = "-120px";
      b.style.background = `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 75%)`;

      floatingBalloons.appendChild(b);

      // Continuous float animation
      gsap.to(b, {
        y: -window.innerHeight - 300,
        x: (Math.random() - 0.5) * 80,
        rotation: (Math.random() - 0.5) * 20,
        duration: duration,
        delay: delay,
        repeat: -1,
        ease: "none",
      });
    }

    // 2. Floating Twinkling Sparkles
    const sparkleCount = 28;
    for (let i = 0; i < sparkleCount; i++) {
      const s = document.createElement("div");
      s.className = "sparkle";
      const size = 3 + Math.random() * 6;
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";

      floatingSparkles.appendChild(s);

      gsap.to(s, {
        opacity: 0.1 + Math.random() * 0.7,
        scale: 0.6 + Math.random() * 0.8,
        y: "+=30",
        duration: 2 + Math.random() * 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: Math.random() * 3,
      });
    }

    // 3. Gentle bobbing of the envelope in initial state
    gsap.to(envelopeWrapper, {
      y: -8,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     PHASE 1: DRAGGING THE FLAP TO OPEN
     ═══════════════════════════════════════════════════════════════ */
  function initFlapDrag() {
    envelopeFlap.addEventListener("mousedown", onFlapStart);
    envelopeFlap.addEventListener("touchstart", onFlapStart, { passive: false });
  }

  function onFlapStart(e) {
    if (phase !== "flap") return;
    e.preventDefault();

    isFlapDragging = true;
    flapStartY = getPointerY(e);
    flapDeltaY = 0;

    envelopeFlap.classList.add("dragging");

    window.addEventListener("mousemove", onFlapMove);
    window.addEventListener("touchmove", onFlapMove, { passive: false });
    window.addEventListener("mouseup", onFlapEnd);
    window.addEventListener("touchend", onFlapEnd);
  }

  function onFlapMove(e) {
    if (!isFlapDragging || phase !== "flap") return;
    e.preventDefault();

    const currentY = getPointerY(e);
    flapDeltaY = flapStartY - currentY; // positive = dragging UPWARDS

    // Map drag distance (0px to 110px) to flap rotation (0deg to 180deg)
    const progress = Math.min(1, Math.max(0, flapDeltaY / 110));
    const rotation = progress * 180;

    envelopeFlap.style.transform = `rotateX(${rotation}deg)`;

    // Dynamically adjust z-index so flap flips behind letter when past 90 degrees
    if (rotation > 90) {
      envelopeFlap.style.zIndex = "1";
    } else {
      envelopeFlap.style.zIndex = "4";
    }

    // If dragged past threshold (50px), snap open!
    if (flapDeltaY > 55) {
      snapFlapOpen();
    }
  }

  function onFlapEnd() {
    if (!isFlapDragging) return;
    isFlapDragging = false;
    envelopeFlap.classList.remove("dragging");

    cleanupFlapWindowEvents();

    if (flapDeltaY > 40) {
      snapFlapOpen();
    } else {
      // Snap back closed
      gsap.to(envelopeFlap, {
        rotateX: 0,
        duration: 0.45,
        ease: "power2.out",
        onComplete: () => {
          envelopeFlap.style.zIndex = "4";
          envelopeFlap.style.transform = "";
        },
      });
    }
  }

  function cleanupFlapWindowEvents() {
    window.removeEventListener("mousemove", onFlapMove);
    window.removeEventListener("touchmove", onFlapMove);
    window.removeEventListener("mouseup", onFlapEnd);
    window.removeEventListener("touchend", onFlapEnd);
  }

  function snapFlapOpen() {
    if (phase !== "flap") return;
    phase = "letter";
    cleanupFlapWindowEvents();

    envelopeFlap.removeEventListener("mousedown", onFlapStart);
    envelopeFlap.removeEventListener("touchstart", onFlapStart);

    // Animate flap completely open to 180 degrees
    gsap.to(envelopeFlap, {
      rotateX: 180,
      duration: 0.65,
      ease: "power2.out",
      onComplete: () => {
        envelopeFlap.classList.add("flap-open");
        envelopeFlap.style.zIndex = "1";
      },
    });

    // Gentle celebration burst
    popMiniConfetti(envelopeWrapper.getBoundingClientRect());

    // Letter peeks out from the pocket
    setTimeout(() => {
      gsap.to(letterContainer, {
        y: PEEK_OFFSET,
        duration: 0.6,
        ease: "back.out(1.5)",
        onComplete: () => {
          letterContainer.classList.add("show-tab");
          updateInstruction("Now pull the letter out to read it ✨");
          initLetterDrag();
        },
      });
    }, 200);
  }

  /* ═══════════════════════════════════════════════════════════════
     PHASE 2: PULLING THE LETTER OUT
     ═══════════════════════════════════════════════════════════════ */
  function initLetterDrag() {
    letterContainer.addEventListener("mousedown", onLetterStart);
    letterContainer.addEventListener("touchstart", onLetterStart, { passive: false });

    // Also allow tapping the pull tab to expand
    letterTab.addEventListener("click", () => {
      if (phase === "letter") expandLetter();
    });
  }

  function onLetterStart(e) {
    if (phase !== "letter") return;
    e.preventDefault();

    isLetterDragging = true;
    letterStartY = getPointerY(e);
    letterCurrentY = PEEK_OFFSET;

    letterContainer.classList.add("dragging");
    gsap.killTweensOf(letterContainer);

    window.addEventListener("mousemove", onLetterMove);
    window.addEventListener("touchmove", onLetterMove, { passive: false });
    window.addEventListener("mouseup", onLetterEnd);
    window.addEventListener("touchend", onLetterEnd);
  }

  function onLetterMove(e) {
    if (!isLetterDragging || phase !== "letter") return;
    e.preventDefault();

    const currentY = getPointerY(e);
    const deltaY = currentY - letterStartY; // negative = dragging UP

    // Allow dragging up from the peek position
    letterCurrentY = PEEK_OFFSET + deltaY;

    // Resistance if user tries dragging down into the pocket
    if (letterCurrentY > PEEK_OFFSET) {
      letterCurrentY = PEEK_OFFSET + (deltaY * 0.2);
    }

    letterContainer.style.transform = `translateY(${letterCurrentY}px)`;

    // Shadow feedback
    const pullProgress = Math.min(1, Math.abs(letterCurrentY - PEEK_OFFSET) / 100);
    envelopeShadow.style.transform = `scaleX(${1 - pullProgress * 0.15})`;

    // Threshold reached: pull up by ~90px past peek
    if (letterCurrentY < -140) {
      expandLetter();
    }
  }

  function onLetterEnd() {
    if (!isLetterDragging) return;
    isLetterDragging = false;
    letterContainer.classList.remove("dragging");

    cleanupLetterWindowEvents();

    if (phase === "letter") {
      // Released before threshold: snap back smoothly to peek position
      gsap.to(letterContainer, {
        y: PEEK_OFFSET,
        duration: 0.45,
        ease: "back.out(1.3)",
      });
      gsap.to(envelopeShadow, { scaleX: 1, duration: 0.3 });
    }
  }

  function cleanupLetterWindowEvents() {
    window.removeEventListener("mousemove", onLetterMove);
    window.removeEventListener("touchmove", onLetterMove);
    window.removeEventListener("mouseup", onLetterEnd);
    window.removeEventListener("touchend", onLetterEnd);
  }

  function expandLetter() {
    if (phase === "reading") return;
    phase = "reading";

    cleanupLetterWindowEvents();
    letterContainer.removeEventListener("mousedown", onLetterStart);
    letterContainer.removeEventListener("touchstart", onLetterStart);

    letterContainer.classList.remove("show-tab", "dragging");
    instructionPill.style.opacity = "0";
    celebrationBadge.style.opacity = "0";

    // Clear inline transform so CSS is-expanded centering rule applies
    letterContainer.style.transform = "";

    // Softly fade & push back envelope background
    gsap.to(envelopeWrapper, {
      scale: 0.94,
      opacity: 0.4,
      duration: 0.6,
      ease: "power2.out",
    });

    // Expand the letter into viewport
    letterContainer.classList.add("is-expanded");

    // Launch celebratory confetti burst!
    setTimeout(launchConfetti, 400);

    // Initialize IntersectionObserver & scroll-bottom closing trigger
    setTimeout(() => {
      initScrollObserver();
      initScrollCloseTrigger();
    }, 700);
  }

  /* ═══════════════════════════════════════════════════════════════
     PHASE 3: SCROLL REVEALS (IntersectionObserver)
     ═══════════════════════════════════════════════════════════════ */
  function initScrollObserver() {
    const targets = letterContent.querySelectorAll(
      ".polaroid, .text-block, .video-container, .letter-text"
    );

    if (scrollObserver) {
      scrollObserver.disconnect();
    }

    scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            scrollObserver.unobserve(entry.target);
          }
        });
      },
      {
        root: letterContent,
        rootMargin: "0px",
        threshold: 0.15,
      }
    );

    targets.forEach((el) => scrollObserver.observe(el));
  }

  /* ═══════════════════════════════════════════════════════════════
     PHASE 4: THE CLOSING MECHANISM & FINALE
     ═══════════════════════════════════════════════════════════════ */
  function initScrollCloseTrigger() {
    letterContent.addEventListener("scroll", onLetterScroll);
  }

  function onLetterScroll() {
    if (phase !== "reading" || isClosing) return;

    const el = letterContent;
    // Calculate if user reached the absolute bottom (with 8px rounding tolerance)
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceToBottom <= 8) {
      isClosing = true;
      phase = "closing";
      closeEnvelope();
    }
  }

  function closeEnvelope() {
    letterContent.removeEventListener("scroll", onLetterScroll);

    // Step 1: Smoothly scroll letter content back to top
    letterContent.scrollTo({ top: 0, behavior: "smooth" });

    // Step 2: After scroll, collapse letter back into the envelope
    setTimeout(() => {
      letterContainer.classList.remove("is-expanded");

      // Restore envelope wrapper
      gsap.to(envelopeWrapper, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
      });

      // Step 3: Slide letter down into pocket
      setTimeout(() => {
        gsap.to(letterContainer, {
          y: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });

        // Step 4: Fold flap back closed
        setTimeout(() => {
          envelopeFlap.classList.remove("flap-open");
          envelopeFlap.style.zIndex = "4";

          gsap.to(envelopeFlap, {
            rotateX: 0,
            duration: 0.7,
            ease: "power2.inOut",
            onComplete: () => {
              // Step 5: Show the final "I love you" celebration modal
              setTimeout(() => {
                phase = "done";
                showFinalOverlay();
              }, 400);
            },
          });
        }, 400);
      }, 500);
    }, 600);
  }

  function showFinalOverlay() {
    finalOverlay.classList.add("show");
    launchConfetti();
  }

  /* ═══════════════════════════════════════════════════════════════
     REPLAY BUTTON: Reset & Play Again
     ═══════════════════════════════════════════════════════════════ */
  replayBtn.addEventListener("click", () => {
    finalOverlay.classList.remove("show");

    // Reset flags
    isClosing = false;
    phase = "flap";

    // Reset letter content scroll
    letterContent.scrollTop = 0;

    // Reset visible animation classes on revealed items
    const visibleItems = letterContent.querySelectorAll(".visible");
    visibleItems.forEach((item) => item.classList.remove("visible"));

    if (scrollObserver) {
      scrollObserver.disconnect();
      scrollObserver = null;
    }

    // Reset envelope and letter DOM states
    letterContainer.classList.remove("is-expanded", "show-tab", "dragging");
    letterContainer.style.transform = "";
    envelopeFlap.classList.remove("flap-open", "dragging");
    envelopeFlap.style.transform = "";
    envelopeFlap.style.zIndex = "4";

    envelopeWrapper.style.transform = "";
    envelopeWrapper.style.opacity = "1";

    celebrationBadge.style.opacity = "1";
    instructionPill.style.opacity = "1";
    updateInstruction("Drag the top flap up to open the envelope");

    // Reattach flap drag
    setTimeout(initFlapDrag, 500);
  });

  function updateInstruction(text) {
    instructionText.textContent = text;
    gsap.fromTo(instructionPill, { scale: 0.95 }, { scale: 1, duration: 0.3 });
  }

  /* ═══════════════════════════════════════════════════════════════
     PASTEL BIRTHDAY CONFETTI ENGINE (Canvas)
     ═══════════════════════════════════════════════════════════════ */
  const ctx = confettiCanvas.getContext("2d");
  let confettiPieces = [];
  let animId = null;

  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const CELEBRATION_COLORS = [
    "#ff9bb2", // pastel pink
    "#7dd3fc", // sky blue
    "#fbbf24", // gold
    "#f47290", // rose
    "#38bdf8", // cyan blue
    "#c084fc", // purple
    "#34d399", // mint
    "#ffffff", // pure white
  ];

  function makeConfettiPiece(originX, originY) {
    const isHeart = Math.random() > 0.8;
    const isCircle = !isHeart && Math.random() > 0.5;

    return {
      x: originX !== undefined ? originX : Math.random() * confettiCanvas.width,
      y: originY !== undefined ? originY : -20 - Math.random() * confettiCanvas.height * 0.3,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 8,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 6,
      vy: 2.5 + Math.random() * 5,
      oscAmp: Math.random() * 3,
      oscSpeed: 0.02 + Math.random() * 0.04,
      oscOffset: Math.random() * Math.PI * 2,
      opacity: 1,
      fade: 0.002 + Math.random() * 0.003,
      shape: isHeart ? "heart" : (isCircle ? "circle" : "rect"),
      t: 0,
    };
  }

  function popMiniConfetti(rect) {
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height * 0.3;
    for (let i = 0; i < 40; i++) {
      const p = makeConfettiPiece(startX, startY);
      p.vx = (Math.random() - 0.5) * 8;
      p.vy = -3 - Math.random() * 5; // pop upwards
      confettiPieces.push(p);
    }
    if (!animId) renderConfetti();
  }

  function launchConfetti() {
    for (let i = 0; i < 160; i++) {
      confettiPieces.push(makeConfettiPiece());
    }
    if (!animId) renderConfetti();
  }

  function drawHeart(c, x, y, size) {
    c.save();
    c.translate(x, y);
    c.scale(size / 15, size / 15);
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(-5, -5, -10, 0, 0, 10);
    c.bezierCurveTo(10, 0, 5, -5, 0, 0);
    c.fill();
    c.restore();
  }

  function renderConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiPieces.forEach((p) => {
      p.t++;
      p.x += p.vx + Math.sin(p.t * p.oscSpeed + p.oscOffset) * p.oscAmp;
      p.y += p.vy;
      p.rot += p.rotSpeed;

      if (p.y > confettiCanvas.height * 0.4) {
        p.opacity -= p.fade;
        p.vy *= 0.992;
      }

      if (p.opacity <= 0) return;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "heart") {
        drawHeart(ctx, 0, 0, p.w * 1.4);
      }

      ctx.restore();
    });

    confettiPieces = confettiPieces.filter(
      (p) => p.opacity > 0 && p.y < confettiCanvas.height + 60
    );

    if (confettiPieces.length > 0) {
      animId = requestAnimationFrame(renderConfetti);
    } else {
      animId = null;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // ─── INITIALIZATION ───────────────────────────────────────────
  initAmbientCelebration();
  initFlapDrag();

  // Prevent default context menus and image drag
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("dragstart", (e) => e.preventDefault());
  });

  console.log("🎂 Birthday Envelope Loaded: Drag flap up to open!");
})();
