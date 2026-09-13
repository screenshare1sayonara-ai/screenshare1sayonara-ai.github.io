(() => {
  "use strict";

  // State
  let progress = JSON.parse(localStorage.getItem("chemProgress") || "{}");
  let currentFilter = "all";
  let searchQuery = "";
  let viewMode = "cards"; // cards | table | quiz
  let quizState = null;

  // DOM
  const cardsView = document.getElementById("cardsView");
  const tableView = document.getElementById("tableView");
  const quizView = document.getElementById("quizView");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const filtersEl = document.getElementById("filters");
  const themeToggle = document.getElementById("themeToggle");
  const viewToggle = document.getElementById("viewToggle");
  const quizBtn = document.getElementById("quizBtn");
  const progressText = document.getElementById("progressText");
  const resetProgress = document.getElementById("resetProgress");

  // Theme
  const savedTheme = localStorage.getItem("chemTheme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon();

  function updateThemeIcon() {
    const icon = themeToggle.querySelector(".theme-icon");
    icon.textContent = document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
  }

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("chemTheme", next);
    updateThemeIcon();
  });

  // Progress helpers
  function getStatus(symbol) {
    return progress[symbol] || null; // null | "studied" | "review"
  }

  function setStatus(symbol, status) {
    if (status === null) {
      delete progress[symbol];
    } else {
      progress[symbol] = status;
    }
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

  // Filter + Search
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
    render();
  });

  function getFiltered() {
    return ELEMENTS.filter((el) => {
      // Search
      if (searchQuery) {
        const q = searchQuery;
        const match =
          el.symbol.toLowerCase().includes(q) ||
          el.nameRu.toLowerCase().includes(q) ||
          el.nameLat.toLowerCase().includes(q) ||
          el.pronunciation.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Filter
      if (currentFilter === "all") return true;
      if (currentFilter === "studied") return getStatus(el.symbol) === "studied";
      if (currentFilter === "to-review") return getStatus(el.symbol) === "review";
      return el.category === currentFilter;
    });
  }

  // Speak
  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU";
    u.rate = 0.9;
    // Prefer Russian voice
    const voices = speechSynthesis.getVoices();
    const ru = voices.find((v) => v.lang.startsWith("ru"));
    if (ru) u.voice = ru;
    speechSynthesis.speak(u);
  }

  // Render Cards
  function renderCards() {
    const list = getFiltered();
    cardsView.innerHTML = "";

    if (list.length === 0) {
      cardsView.innerHTML = `<div class="empty-state"><p>Ничего не найдено</p><p>Попробуйте другой фильтр или поиск</p></div>`;
      return;
    }

    list.forEach((el) => {
      const status = getStatus(el.symbol);
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.symbol = el.symbol;
      card.dataset.cat = el.category;

      card.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <span class="card-number">${el.atomicNumber}</span>
            <button class="card-status ${status || ""}" data-action="status" aria-label="Статус">
              ${status === "studied" ? "✅" : status === "review" ? "🔁" : "○"}
            </button>
            <div class="card-symbol">${el.symbol}</div>
          </div>
          <div class="card-back">
            <div class="card-name">${el.nameRu}</div>
            <div class="card-lat">${el.nameLat}</div>
            <div class="card-pron">[${el.pronunciation}]</div>
            <div class="card-valence">Валентность: ${el.valence}</div>
            <button class="speak-btn" data-action="speak">🔊 Произнести</button>
          </div>
        </div>
      `;

      // Flip on click (except status & speak)
      card.addEventListener("click", (e) => {
        const action = e.target.closest("[data-action]");
        if (action) {
          e.stopPropagation();
          if (action.dataset.action === "status") {
            cycleStatus(el.symbol, card);
          } else if (action.dataset.action === "speak") {
            speak(`${el.nameRu}. ${el.pronunciation}`);
          }
          return;
        }
        card.classList.toggle("flipped");
      });

      // Touch swipe support for mobile
      let startX = 0;
      card.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      card.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) {
          card.classList.toggle("flipped");
        }
      }, { passive: true });

      cardsView.appendChild(card);
    });
  }

  function cycleStatus(symbol, cardEl) {
    const current = getStatus(symbol);
    let next;
    if (current === null) next = "studied";
    else if (current === "studied") next = "review";
    else next = null;

    setStatus(symbol, next);

    const btn = cardEl.querySelector(".card-status");
    btn.className = `card-status ${next || ""}`;
    btn.textContent = next === "studied" ? "✅" : next === "review" ? "🔁" : "○";
  }

  // Table view
  function renderTable() {
    const list = getFiltered();
    tableView.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "periodic-mini";

    if (list.length === 0) {
      tableView.innerHTML = `<div class="empty-state"><p>Ничего не найдено</p></div>`;
      return;
    }

    list.forEach((el) => {
      const cell = document.createElement("div");
      cell.className = "table-cell";
      cell.dataset.cat = el.category;
      cell.innerHTML = `
        <span class="num">${el.atomicNumber}</span>
        <span class="sym">${el.symbol}</span>
      `;
      cell.addEventListener("click", () => {
        // Quick flip-like info via alert or better: switch to cards and flip
        alert(`${el.nameRu} (${el.symbol})\n${el.nameLat}\n[${el.pronunciation}]\nВалентность: ${el.valence}`);
      });
      grid.appendChild(cell);
    });
    tableView.appendChild(grid);
  }

  // Quiz
  function startQuiz() {
    viewMode = "quiz";
    showView("quiz");
    const shuffled = [...ELEMENTS].sort(() => Math.random() - 0.5).slice(0, 10);
    quizState = {
      questions: shuffled.map((el) => {
        // 50/50: symbol→name or name→symbol
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
          question: type === "symbol" ? `Какой элемент имеет символ ${el.symbol}?` : `Какой символ у элемента «${el.nameRu}»?`,
          correct: type === "symbol" ? el.nameRu : el.symbol,
          options: options.sort(() => Math.random() - 0.5)
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
    document.getElementById("quizNum").textContent = quizState.index + 1;
    document.getElementById("quizTotal").textContent = quizState.questions.length;
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
          document.getElementById("quizFeedback").textContent = "Верно! ✅";
          document.getElementById("quizFeedback").style.color = "#22c55e";
        } else {
          btn.classList.add("wrong");
          document.getElementById("quizFeedback").textContent = `Неверно. Правильный ответ: ${q.correct}`;
          document.getElementById("quizFeedback").style.color = "#ef4444";
          // Highlight correct
          opts.querySelectorAll(".quiz-opt").forEach((b) => {
            if (b.textContent === q.correct) b.classList.add("correct");
          });
        }
        if (quizState.index < quizState.questions.length - 1) {
          document.getElementById("nextQuiz").classList.remove("hidden");
        } else {
          document.getElementById("quizFeedback").textContent += ` | Итог: ${quizState.score} / ${quizState.questions.length}`;
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

  // View switching
  function showView(mode) {
    cardsView.classList.toggle("hidden", mode !== "cards");
    tableView.classList.toggle("hidden", mode !== "table");
    quizView.classList.toggle("hidden", mode !== "quiz");
  }

  viewToggle.addEventListener("click", () => {
    if (viewMode === "quiz") return;
    viewMode = viewMode === "cards" ? "table" : "cards";
    showView(viewMode);
    render();
  });

  quizBtn.addEventListener("click", startQuiz);

  // Main render
  function render() {
    if (viewMode === "cards") renderCards();
    else if (viewMode === "table") renderTable();
  }

  // Init
  updateProgressText();
  render();

  // Load voices for speech
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }
})();
