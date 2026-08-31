/* Orinsis Dance Studio — интерактив и анимации */
(function () {
  "use strict";

  // Если JS отключён или упал — контент останется видимым без анимаций
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Toast ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("toast--show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("toast--show"), 2600);
  }

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });
  }

  /* ---------- Появление блоков при прокрутке ---------- */
  const revealables = Array.from(document.querySelectorAll(".reveal"));
  revealables.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty("--d", el.dataset.delay);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    revealables.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Счётчики достижений ---------- */
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  function animateCounter(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => countObserver.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- Шапка, прогресс, кнопка наверх, мобильный CTA, параллакс ---------- */
  const topbar = document.querySelector(".topbar");
  const progressBar = document.querySelector("#progress span");
  const toTop = document.getElementById("toTop");
  const mobileCta = document.getElementById("mobileCta");
  const contactSection = document.getElementById("contact");
  const parallax = document.querySelector("[data-parallax]");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    const contactRect = contactSection ? contactSection.getBoundingClientRect() : null;
    const contactVisible = Boolean(
      contactRect && contactRect.top < window.innerHeight * 0.9 && contactRect.bottom > window.innerHeight * 0.1
    );

    if (topbar) topbar.classList.toggle("is-stuck", y > 12);
    if (progressBar) progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (toTop) toTop.classList.toggle("is-visible", y > 600 && !contactVisible);
    if (mobileCta) mobileCta.classList.toggle("is-visible", y > 500 && y < max - 260 && !contactVisible);
    if (parallax && !reduceMotion && y < window.innerHeight * 1.2) {
      parallax.style.transform = "translate3d(0," + y * 0.18 + "px,0) scale(1.06)";
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Активный пункт меню ---------- */
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav a"));
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = "#" + entry.target.id;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ---------- Фильтр расписания по дням ---------- */
  const chipsBox = document.getElementById("dayChips");
  const rows = Array.from(document.querySelectorAll(".schedule__row[data-day]"));
  if (chipsBox && rows.length) {
    const dayIndex = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const today = dayIndex[new Date().getDay()];

    function applyFilter(day) {
      rows.forEach((row) => {
        const match = day === "all" || row.dataset.day === day;
        row.classList.toggle("is-hidden", !match);
        if (match) {
          row.classList.remove("is-in");
          void row.offsetWidth;
          row.classList.add("is-in");
        }
      });
    }

    chipsBox.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      chipsBox.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      applyFilter(chip.dataset.day);
    });

    // Подсветим сегодняшний день в фильтре (без автофильтрации)
    const todayChip = chipsBox.querySelector('.chip[data-day="' + today + '"]');
    if (todayChip) todayChip.title = "Сегодня";
  }

  /* ---------- Заглушки для ненайденных фото ---------- */
  document.querySelectorAll(".shot img, .trainer__photo img, .slide img").forEach((img) => {
    const markMissing = () => {
      const holder = img.closest(".shot, .trainer__photo, .slide");
      if (!holder) return;
      holder.classList.add("is-missing");
      if (holder.classList.contains("slide") && !holder.dataset.placeholder) {
        const cap = holder.querySelector("figcaption");
        holder.dataset.placeholder = cap ? "Фото: " + cap.textContent.trim() : "Фото";
      }
    };
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0) markMissing();
  });

  /* ---------- Карусель фото ---------- */
  (function initCarousel() {
    const viewport = document.getElementById("galleryViewport");
    if (!viewport) return;

    const slides = Array.from(viewport.querySelectorAll(".slide"));
    if (!slides.length) return;

    const prevBtn = document.getElementById("galleryPrev");
    const nextBtn = document.getElementById("galleryNext");
    const dotsBox = document.getElementById("galleryDots");
    const toggle = document.getElementById("galleryToggle");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let index = 0;
    let timer = null;
    let playing = !reduced;
    const DELAY = 4000;

    // Точки-индикаторы
    const dots = slides.map((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Фото " + (i + 1) + " из " + slides.length);
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.addEventListener("click", () => {
        goTo(i);
        pause(true);
      });
      if (dotsBox) dotsBox.appendChild(dot);
      return dot;
    });

    function setActive(i) {
      index = i;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === i));
      dots.forEach((d, n) => d.setAttribute("aria-selected", n === i ? "true" : "false"));
    }

    function goTo(i, behavior) {
      const target = (i + slides.length) % slides.length;
      const slide = slides[target];
      viewport.scrollTo({
        left: slide.offsetLeft - viewport.offsetLeft,
        behavior: behavior || (reduced ? "auto" : "smooth"),
      });
      setActive(target);
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function play() {
      if (reduced) return;
      stopTimer();
      playing = true;
      if (toggle) {
        toggle.textContent = "Пауза";
        toggle.setAttribute("aria-pressed", "true");
      }
      timer = window.setInterval(next, DELAY);
    }

    function stopTimer() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function pause(manual) {
      stopTimer();
      if (manual) {
        playing = false;
        if (toggle) {
          toggle.textContent = "Автопрокрутка";
          toggle.setAttribute("aria-pressed", "false");
        }
      }
    }

    if (nextBtn) nextBtn.addEventListener("click", () => { next(); pause(true); });
    if (prevBtn) prevBtn.addEventListener("click", () => { prev(); pause(true); });

    if (toggle) {
      toggle.addEventListener("click", () => {
        if (playing) pause(true);
        else play();
      });
      if (reduced) {
        toggle.textContent = "Автопрокрутка";
        toggle.setAttribute("aria-pressed", "false");
      }
    }

    // Пауза при наведении / фокусе, возобновление после
    const box = viewport.closest(".carousel") || viewport;
    box.addEventListener("mouseenter", stopTimer);
    box.addEventListener("mouseleave", () => { if (playing) play(); });
    box.addEventListener("focusin", stopTimer);
    box.addEventListener("focusout", () => { if (playing) play(); });

    // Клавиатура
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); pause(true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); pause(true); }
    });

    // Перетаскивание мышью (тач работает нативно)
    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      dragging = true;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(e.pointerId);
      stopTimer();
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      viewport.scrollLeft = startScroll - (e.clientX - startX);
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("is-dragging");
      snapToNearest();
      pause(true);
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    function nearestIndex() {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const c = s.offsetLeft - viewport.offsetLeft + s.offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function snapToNearest() { goTo(nearestIndex()); }

    // Синхронизация точек со свайпом пальцем
    let scrollRaf = null;
    viewport.addEventListener("scroll", () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        const i = nearestIndex();
        if (i !== index) setActive(i);
      });
    });

    setActive(0);
    if (!reduced) {
      // Запускаем автопрокрутку, только когда карусель видна
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && playing) play();
            else stopTimer();
          });
        }, { threshold: 0.35 }).observe(box);
      } else {
        play();
      }
    }
  })();

  /* ---------- Фото-маршрут до студии ---------- */
  (function initRouteCarousel() {
    const root = document.querySelector("[data-route-carousel]");
    if (!root) return;

    const viewport = root.querySelector("[data-route-viewport]");
    const slides = Array.from(root.querySelectorAll(".route-slide"));
    const prev = root.querySelector("[data-route-prev]");
    const next = root.querySelector("[data-route-next]");
    const dotsBox = root.querySelector("[data-route-dots]");
    const card = root.closest(".route-card");
    const current = card ? card.querySelector("[data-route-current]") : null;
    const total = card ? card.querySelector("[data-route-total]") : null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!viewport || !slides.length) return;

    let index = 0;
    if (total) total.textContent = String(slides.length);

    const dots = slides.map((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Шаг " + (i + 1) + " из " + slides.length);
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.addEventListener("click", () => goTo(i));
      if (dotsBox) dotsBox.appendChild(dot);
      return dot;
    });

    function setActive(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      if (current) current.textContent = String(index + 1);
      dots.forEach((dot, i) => dot.setAttribute("aria-selected", i === index ? "true" : "false"));
    }

    function goTo(nextIndex) {
      const target = (nextIndex + slides.length) % slides.length;
      viewport.scrollTo({
        left: slides[target].offsetLeft - viewport.offsetLeft,
        behavior: reduced ? "auto" : "smooth",
      });
      setActive(target);
    }

    if (prev) prev.addEventListener("click", () => goTo(index - 1));
    if (next) next.addEventListener("click", () => goTo(index + 1));
    viewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); }
      if (event.key === "Home") { event.preventDefault(); goTo(0); }
      if (event.key === "End") { event.preventDefault(); goTo(slides.length - 1); }
    });

    let scrollFrame = null;
    viewport.addEventListener("scroll", () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        const width = viewport.clientWidth || 1;
        setActive(Math.round(viewport.scrollLeft / width));
      });
    }, { passive: true });

    setActive(0);
  })();

  /* ---------- Демо-ссылки ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-toast]");
    if (!a) return;
    e.preventDefault();
    showToast(a.dataset.toast || "Скоро добавим");
  });
})();
