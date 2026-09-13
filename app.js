(() => {
  "use strict";

  // ===== State =====
  let progress = safeParseJSON(localStorage.getItem("chemProgress"), {});
  let currentFilter = "all";
  let searchQuery = "";
  let viewMode = "cards"; // cards | table | quiz | test
  let quizState = null;
  let testState = null;
  let preferredVoice = null;

  function safeParseJSON(raw, fallback) {
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ===== DOM =====
  const cardsView = document.getElementById("cardsView");
  const tableView = document.getElementById("tableView");
  const quizView = document.getElementById("quizView");
  const testView = document.getElementById("testView");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const filtersEl = document.getElementById("filters");
  const themeToggle = document.getElementById("themeToggle");
  const viewToggle = document.getElementById("viewToggle");
  const quizBtn = document.getElementById("quizBtn");
  const testBtn = document.getElementById("testBtn");
  const progressText = document.getElementById("progressText");
  const resetProgress = document.getElementById("resetProgress");

  // Speaking overlay
  const speakingOverlay = document.createElement("div");
  speakingOverlay.className = "speaking-overlay";
  speakingOverlay.innerHTML = `
    <div class="bars">
      <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
    </div>
    <span class="speak-label">Произношение...</span>
  `;
  document.body.appendChild(speakingOverlay);

  // ===== Theme =====
  const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("chemTheme") || (systemPrefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon();

  function updateThemeIcon() {
    const use = themeToggle.querySelector("use");
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    use.setAttribute("href", isDark ? "#icon-sun" : "#icon-moon");
  }

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("chemTheme", next);
    updateThemeIcon();
  });

  // ===== Progress =====
  function getStatus(symbol) {
    return progress[symbol] || null;
  }

  function setStatus(symbol, status) {
    if (status === null) delete progress[symbol];
    else progress[symbol] = status;
    localStorage.setItem("chemProgress", JSON.stringify(progress));
    updateProgressText();
  }

  function updateProgressText() {
    const studied = Object.values(progress).filter((s) => s === "studied").length;
    progressText.textContent = `${studied} / ${ELEMENTS.length}`;
  }

  resetProgress.addEventListener("click", () => {
    if (confirm("Сбросить весь прогресс изучения?")) {
      progress = {};
      localStorage.removeItem("chemProgress");
      updateProgressText();
      render();
    }
  });

  // ===== Filter + Search =====
  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filtersEl.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });

  searchInput.addEventListener("input", () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    clearSearch.classList.toggle("visible", searchQuery.length > 0);
    render();
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearch.classList.remove("visible");
    searchInput.focus();
    render();
  });

  function getFiltered() {
    return ELEMENTS.filter((el) => {
      if (searchQuery) {
        const q = searchQuery;
        const match =
          el.symbol.toLowerCase().includes(q) ||
          el.nameRu.toLowerCase().includes(q) ||
          el.nameLat.toLowerCase().includes(q) ||
          el.pronunciation.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (currentFilter === "all") return true;
      if (currentFilter === "studied") return getStatus(el.symbol) === "studied";
      if (currentFilter === "to-review") return getStatus(el.symbol) === "review";
      return el.category === currentFilter;
    });
  }

  // ===== Beautiful Voice Synthesis =====
  function pickBestVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Priority list for high-quality Russian voices
    const preferred = [
      "Google русский",
      "Google Русский",
      "Microsoft Irina",
      "Microsoft Pavel",
      "Yuri",
      "Milena",
      "Katya",
      "ru-RU",
      "Russian"
    ];

    for (const name of preferred) {
      const found = voices.find((v) =>
        v.name.includes(name) || v.lang.startsWith("ru")
      );
      if (found) return found;
    }

    // Fallback: any Russian
    return voices.find((v) => v.lang.startsWith("ru")) || voices[0];
  }

  function loadVoices() {
    preferredVoice = pickBestVoice();
  }

  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text, label = "Произношение...") {
    if (!window.speechSynthesis) {
      alert("Озвучка не поддерживается в этом браузере");
      return;
    }

    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ru-RU";
    utter.rate = 0.88;          // slightly slower = clearer
    utter.pitch = 1.05;         // a bit higher = more pleasant
    utter.volume = 1;

    if (preferredVoice) {
      utter.voice = preferredVoice;
    }

    // UI feedback
    speakingOverlay.querySelector(".speak-label").textContent = label;
    speakingOverlay.classList.add("visible");

    utter.onend = () => {
      speakingOverlay.classList.remove("visible");
      document.querySelectorAll(".speak-btn.speaking").forEach((b) => {
        b.classList.remove("speaking");
      });
    };

    utter.onerror = () => {
      speakingOverlay.classList.remove("visible");
    };

    speechSynthesis.speak(utter);
  }

  // ===== Render Cards =====
  function renderCards() {
    const list = getFiltered();
    cardsView.innerHTML = "";

    if (list.length === 0) {
      cardsView.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48"><use href="#icon-search"/></svg>
          <p>Ничего не найдено</p>
          <p style="font-size:0.85rem;opacity:0.7">Попробуйте другой фильтр или поиск</p>
        </div>`;
      return;
    }

    list.forEach((el) => {
      const status = getStatus(el.symbol);
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.symbol = el.symbol;
      card.dataset.cat = el.category;

      const statusIcon = status === "studied"
        ? `<svg width="16" height="16"><use href="#icon-check"/></svg>`
        : status === "review"
        ? `<svg width="16" height="16"><use href="#icon-refresh"/></svg>`
        : `<svg width="14" height="14" style="opacity:0.4"><circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <span class="card-number">${el.atomicNumber}</span>
            <button class="card-status ${status || ""}" data-action="status" aria-label="Статус изучения">
              ${statusIcon}
            </button>
            <div class="card-symbol">${el.symbol}</div>
          </div>
          <div class="card-back">
            <div class="card-name">${el.nameRu}</div>
            <div class="card-lat">${el.nameLat}</div>
            <div class="card-pron">[${el.pronunciation}]</div>
            <div class="card-valence">Валентность: ${el.valence}</div>
            <button class="speak-btn" data-action="speak">
              <svg width="15" height="15"><use href="#icon-volume"/></svg>
              Произнести
            </button>
          </div>
        </div>
      `;

      card.addEventListener("click", (e) => {
        const action = e.target.closest("[data-action]");
        if (action) {
          e.stopPropagation();
          if (action.dataset.action === "status") {
            cycleStatus(el.symbol, card);
          } else if (action.dataset.action === "speak") {
            const btn = action;
            btn.classList.add("speaking");
            // Natural phrase: full name + transcription hint
            const phrase = `${el.nameRu}. Произносится как ${el.pronunciation}`;
            speak(phrase, el.nameRu);
          }
          return;
        }
        card.classList.toggle("flipped");
      });

      // Swipe support
      let startX = 0;
      card.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      card.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 55) {
          card.classList.toggle("flipped");
        }
      }, { passive: true });

      cardsView.appendChild(card);
    });
  }

  function cycleStatus(symbol, cardEl) {
    const current = getStatus(symbol);
    let next = null;
    if (current === null) next = "studied";
    else if (current === "studied") next = "review";
    else next = null;

    setStatus(symbol, next);

    const btn = cardEl.querySelector(".card-status");
    btn.className = `card-status ${next || ""}`;

    if (next === "studied") {
      btn.innerHTML = `<svg width="16" height="16"><use href="#icon-check"/></svg>`;
    } else if (next === "review") {
      btn.innerHTML = `<svg width="16" height="16"><use href="#icon-refresh"/></svg>`;
    } else {
      btn.innerHTML = `<svg width="14" height="14" style="opacity:0.4"><circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
    }
  }

  // ===== Table =====
  function renderTable() {
    const list = getFiltered();
    tableView.innerHTML = "";

    if (list.length === 0) {
      tableView.innerHTML = `<div class="empty-state"><p>Ничего не найдено</p></div>`;
      return;
    }

    const grid = document.createElement("div");
    grid.className = "periodic-mini";

    list.forEach((el) => {
      const cell = document.createElement("div");
      cell.className = "table-cell";
      cell.dataset.cat = el.category;
      cell.innerHTML = `
        <span class="num">${el.atomicNumber}</span>
        <span class="sym">${el.symbol}</span>
      `;
      cell.title = `${el.nameRu} (${el.symbol})`;
      cell.addEventListener("click", () => {
        speak(`${el.nameRu}. ${el.pronunciation}`, el.nameRu);
      });
      grid.appendChild(cell);
    });

    tableView.appendChild(grid);
  }

  // ===== Quiz =====
  function startQuiz() {
    viewMode = "quiz";
    showView("quiz");

    const shuffled = shuffle(ELEMENTS).slice(0, 10);
    quizState = {
      questions: shuffled.map((el) => {
        const type = Math.random() > 0.5 ? "symbol" : "name";
        let options;
        if (type === "symbol") {
          options = [el.nameRu];
          while (options.length < 4) {
            const r = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)].nameRu;
            if (!options.includes(r)) options.push(r);
          }
        } else {
          options = [el.symbol];
          while (options.length < 4) {
            const r = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)].symbol;
            if (!options.includes(r)) options.push(r);
          }
        }
        return {
          el,
          type,
          question: type === "symbol"
            ? `Какой элемент имеет символ «${el.symbol}»?`
            : `Какой символ у элемента «${el.nameRu}»?`,
          correct: type === "symbol" ? el.nameRu : el.symbol,
          options: shuffle(options)
        };
      }),
      index: 0,
      score: 0,
      answered: false
    };
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const q = quizState.questions[quizState.index];
    const total = quizState.questions.length;
    const current = quizState.index + 1;

    document.getElementById("quizNum").textContent = current;
    document.getElementById("quizTotal").textContent = total;
    document.getElementById("quizProgressFill").style.width = `${(current / total) * 100}%`;
    document.getElementById("quizQuestion").textContent = q.question;

    const opts = document.getElementById("quizOptions");
    opts.innerHTML = "";
    document.getElementById("quizFeedback").textContent = "";
    document.getElementById("nextQuiz").classList.add("hidden");
    document.getElementById("restartQuiz").classList.add("hidden");
    quizState.answered = false;

    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "quiz-opt";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (quizState.answered) return;
        quizState.answered = true;

        const correct = opt === q.correct;
        if (correct) {
          quizState.score++;
          btn.classList.add("correct");
          document.getElementById("quizFeedback").textContent = "Верно! ✓";
          document.getElementById("quizFeedback").style.color = "var(--success)";
        } else {
          btn.classList.add("wrong");
          document.getElementById("quizFeedback").textContent = `Неверно. Правильно: ${q.correct}`;
          document.getElementById("quizFeedback").style.color = "var(--danger)";
          opts.querySelectorAll(".quiz-opt").forEach((b) => {
            if (b.textContent === q.correct) b.classList.add("correct");
          });
        }

        // Disable all
        opts.querySelectorAll(".quiz-opt").forEach((b) => (b.disabled = true));

        if (quizState.index < total - 1) {
          document.getElementById("nextQuiz").classList.remove("hidden");
        } else {
          document.getElementById("quizFeedback").textContent +=
            `  ·  Итог: ${quizState.score} из ${total}`;
          document.getElementById("restartQuiz").classList.remove("hidden");
        }
      });
      opts.appendChild(btn);
    });
  }

  document.getElementById("nextQuiz").addEventListener("click", () => {
    quizState.index++;
    renderQuizQuestion();
  });

  document.getElementById("restartQuiz").addEventListener("click", startQuiz);
  document.getElementById("exitQuiz").addEventListener("click", () => {
    viewMode = "cards";
    showView("cards");
  });

  // ===== View switching =====
  function showView(mode) {
    cardsView.classList.toggle("hidden", mode !== "cards");
    tableView.classList.toggle("hidden", mode !== "table");
    quizView.classList.toggle("hidden", mode !== "quiz");
    testView.classList.toggle("hidden", mode !== "test");
  }

  viewToggle.addEventListener("click", () => {
    if (viewMode === "quiz" || viewMode === "test") return;
    viewMode = viewMode === "cards" ? "table" : "cards";
    const use = viewToggle.querySelector("use");
    use.setAttribute("href", viewMode === "cards" ? "#icon-table" : "#icon-grid");
    showView(viewMode);
    render();
  });

  quizBtn.addEventListener("click", () => {
    if (viewMode === "test") exitTestToCards();
    startQuiz();
  });

  testBtn.addEventListener("click", () => {
    if (viewMode === "quiz") { viewMode = "cards"; showView("cards"); }
    startTest();
  });

  // ===== Test (type-from-scratch) mode =====
  const testForm = document.getElementById("testForm");
  const testSymbolInput = document.getElementById("testSymbol");
  const testValenceInput = document.getElementById("testValence");
  const testPronInput = document.getElementById("testPron");
  const testQuestionBlock = document.getElementById("testQuestionBlock");
  const testSummaryEl = document.getElementById("testSummary");
  const testCardEl = document.querySelector("#testView .test-card");

  function normalizeText(str) {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ");
  }

  function normalizeSymbol(str) {
    return normalizeText(str).replace(/\s+/g, "");
  }

  const ROMAN_MAP = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

  function tokenToArabic(token) {
    const t = token.toLowerCase().trim();
    if (!t) return "";
    if (ROMAN_MAP[t] !== undefined) return String(ROMAN_MAP[t]);
    if (/^\d+$/.test(t)) return String(parseInt(t, 10)); // strips leading zeros too
    return t; // leave unrecognized tokens as-is (won't match, which is correct)
  }

  function normalizeValence(str) {
    // Strip parenthetical detail like "(−1, +1)" — only the main
    // valence values are required to answer correctly.
    const core = (str || "").toString().split("(")[0];
    return core
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(tokenToArabic)
      .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
      .join(",");
  }

  function checkField(userVal, correctVal, normalizer) {
    return normalizer(userVal) === normalizer(correctVal) && normalizer(userVal).length > 0;
  }

  function startTest() {
    viewMode = "test";
    showView("test");
    testSummaryEl.classList.add("hidden");
    testCardEl.classList.remove("hidden");

    testState = {
      order: shuffle(ELEMENTS), // all 29 elements, mixed order
      index: 0,
      score: 0,
      results: [], // { el, userSymbol, userValence, userPron, correctAll }
      answered: false
    };
    renderTestQuestion();
  }

  function renderTestQuestion() {
    const total = testState.order.length;
    const current = testState.index + 1;
    const el = testState.order[testState.index];

    document.getElementById("testNum").textContent = current;
    document.getElementById("testTotal").textContent = total;
    document.getElementById("testScore").textContent = testState.score;
    document.getElementById("testProgressFill").style.width = `${((current - 1) / total) * 100}%`;
    document.getElementById("testElementName").textContent = el.nameRu;

    testState.answered = false;
    testForm.reset();
    ["Symbol", "Valence", "Pron"].forEach((f) => {
      document.getElementById(`feedback${f}`).textContent = "";
      document.getElementById(`feedback${f}`).className = "field-feedback";
    });
    document.getElementById("testFeedback").textContent = "";
    document.getElementById("checkTest").classList.remove("hidden");
    document.getElementById("nextTest").classList.add("hidden");
    [testSymbolInput, testValenceInput, testPronInput].forEach((inp) => (inp.disabled = false));
    testSymbolInput.focus();
  }

  testForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (testState.answered) return;
    testState.answered = true;

    const el = testState.order[testState.index];
    const okSymbol = checkField(testSymbolInput.value, el.symbol, normalizeSymbol);
    const okValence = checkField(testValenceInput.value, el.valence, normalizeValence);
    const okPron = checkField(testPronInput.value, el.pronunciation, normalizeText);
    const allCorrect = okSymbol && okValence && okPron;

    function markField(inputEl, feedbackId, ok, correctAnswer) {
      inputEl.disabled = true;
      const fb = document.getElementById(feedbackId);
      if (ok) {
        fb.textContent = "Верно ✓";
        fb.className = "field-feedback ok";
      } else {
        fb.textContent = `Верный ответ: ${correctAnswer}`;
        fb.className = "field-feedback bad";
      }
    }

    markField(testSymbolInput, "feedbackSymbol", okSymbol, el.symbol);
    markField(testValenceInput, "feedbackValence", okValence, el.valence);
    markField(testPronInput, "feedbackPron", okPron, el.pronunciation);

    if (allCorrect) testState.score++;
    testState.results.push({
      el,
      userSymbol: testSymbolInput.value,
      userValence: testValenceInput.value,
      userPron: testPronInput.value,
      allCorrect
    });

    document.getElementById("testScore").textContent = testState.score;
    const feedback = document.getElementById("testFeedback");
    feedback.textContent = allCorrect ? "Всё верно! 🎉" : "Есть ошибки — смотрите подсказки выше.";
    feedback.style.color = allCorrect ? "var(--success)" : "var(--danger)";

    document.getElementById("checkTest").classList.add("hidden");
    document.getElementById("nextTest").classList.remove("hidden");
    document.getElementById("nextTest").textContent =
      testState.index < testState.order.length - 1 ? "Следующий →" : "Показать результат";
  });

  document.getElementById("nextTest").addEventListener("click", () => {
    if (testState.index < testState.order.length - 1) {
      testState.index++;
      renderTestQuestion();
    } else {
      showTestSummary();
    }
  });

  function showTestSummary() {
    const total = testState.order.length;
    document.getElementById("testProgressFill").style.width = "100%";
    testCardEl.classList.add("hidden");
    testSummaryEl.classList.remove("hidden");

    document.getElementById("testSummaryScore").textContent =
      `Результат: ${testState.score} из ${total} (${Math.round((testState.score / total) * 100)}%)`;

    const listEl = document.getElementById("testSummaryList");
    listEl.innerHTML = "";
    const mistakes = testState.results.filter((r) => !r.allCorrect);

    if (mistakes.length === 0) {
      listEl.innerHTML = `<p class="test-summary-perfect">Все 29 элементов пройдены без ошибок! Отличная работа.</p>`;
    } else {
      const title = document.createElement("p");
      title.className = "test-summary-subtitle";
      title.textContent = `Стоит повторить (${mistakes.length}):`;
      listEl.appendChild(title);
      mistakes.forEach((r) => {
        const item = document.createElement("div");
        item.className = "test-mistake";
        item.innerHTML = `
          <div class="test-mistake-name">${r.el.nameRu} (${r.el.symbol})</div>
          <div class="test-mistake-detail">Символ: ${r.el.symbol} · Валентность: ${r.el.valence} · Читается: ${r.el.pronunciation}</div>
        `;
        listEl.appendChild(item);
        // Auto-mark as "to review" for the studied-progress tracker
        setStatus(r.el.symbol, "review");
      });
    }
  }

  function exitTestToCards() {
    viewMode = "cards";
    showView("cards");
    testCardEl.classList.remove("hidden");
    testSummaryEl.classList.add("hidden");
    render();
  }

  document.getElementById("exitTest").addEventListener("click", exitTestToCards);
  document.getElementById("exitTestSummary").addEventListener("click", exitTestToCards);
  document.getElementById("restartTest").addEventListener("click", startTest);

  // ===== Main render =====
  function render() {
    if (viewMode === "cards") renderCards();
    else if (viewMode === "table") renderTable();
  }

  // Init
  updateProgressText();
  render();
})();
