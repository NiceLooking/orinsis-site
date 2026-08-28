/* Orinsis Dance Studio — интерактив и анимации */
(function () {
  "use strict";

  // Если JS отключён или упал — контент останется видимым без анимаций
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     КУДА ОТПРАВЛЯЕТСЯ ЗАЯВКА С ФОРМЫ — НАСТРОЙКИ ЗДЕСЬ
     ==========================================================
     mode:
       "whatsapp" — открывает WhatsApp с готовым текстом (работает без настроек)
       "telegram" — присылает заявку в личные сообщения Telegram через бота
       "email"    — присылает заявку на почту (сервис FormSubmit / Formspree)

     Телеграм: напиши @BotFather → /newbot → получишь token.
     Потом напиши своему боту любое сообщение и открой
     https://api.telegram.org/bot<TOKEN>/getUpdates — там будет твой chat.id.

     Почта (без регистрации): emailEndpoint = "https://formsubmit.co/ajax/твоя@почта.ru"
     (первую заявку нужно подтвердить по письму от сервиса).
     ========================================================== */
  const LEAD_CONFIG = {
    mode: "email",

    whatsappPhone: "79370934199",

    telegram: {
      botToken: "",  // например: "7712345678:AAH..."
      chatId: "",    // например: "123456789"
    },

    // Почта для заявок
    emailEndpoint: "https://formsubmit.co/ajax/orinsiss@yandex.ru",

    // Если отправка не удалась — открыть WhatsApp, чтобы заявка не потерялась
    fallbackToWhatsApp: true,
  };

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
  const parallax = document.querySelector("[data-parallax]");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (topbar) topbar.classList.toggle("is-stuck", y > 12);
    if (progressBar) progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    if (mobileCta) mobileCta.classList.toggle("is-visible", y > 500 && y < max - 260);
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

  /* ---------- Демо-ссылки ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-toast]");
    if (!a) return;
    e.preventDefault();
    showToast(a.dataset.toast || "Скоро добавим");
  });

  /* ---------- Форма: маска телефона и валидация ---------- */
  const form = document.getElementById("leadForm");
  if (form) {
    const phone = form.querySelector('input[name="phone"]');

    function formatPhone(value) {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("8")) digits = "7" + digits.slice(1);
      if (!digits.startsWith("7")) digits = "7" + digits;
      digits = digits.slice(0, 11);
      const rest = digits.slice(1);
      let out = "+7";
      if (rest.length) out += " (" + rest.slice(0, 3);
      if (rest.length >= 3) out += ") " + rest.slice(3, 6);
      if (rest.length >= 6) out += "-" + rest.slice(6, 8);
      if (rest.length >= 8) out += "-" + rest.slice(8, 10);
      return out;
    }

    if (phone) {
      phone.addEventListener("input", () => {
        phone.value = formatPhone(phone.value);
      });
    }

    function setError(input, message) {
      const field = input.closest(".field");
      if (!field) return;
      let error = field.querySelector(".field__error");
      if (message) {
        if (!error) {
          error = document.createElement("span");
          error.className = "field__error";
          field.appendChild(error);
        }
        error.textContent = message;
        field.classList.add("has-error");
        input.classList.add("is-invalid");
      } else {
        field.classList.remove("has-error");
        input.classList.remove("is-invalid");
      }
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector('input[name="name"]');
      let ok = true;

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError(name, "Укажи имя — хотя бы 2 символа");
        ok = false;
      } else {
        setError(name, "");
      }

      const digits = (phone.value || "").replace(/\D/g, "");
      if (digits.length !== 11) {
        setError(phone, "Введи телефон полностью: +7 и 10 цифр");
        ok = false;
      } else {
        setError(phone, "");
      }

      if (!ok) {
        showToast("Проверь подсвеченные поля 🙌");
        form.querySelector(".is-invalid").focus();
        return;
      }

      const data = new FormData(form);
      const summary =
        "Заявка Orinsis\n" +
        "Имя: " + String(data.get("name") || "").trim() + "\n" +
        "Телефон: " + String(data.get("phone") || "").trim() + "\n" +
        "Направление: " + String(data.get("direction") || "").trim() + "\n" +
        "Комментарий: " + (String(data.get("message") || "").trim() || "-");

      console.log(summary);
      sendLead(summary, data);
    });

    function openWhatsApp(summary) {
      const waUrl =
        "https://wa.me/" + LEAD_CONFIG.whatsappPhone + "?text=" + encodeURIComponent(summary);
      window.open(waUrl, "_blank", "noopener");
      showToast("Открываем WhatsApp — осталось нажать «Отправить» 💕");
      form.reset();
    }

    function setSending(state) {
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      btn.disabled = state;
      btn.textContent = state ? "Отправляем…" : "Отправить заявку";
    }

    async function sendLead(summary, data) {
      const mode = LEAD_CONFIG.mode;

      // Режим WhatsApp — без сервера, открываем чат с готовым текстом
      if (mode === "whatsapp") {
        openWhatsApp(summary);
        return;
      }

      setSending(true);
      try {
        if (mode === "telegram") {
          const tg = LEAD_CONFIG.telegram;
          if (!tg.botToken || !tg.chatId) throw new Error("Telegram не настроен");
          const res = await fetch(
            "https://api.telegram.org/bot" + tg.botToken + "/sendMessage",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: tg.chatId,
                text: summary,
                disable_web_page_preview: true,
              }),
            }
          );
          if (!res.ok) throw new Error("Telegram API " + res.status);
        } else if (mode === "email") {
          if (
            !LEAD_CONFIG.emailEndpoint ||
            LEAD_CONFIG.emailEndpoint.indexOf("PUT_YOUR_EMAIL_HERE") !== -1
          ) {
            throw new Error("Почта не настроена: впиши emailEndpoint в script.js");
          }
          const res = await fetch(LEAD_CONFIG.emailEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              _subject: "Новая заявка с сайта Orinsis",
              Имя: String(data.get("name") || "").trim(),
              Телефон: String(data.get("phone") || "").trim(),
              Направление: String(data.get("direction") || "").trim(),
              Комментарий: String(data.get("message") || "").trim() || "-",
            }),
          });
          if (!res.ok) throw new Error("Email " + res.status);
        } else {
          throw new Error("Неизвестный режим отправки: " + mode);
        }

        showToast("Спасибо! Заявка отправлена — свяжемся с тобой 💕");
        form.reset();
      } catch (err) {
        console.error("Не удалось отправить заявку:", err);
        if (LEAD_CONFIG.fallbackToWhatsApp) {
          openWhatsApp(summary);
        } else {
          showToast("Не получилось отправить — напиши нам в Telegram или WhatsApp");
        }
      } finally {
        setSending(false);
      }
    }
  }
})();
