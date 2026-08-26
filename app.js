// ── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const AREAS = [
  { id: "main",      label: "Main Street U.S.A.", emoji: "🏘️", color: "#E8A838" },
  { id: "tomorrow",  label: "Tomorrowland",        emoji: "🚀", color: "#4A90D9" },
  { id: "fantasy",   label: "Fantasyland",          emoji: "✨", color: "#9B59B6" },
  { id: "liberty",   label: "Liberty Square",       emoji: "🔔", color: "#C0392B" },
  { id: "frontier",  label: "Frontierland",         emoji: "🤠", color: "#A0522D" },
  { id: "adventure", label: "Adventureland",        emoji: "🌴", color: "#27AE60" },
  { id: "shows",     label: "Shows e Paradas",      emoji: "🎆", color: "#E91E8C" },
];

const EMOJI_MAP = {
  F: { child: "👧", teen: "👧", adult: "👩", senior: "👵" },
  M: { child: "👦", teen: "👦", adult: "👨", senior: "👴" },
};

function getEmoji(sex, age) {
  const s = EMOJI_MAP[sex] || EMOJI_MAP["M"];
  if (age <= 12) return s.child;
  if (age <= 17) return s.teen;
  if (age <= 59) return s.adult;
  return s.senior;
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
const STATE = {
  screen: "cadastro_org",
  organizer: null,      // { name, email }
  players: [],          // [{ name, emoji }]
  playerCount: 0,
  currentPlayerSetup: 0,
  area: null,
  currentPlayer: null,
  qIndex: 0,
  scores: {},
  answered: {},
  orderItems: {},
  favorites: new Set(),
  surveyDone: false,
};

// ── RENDER ────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.className = "fade-in";

  switch (STATE.screen) {
    case "cadastro_org":       renderCadastroOrg(); break;
    case "cadastro_count":     renderCadastroCount(); break;
    case "cadastro_player":    renderCadastroPlayer(); break;
    case "home":               renderHome(); break;
    case "area_select":        renderAreaSelect(); break;
    case "player_select":      renderPlayerSelect(); break;
    case "quiz":               renderQuiz(); break;
    case "result":             renderResult(); break;
    case "ranking":            renderRanking(); break;
    case "favorites":          renderFavorites(); break;
    case "survey":             renderSurvey(); break;
    case "survey_thanks":      renderSurveyThanks(); break;
  }
}

// ── CADASTRO 1 — ORGANIZADOR ──────────────────────────────────────────────────
function renderCadastroOrg() {
  html(`
    <div class="screen center">
      <div class="flower-wrap">${flowerSVG(72)}</div>
      <div class="logo-big">Trip<span>loom</span></div>
      <div class="subtitle">A viagem começa aqui</div>
      <p style="font-size:14px;color:var(--gray-light);margin-top:20px;line-height:1.7;max-width:280px">
        Quiz interativo para famílias brasileiras que vão ao Magic Kingdom 🏰
      </p>
      <div class="card" style="margin-top:28px;text-align:left;width:100%;max-width:360px">
        <div class="section-label" style="margin-bottom:16px">Quem está organizando o quiz?</div>
        <label class="field-label">Seu nome</label>
        <input id="org-name" class="field" type="text" placeholder="Ex: Ana Silva" autocomplete="name">
        <label class="field-label" style="margin-top:12px">Seu e-mail</label>
        <input id="org-email" class="field" type="email" placeholder="Ex: ana@email.com" autocomplete="email">
      </div>
      <button class="btn-primary" style="margin-top:16px;max-width:360px" onclick="submitOrg()">Continuar →</button>
      <p style="font-size:11px;color:var(--gray);margin-top:14px;max-width:280px;line-height:1.6">
        🔒 Seus dados são usados apenas para personalizar o quiz e melhorar o Triploom.
      </p>
    </div>
  `);
}

function submitOrg() {
  const name = val("org-name").trim();
  const email = val("org-email").trim();
  if (!name) { shake("org-name"); return; }
  if (!email || !email.includes("@")) { shake("org-email"); return; }
  STATE.organizer = { name, email };
  STATE.screen = "cadastro_count";
  render();
}

// ── CADASTRO 2 — QUANTIDADE ───────────────────────────────────────────────────
function renderCadastroCount() {
  html(`
    <div class="screen center">
      ${flowerSVG(48)}
      <div class="logo-big" style="margin-top:12px">Trip<span>loom</span></div>
      <div class="card" style="margin-top:28px;width:100%;max-width:360px">
        <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px">Olá, ${STATE.organizer.name}! 🌸</div>
        <p style="color:var(--gray);font-size:13px;line-height:1.6;margin-bottom:20px">
          Você vai cadastrar as pessoas do seu grupo agora.<br>
          Quantas pessoas vão participar? <span style="color:var(--coral)">(incluindo você)</span>
        </p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
          ${[2,3,4,5,6,7,8].map(n => `
            <button class="count-btn" onclick="selectCount(${n})">${n}</button>
          `).join("")}
        </div>
      </div>
      <p style="font-size:12px;color:var(--gray);margin-top:16px;max-width:280px;line-height:1.6">
        💡 Cada pessoa vai ter seu próprio perfil e pontuação no ranking.
      </p>
    </div>
  `);
}

function selectCount(n) {
  STATE.playerCount = n;
  STATE.players = [];
  STATE.currentPlayerSetup = 0;
  STATE.screen = "cadastro_player";
  render();
}

// ── CADASTRO 3 — JOGADORES ────────────────────────────────────────────────────
function renderCadastroPlayer() {
  const i = STATE.currentPlayerSetup;
  const total = STATE.playerCount;
  const pct = (i / total) * 100;
  html(`
    <div class="screen">
      <div style="padding:20px 20px 0">
        <div style="font-size:12px;color:var(--gray);margin-bottom:8px">Jogador ${i + 1} de ${total}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:var(--coral)"></div></div>
      </div>
      <div style="padding:20px">
        <div class="card">
          <div class="section-label" style="margin-bottom:16px">👤 Dados do jogador ${i + 1}</div>
          <label class="field-label">Nome</label>
          <input id="p-name" class="field" type="text" placeholder="Ex: Pedro" autocomplete="off">
          <label class="field-label" style="margin-top:14px">Sexo</label>
          <div style="display:flex;gap:10px;margin-top:6px">
            <button class="sex-btn" id="btn-F" onclick="selectSex('F')">👩 Feminino</button>
            <button class="sex-btn" id="btn-M" onclick="selectSex('M')">👨 Masculino</button>
          </div>
          <label class="field-label" style="margin-top:14px">Faixa etária</label>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
            <button class="age-btn" id="age-child" onclick="selectAge('child')">👶 Criança (até 12 anos)</button>
            <button class="age-btn" id="age-teen" onclick="selectAge('teen')">🧒 Adolescente (13 a 17 anos)</button>
            <button class="age-btn" id="age-adult" onclick="selectAge('adult')">🧑 Adulto (18 a 59 anos)</button>
            <button class="age-btn" id="age-senior" onclick="selectAge('senior')">🧓 Idoso (60 anos ou mais)</button>
          </div>
        </div>
        <button class="btn-primary" style="margin-top:16px" onclick="submitPlayer()">
          ${i + 1 < total ? "Próximo jogador →" : "Começar o Quiz 🎉"}
        </button>
      </div>
    </div>
  `);
  window._selectedSex = null;
  window._selectedAge = null;
}

function selectSex(s) {
  window._selectedSex = s;
  document.querySelectorAll(".sex-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("btn-" + s).classList.add("selected");
}

function selectAge(a) {
  window._selectedAge = a;
  document.querySelectorAll(".age-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("age-" + a).classList.add("selected");
}

function submitPlayer() {
  const name = val("p-name").trim();
  if (!name) { shake("p-name"); return; }
  if (!window._selectedSex) { alert("Selecione o sexo"); return; }
  if (!window._selectedAge) { alert("Selecione a faixa etária"); return; }

  const ageMap = { child: 8, teen: 15, adult: 30, senior: 65 };
  const emoji = getEmoji(window._selectedSex, ageMap[window._selectedAge]);
  STATE.players.push({ name, emoji });
  STATE.scores[name] = 0;

  STATE.currentPlayerSetup++;
  if (STATE.currentPlayerSetup < STATE.playerCount) {
    STATE.screen = "cadastro_player";
  } else {
    STATE.screen = "home";
    saveToLocalStorage();
  }
  render();
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function renderHome() {
  const sorted = getSorted();
  const hasScores = sorted.some(([, s]) => s > 0);
  const favCount = STATE.favorites.size;

  html(`
    <div class="screen" style="padding:24px 20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px">
        ${flowerSVG(30)}
        <div>
          <div class="logo-small">Trip<span>loom</span></div>
          <div class="subtitle-small">Magic Kingdom</div>
        </div>
      </div>

      ${hasScores ? `
        <div class="card" style="margin-bottom:18px">
          <div class="section-label" style="margin-bottom:10px">🏆 Ranking do grupo</div>
          ${sorted.map(([name, score], i) => {
            const p = STATE.players.find(p => p.name === name);
            return `<div class="rank-row">
              <span style="font-size:14px">${["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"][i]}</span>
              <span style="font-size:16px">${p ? p.emoji : "👤"}</span>
              <span style="flex:1;color:${i===0?"var(--coral)":"var(--gray-light)"};font-size:13px;font-weight:${i===0?700:400}">${name}</span>
              <span style="color:${i===0?"var(--coral)":"var(--gray)"};font-weight:700;font-size:13px">${score} pts</span>
            </div>`;
          }).join("")}
        </div>
      ` : ""}

      <div class="section-label" style="margin-bottom:12px">Escolha uma área para jogar</div>
      ${AREAS.map(a => {
        const count = (PERGUNTAS[a.id] || []).length;
        return `<button class="area-btn" style="border-color:${a.color}50;background:${a.color}15" onclick="goTo('area_select','${a.id}')">
          <span style="font-size:22px;width:30px;text-align:center">${a.emoji}</span>
          <div style="flex:1">
            <div style="color:#fff;font-weight:700;font-size:14px">${a.label}</div>
            <div style="color:var(--gray);font-size:11px;margin-top:2px">${count} perguntas</div>
          </div>
          <span style="color:${a.color};font-weight:700;font-size:18px">→</span>
        </button>`;
      }).join("")}

      <button class="btn-outline" style="margin-top:14px" onclick="go('ranking')">🏆 Ver Ranking Completo</button>
      ${favCount > 0 ? `<button class="btn-outline" style="margin-top:8px" onclick="go('favorites')">⭐ Favoritas (${favCount})</button>` : ""}
      ${!STATE.surveyDone ? `<button class="btn-outline" style="margin-top:8px;border-color:#9B59B6;color:#9B59B6" onclick="go('survey')">📝 Dar Feedback</button>` : ""}
    </div>
  `);
}

function goTo(screen, areaId) {
  STATE.area = areaId;
  STATE.screen = screen;
  STATE.qIndex = 0;
  STATE.currentPlayer = null;
  render();
}

// ── PLAYER SELECT ─────────────────────────────────────────────────────────────
function renderPlayerSelect() {
  const a = AREAS.find(x => x.id === STATE.area);
  const count = (PERGUNTAS[STATE.area] || []).length;
  html(`
    <div class="screen" style="padding:24px 20px">
      <button class="btn-back" onclick="go('home')">← Voltar</button>
      <div style="text-align:center;margin-bottom:22px">
        <div style="font-size:36px">${a.emoji}</div>
        <div style="font-family:Georgia,serif;font-size:18px;color:#fff;margin-top:8px">${a.label}</div>
        <div style="color:var(--gray);font-size:12px;margin-top:4px">${count} perguntas</div>
      </div>
      <div class="section-label" style="margin-bottom:12px">Quem vai jogar agora?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${STATE.players.map(p => `
          <button class="player-btn ${STATE.currentPlayer === p.name ? "selected" : ""}"
            style="border-color:${STATE.currentPlayer === p.name ? a.color : "var(--line)"};background:${STATE.currentPlayer === p.name ? a.color + "22" : "var(--card)"}"
            onclick="selectPlayer('${p.name}')">
            <div style="font-size:28px">${p.emoji}</div>
            <div style="color:#fff;font-weight:700;font-size:13px;margin-top:6px">${p.name}</div>
            <div style="color:${a.color};font-size:11px;font-weight:700;margin-top:2px">${STATE.scores[p.name] || 0} pts</div>
          </button>
        `).join("")}
      </div>
      ${STATE.currentPlayer ? `<button class="btn-primary" style="margin-top:18px;background:${a.color}" onclick="startQuiz()">Começar →</button>` : ""}
    </div>
  `);
}

function renderAreaSelect() {
  STATE.screen = "player_select";
  render();
}

function selectPlayer(name) {
  STATE.currentPlayer = name;
  render();
}

function startQuiz() {
  STATE.qIndex = 0;
  STATE.screen = "quiz";
  render();
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
function renderQuiz() {
  const questions = PERGUNTAS[STATE.area] || [];
  const q = questions[STATE.qIndex];
  if (!q) { go("result"); return; }

  const a = AREAS.find(x => x.id === STATE.area);
  const color = a.color;
  const pct = ((STATE.qIndex + 1) / questions.length) * 100;
  const qAns = STATE.answered[q.id] || null;
  const isAnswered = !!qAns;
  const hasNext = STATE.qIndex + 1 < questions.length;
  const isFav = STATE.favorites.has(q.id);
  const player = STATE.players.find(p => p.name === STATE.currentPlayer);

  if (q.type === "ordenar" && !STATE.orderItems[q.id]) {
    STATE.orderItems[q.id] = shuffle(q.items.map((_, i) => i));
  }
  const order = STATE.orderItems[q.id] || q.items.map((_, i) => i);

  let qHtml = "";
  if (q.type === "multipla") qHtml = renderMultipla(q, qAns, color, hasNext);
  else if (q.type === "vf")   qHtml = renderVF(q, qAns, color, hasNext);
  else if (q.type === "ordenar") qHtml = renderOrdenar(q, qAns, order, color, hasNext);
  else if (q.type === "complete") qHtml = renderComplete(q, qAns, color, hasNext);

  html(`
    <div>
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px 0">
        <button onclick="goBackQuiz()" style="background:none;border:none;color:var(--gray);font-size:22px;cursor:pointer;padding:4px 8px;line-height:1">←</button>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:14px">${player ? player.emoji : "👤"}</span>
          <span style="font-size:11px;font-weight:700;color:#fff">${STATE.currentPlayer}</span>
          <span style="font-size:9px;color:${color};font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-left:4px">${a.emoji} ${a.label}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <button onclick="toggleFav(${q.id})"
            style="background:${isFav ? "rgba(255,215,0,0.15)" : "none"};border:${isFav ? "1px solid #FFD700" : "none"};border-radius:8px;font-size:15px;cursor:pointer;padding:3px 6px;line-height:1">
            ${isFav ? "⭐" : "☆"}
          </button>
          ${isAnswered && hasNext ? `<button onclick="nextQ()" style="background:none;border:none;color:${color};font-size:22px;cursor:pointer;padding:4px 8px;line-height:1">→</button>` : `<span style="width:38px"></span>`}
        </div>
      </div>

      <!-- Counter + area -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 18px 0">
        <span style="font-size:9px;color:${color};font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${a.label}</span>
        <span style="font-size:10px;color:var(--gray);font-weight:600">${STATE.qIndex + 1}/${questions.length}</span>
      </div>

      <!-- Progress -->
      <div class="progress-bar" style="margin:8px 18px 0">
        <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>

      <div style="padding:14px 18px 32px">
        ${isAnswered ? `
          <div style="background:rgba(95,191,143,0.1);border:1px solid #5FBF8F;border-radius:10px;padding:7px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:#5FBF8F;font-weight:600">✓ Já respondida — navegando livremente</span>
            ${hasNext ? `<button onclick="nextQ()" style="background:none;border:none;color:#5FBF8F;font-size:11px;font-weight:700;cursor:pointer;padding:0">Avançar →</button>` : ""}
          </div>
        ` : ""}

        ${q.ind ? `
          <div style="background:rgba(244,132,95,0.1);border-left:3px solid var(--coral);padding:8px 10px;border-radius:0 8px 8px 0;margin-bottom:12px">
            <div style="font-size:11px;color:#FABC9A;line-height:1.5">${q.ind}</div>
          </div>
        ` : ""}

        ${qHtml}
      </div>
    </div>
  `);
}

function renderMultipla(q, qAns, color, hasNext) {
  const sel = qAns ? qAns.selected : null;
  const fb = sel !== null;
  const opts = q.opts.map((op, i) => {
    let bg = "var(--card)", border = "var(--line)", tc = "#fff";
    if (fb) {
      if (i === q.ans) { bg = "#E8F7EF"; border = "#5FBF8F"; tc = "#166534"; }
      else if (i === sel) { bg = "#FDEAE5"; border = "#E8674A"; tc = "#7F1D1D"; }
    }
    return `<button onclick="${fb ? "" : `answerMultipla(${i})`}"
      style="display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;border:1.5px solid ${border};background:${bg};cursor:${fb ? "default" : "pointer"};text-align:left;width:100%;font-family:inherit;margin-bottom:8px">
      <span style="width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;flex-shrink:0;background:${fb && i === q.ans ? "#5FBF8F" : fb && i === sel ? "#E8674A" : "var(--line)"};color:#fff">${["A","B","C","D"][i]}</span>
      <span style="font-size:13px;font-weight:500;color:${tc}">${op}</span>
    </button>`;
  }).join("");
  return `<div style="font-size:15px;font-weight:700;color:#fff;line-height:1.5;margin-bottom:14px">${q.q}</div>
    ${opts}
    ${fb ? feedbackBox(sel === q.ans, q.tip, hasNext, color) : ""}`;
}

function renderVF(q, qAns, color, hasNext) {
  const sel = qAns ? qAns.selected : null;
  const fb = sel !== null;
  const btns = [true, false].map(v => {
    let bg = "var(--card)", border = "var(--line)", opacity = 1, tc = "#fff";
    if (fb) {
      if (v === q.ans) { bg = "#E8F7EF"; border = "#5FBF8F"; tc = "#166534"; }
      else opacity = 0.35;
    }
    const clickFn = fb ? "" : `answerVF(${v ? 1 : 0})`;
    return `<button onclick="${clickFn}"
      style="flex:1;padding:15px 10px;border-radius:13px;border:1.5px solid ${border};background:${bg};color:${tc};font-size:13px;font-weight:700;cursor:${fb ? "default" : "pointer"};opacity:${opacity};font-family:inherit">
      ${v ? "✅ Verdadeiro" : "❌ Falso"}
    </button>`;
  }).join("");
  return `<div style="font-size:15px;font-weight:700;color:#fff;line-height:1.5;margin-bottom:16px">${q.q}</div>
    <div style="display:flex;gap:10px;">${btns}</div>
    ${fb ? feedbackBox(sel === q.ans, q.tip, hasNext, color) : ""}`;
}

function renderOrdenar(q, qAns, order, color, hasNext) {
  const checked = qAns ? qAns.checked : null;
  const items = order.map((idx, pos) => {
    let bg = "var(--card)", border = "var(--line)", tc = "#fff", numBg = color;
    if (checked) {
      const ok = q.correctOrder[pos] === idx;
      bg = ok ? "#E8F7EF" : "#FDEAE5";
      border = ok ? "#5FBF8F" : "#E8674A";
      tc = ok ? "#166534" : "#7F1D1D";
      numBg = border;
    }
    return `<div style="display:flex;align-items:center;gap:9px;padding:11px 13px;border-radius:11px;border:1.5px solid ${border};background:${bg};margin-bottom:7px">
      <span style="width:22px;height:22px;border-radius:6px;background:${numBg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;flex-shrink:0">${pos + 1}</span>
      <span style="flex:1;font-size:13px;font-weight:500;color:${tc}">${q.items[idx]}</span>
      ${!checked ? `<div style="display:flex;flex-direction:column;gap:2px">
        <button onclick="moveOrder(${pos},-1)" ${pos === 0 ? "disabled" : ""} style="width:22px;height:15px;border-radius:4px;border:1px solid var(--line);background:var(--navy);color:#fff;font-size:8px;cursor:pointer;opacity:${pos === 0 ? 0.3 : 1}">▲</button>
        <button onclick="moveOrder(${pos},1)" ${pos === order.length - 1 ? "disabled" : ""} style="width:22px;height:15px;border-radius:4px;border:1px solid var(--line);background:var(--navy);color:#fff;font-size:8px;cursor:pointer;opacity:${pos === order.length - 1 ? 0.3 : 1}">▼</button>
      </div>` : ""}
    </div>`;
  }).join("");

  const action = !checked
    ? `<button onclick="checkOrder()" style="display:block;width:100%;padding:14px;border-radius:14px;border:none;background:${color};color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:6px">Confirmar Ordem</button>`
    : `<div style="margin-top:12px;padding:11px 13px;border-radius:11px;font-size:12px;font-weight:600;line-height:1.5;background:${checked === "ok" ? "#E8F7EF" : "#FDEAE5"};color:${checked === "ok" ? "#166534" : "#7F1D1D"}">
        ${checked === "ok" ? "✅ Correto! +25 pontos" : "❌ Não foi dessa vez..."}
        ${q.tip ? `<div style="font-size:11px;margin-top:5px;font-weight:400">💡 ${q.tip}</div>` : ""}
      </div>
      <button onclick="nextQ()" style="display:block;width:100%;padding:14px;border-radius:14px;border:none;background:${color};color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:10px">${hasNext ? "Próxima →" : "Ver Resultado →"}</button>`;

  return `<div style="display:inline-block;background:rgba(244,132,95,0.18);color:var(--coral);padding:3px 10px;border-radius:18px;font-size:10px;font-weight:700;margin-bottom:6px">🔢 Ordene a Sequência</div>
    <div style="font-size:15px;font-weight:700;color:#fff;line-height:1.5;margin-bottom:14px">${q.q}</div>
    ${items}${action}`;
}

function renderComplete(q, qAns, color, hasNext) {
  const sel = qAns ? qAns.selected : null;
  const fb = sel !== null;
  const parts = q.q.split("___");
  const wordDisplay = sel !== null
    ? `<span style="display:inline-block;padding:2px 12px;border-radius:7px;margin:0 4px;background:${fb && sel === q.ans ? "#E8F7EF" : fb ? "#FDEAE5" : color + "33"};color:${fb && sel === q.ans ? "#166534" : fb ? "#7F1D1D" : color};font-weight:800;font-size:15px;border:1.5px dashed ${color};min-width:60px;text-align:center">${q.words[sel]}</span>`
    : `<span style="display:inline-block;padding:2px 12px;border-radius:7px;margin:0 4px;background:${color}22;color:var(--gray);font-weight:800;font-size:15px;border:1.5px dashed var(--line);min-width:60px;text-align:center">?????</span>`;

  const wordBtns = !fb ? q.words.map((w, i) =>
    `<button onclick="answerComplete(${i})" style="padding:10px 14px;border-radius:11px;border:1.5px solid var(--line);background:var(--card);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;text-align:left;width:100%;margin-bottom:8px">${w}</button>`
  ).join("") : "";

  return `<div style="display:inline-block;background:rgba(244,132,95,0.18);color:var(--coral);padding:3px 10px;border-radius:18px;font-size:10px;font-weight:700;margin-bottom:6px">🔤 Complete a Frase</div>
    <div style="font-size:15px;font-weight:600;color:#fff;line-height:1.9;margin-top:6px;margin-bottom:16px">${parts[0]}${wordDisplay}${parts[1] || ""}</div>
    ${wordBtns}
    ${fb ? feedbackBox(sel === q.ans, q.tip, hasNext, color) : ""}`;
}

function feedbackBox(correct, tip, hasNext, color) {
  return `<div style="margin-top:12px;padding:11px 13px;border-radius:11px;font-size:12px;font-weight:600;line-height:1.5;background:${correct ? "#E8F7EF" : "#FDEAE5"};color:${correct ? "#166534" : "#7F1D1D"}">
    ${correct ? "✅ Correto! +20 pontos" : "❌ Não foi dessa vez..."}
    ${tip ? `<div style="font-size:11px;margin-top:5px;font-weight:400;line-height:1.6">💡 ${tip}</div>` : ""}
  </div>
  <button onclick="nextQ()" style="display:block;width:100%;padding:14px;border-radius:14px;border:none;background:${color};color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:10px">${hasNext ? "Próxima →" : "Ver Resultado →"}</button>`;
}

// ── AÇÕES DO QUIZ ─────────────────────────────────────────────────────────────
function answerMultipla(i) {
  const q = currentQ();
  if (!q || STATE.answered[q.id]) return;
  STATE.answered[q.id] = { selected: i };
  if (i === q.ans) addPts(20);
  render();
}

function answerVF(v) {
  const q = currentQ();
  if (!q || STATE.answered[q.id]) return;
  const boolVal = (v === 1 || v === true || v === "true");
  STATE.answered[q.id] = { selected: boolVal };
  if (boolVal === q.ans) addPts(20);
  render();
}

function answerComplete(i) {
  const q = currentQ();
  if (!q || STATE.answered[q.id]) return;
  STATE.answered[q.id] = { selected: i };
  if (i === q.ans) addPts(20);
  render();
}

function checkOrder() {
  const q = currentQ();
  if (!q || STATE.answered[q.id]) return;
  const order = STATE.orderItems[q.id] || [];
  const ok = JSON.stringify(order) === JSON.stringify(q.correctOrder);
  STATE.answered[q.id] = { checked: ok ? "ok" : "no" };
  if (ok) addPts(25);
  render();
}

function moveOrder(pos, dir) {
  const q = currentQ();
  if (!q || STATE.answered[q.id]) return;
  const o = [...(STATE.orderItems[q.id] || [])];
  const to = pos + dir;
  if (to < 0 || to >= o.length) return;
  [o[pos], o[to]] = [o[to], o[pos]];
  STATE.orderItems[q.id] = o;
  render();
}

function nextQ() {
  const questions = PERGUNTAS[STATE.area] || [];
  if (STATE.qIndex + 1 < questions.length) {
    STATE.qIndex++;
    render();
  } else {
    go("result");
  }
}

function goBackQuiz() {
  if (STATE.qIndex > 0) { STATE.qIndex--; render(); }
  else go("home");
}

function toggleFav(id) {
  if (STATE.favorites.has(id)) STATE.favorites.delete(id);
  else STATE.favorites.add(id);
  render();
}

// ── RESULTADO ─────────────────────────────────────────────────────────────────
function renderResult() {
  const sorted = getSorted();
  const rank = sorted.findIndex(([name]) => name === STATE.currentPlayer);
  const player = STATE.players.find(p => p.name === STATE.currentPlayer);
  const a = AREAS.find(x => x.id === STATE.area);
  const isWinner = rank === 0 && STATE.scores[STATE.currentPlayer] > 0;
  const titles = ["🏆 Expert em Magic Kingdom","⭐ Conhecedor do Parque","🎯 Explorador Disney","🌸 Aprendiz Encantado","🌟 Viajante Disney","✨ Fã em Formação","🎢 Curioso do Parque","🌺 Começando a Jornada"];
  const badges = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];

  html(`
    <div class="screen center" style="padding:40px 24px">
      ${flowerSVG(52)}
      <div style="font-size:52px;margin:8px 0">🎉</div>
      <div style="font-family:Georgia,serif;font-size:22px;color:#fff;margin-top:4px">Quiz Completo!</div>
      <div style="font-size:13px;color:var(--gray);margin-top:4px">${player ? player.emoji : "👤"} ${STATE.currentPlayer} · ${a.label}</div>
      <div style="font-size:46px;font-weight:800;color:var(--coral);margin-top:6px">${STATE.scores[STATE.currentPlayer]} pts</div>

      <div style="margin-top:14px;padding:10px 20px;border-radius:14px;background:${isWinner ? "#FFF8E1" : "var(--card)"};border:1.5px solid ${isWinner ? "#FFD700" : "var(--line)"};text-align:center">
        <div style="font-size:22px">${badges[rank] || "🎯"}</div>
        <div style="font-size:13px;font-weight:700;color:${isWinner ? "#7B5400" : "#fff"};margin-top:4px">${titles[rank] || titles[3]}</div>
      </div>

      ${isWinner ? `
        <div style="margin-top:14px;padding:12px 16px;border-radius:14px;background:rgba(255,215,0,0.1);border:1.5px solid #FFD700;text-align:left;width:100%;max-width:340px">
          <div style="font-size:12px;font-weight:700;color:#7B5400;margin-bottom:6px">🔓 Missão Bônus Desbloqueada!</div>
          <div style="font-size:13px;color:#7B5400;line-height:1.5">Fotografe a vista do alto do Astro Orbiter à noite com toda a Tomorrowland iluminada abaixo!</div>
          <div style="font-size:13px;font-weight:800;color:#FFD700;margin-top:6px">+50 pontos exclusivos</div>
        </div>
      ` : ""}

      <div style="display:flex;gap:10px;margin-top:20px;width:100%;max-width:340px">
        <button onclick="go('ranking')" class="btn-primary" style="flex:1">🏆 Ranking</button>
        <button onclick="go('home')" class="btn-outline" style="flex:1;margin-top:0">Início</button>
      </div>
      ${!STATE.surveyDone ? `<button onclick="go('survey')" style="margin-top:12px;background:none;border:none;color:#9B59B6;font-size:13px;cursor:pointer;font-family:inherit;text-decoration:underline">📝 Dar feedback sobre o Triploom</button>` : ""}
    </div>
  `);
}

// ── RANKING ───────────────────────────────────────────────────────────────────
function renderRanking() {
  const sorted = getSorted();
  const titles = ["🏆 Expert em Magic Kingdom","⭐ Conhecedor do Parque","🎯 Explorador Disney","🌸 Aprendiz Encantado","🌟 Viajante Disney","✨ Fã em Formação","🎢 Curioso do Parque","🌺 Começando a Jornada"];
  const badges = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];

  html(`
    <div class="screen" style="padding:24px 20px 40px">
      <button class="btn-back" onclick="go('home')">← Voltar</button>
      <div style="font-family:Georgia,serif;font-size:22px;color:#fff;text-align:center;margin-bottom:6px">🏆 Ranking do Grupo</div>
      <div style="font-size:12px;color:var(--gray);text-align:center;margin-bottom:20px">Magic Kingdom · Pontuação acumulada</div>
      ${sorted.map(([name, score], i) => {
        const p = STATE.players.find(x => x.name === name);
        const isFirst = i === 0;
        return `<div style="border-radius:14px;padding:14px 16px;margin-bottom:10px;background:${isFirst ? "#FFF8E1" : "var(--card)"};border:1.5px solid ${isFirst ? "#FFD700" : "var(--line)"}">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:26px">${badges[i] || "🎯"}</span>
            <span style="font-size:22px">${p ? p.emoji : "👤"}</span>
            <div style="flex:1">
              <div style="color:${isFirst ? "#7B5400" : "#fff"};font-weight:700;font-size:14px">${name}</div>
              <div style="font-size:11px;color:${isFirst ? "#A07000" : "var(--gray)"};margin-top:2px">${titles[i] || titles[3]}</div>
            </div>
            <span style="color:${isFirst ? "#7B5400" : "var(--coral)"};font-weight:800;font-size:18px">${score} pts</span>
          </div>
        </div>`;
      }).join("")}
      <button onclick="resetScores()" class="btn-outline" style="margin-top:12px;font-size:12px">🔄 Reiniciar pontuação</button>
    </div>
  `);
}

// ── FAVORITAS ─────────────────────────────────────────────────────────────────
function renderFavorites() {
  const allQ = Object.values(PERGUNTAS).flat();
  const favQ = allQ.filter(q => STATE.favorites.has(q.id));

  html(`
    <div class="screen" style="padding:24px 20px 40px">
      <button class="btn-back" onclick="go('home')">← Voltar</button>
      <div style="font-family:Georgia,serif;font-size:20px;color:#fff;margin-bottom:16px">⭐ Perguntas Favoritas</div>
      ${favQ.length === 0 ? `<div style="color:var(--gray);font-size:13px;text-align:center;margin-top:48px;line-height:1.7">Nenhuma favorita ainda.<br>Toque na ⭐ durante o quiz!</div>` : ""}
      ${favQ.map(fq => {
        const ar = AREAS.find(a => (PERGUNTAS[a.id] || []).some(q => q.id === fq.id));
        return `<div class="card" style="border-color:${ar ? ar.color + "40" : "var(--line)"};margin-bottom:10px">
          <div style="font-size:10px;color:${ar ? ar.color : "var(--coral)"};font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px">${ar ? ar.emoji + " " + ar.label : ""}</div>
          <div style="font-size:13px;color:#fff;line-height:1.5;font-weight:500">${fq.q}</div>
          ${fq.tip ? `<div style="font-size:11px;color:var(--gray);margin-top:7px;line-height:1.5">💡 ${fq.tip}</div>` : ""}
          ${fq.ind ? `<div style="font-size:11px;color:#FABC9A;margin-top:6px">${fq.ind}</div>` : ""}
          <button onclick="removeFav(${fq.id})" style="margin-top:8px;background:none;border:none;color:var(--coral);font-size:11px;font-weight:700;cursor:pointer;padding:0">✕ Remover</button>
        </div>`;
      }).join("")}
    </div>
  `);
}

function removeFav(id) {
  STATE.favorites.delete(id);
  render();
}

// ── PESQUISA ──────────────────────────────────────────────────────────────────
function renderSurvey() {
  html(`
    <div class="screen" style="padding:24px 20px">
      <button class="btn-back" onclick="go('home')">← Voltar</button>
      <div style="font-family:Georgia,serif;font-size:20px;color:#fff;margin-bottom:6px">📝 Sua Opinião</div>
      <div style="font-size:13px;color:var(--gray);margin-bottom:24px;line-height:1.6">Ajude o Triploom a ser ainda melhor! Leva menos de 2 minutos.</div>

      <div class="card" style="margin-bottom:16px">
        <div class="field-label" style="margin-bottom:10px">⭐ Qual é a sua nota para o Triploom?</div>
        <div style="display:flex;gap:8px;justify-content:center">
          ${[1,2,3,4,5].map(n => `<button id="star-${n}" onclick="selectStar(${n})" style="font-size:28px;background:none;border:none;cursor:pointer;filter:grayscale(1);transition:filter 0.2s">⭐</button>`).join("")}
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="field-label" style="margin-bottom:10px">😊 O que você mais gostou?</div>
        <textarea id="liked" class="field" rows="3" placeholder="Ex: As curiosidades são incríveis! Aprendi muito sobre o parque..."></textarea>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="field-label" style="margin-bottom:10px">🤔 O que poderia melhorar?</div>
        <textarea id="improve" class="field" rows="3" placeholder="Ex: Gostaria de mais fotos nas perguntas..."></textarea>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="field-label" style="margin-bottom:10px">📢 Você indicaria o Triploom para amigos ou família?</div>
        <div style="display:flex;gap:10px">
          <button id="rec-yes" onclick="selectRec('yes')" class="sex-btn">👍 Sim, com certeza!</button>
          <button id="rec-no" onclick="selectRec('no')" class="sex-btn">🤔 Talvez</button>
        </div>
      </div>

      <button onclick="submitSurvey()" class="btn-primary">Enviar Feedback 🌸</button>
    </div>
  `);
  window._star = 0;
  window._rec = null;
}

function selectStar(n) {
  window._star = n;
  for (let i = 1; i <= 5; i++) {
    const btn = document.getElementById("star-" + i);
    if (btn) btn.style.filter = i <= n ? "grayscale(0)" : "grayscale(1)";
  }
}

function selectRec(r) {
  window._rec = r;
  document.querySelectorAll(".sex-btn").forEach(b => b.classList.remove("selected"));
  const btn = document.getElementById("rec-" + r);
  if (btn) btn.classList.add("selected");
}

function submitSurvey() {
  const liked = val("liked");
  const improve = val("improve");
  const data = {
    organizer: STATE.organizer,
    players: STATE.players.map(p => p.name),
    star: window._star,
    liked,
    improve,
    recommend: window._rec,
    date: new Date().toISOString(),
  };
  console.log("SURVEY DATA:", JSON.stringify(data));
  // Em produção: enviar para API/email
  STATE.surveyDone = true;
  go("survey_thanks");
}

function renderSurveyThanks() {
  html(`
    <div class="screen center">
      <div style="font-size:64px">🌸</div>
      <div style="font-family:Georgia,serif;font-size:24px;color:#fff;margin-top:16px">Obrigada!</div>
      <div style="font-size:14px;color:var(--gray);margin-top:10px;line-height:1.7;max-width:280px;text-align:center">
        Seu feedback é muito importante para o Triploom continuar crescendo e melhorando!
      </div>
      <button onclick="go('home')" class="btn-primary" style="margin-top:32px;width:200px">Voltar ao início</button>
    </div>
  `);
}

// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────
function go(screen) { STATE.screen = screen; render(); }
function currentQ() { return (PERGUNTAS[STATE.area] || [])[STATE.qIndex]; }
function addPts(n) { STATE.scores[STATE.currentPlayer] = (STATE.scores[STATE.currentPlayer] || 0) + n; }
function getSorted() { return Object.entries(STATE.scores).sort((a, b) => b[1] - a[1]); }
function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }
function html(content) { document.getElementById("app").innerHTML = content; }

function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = "#E8674A";
  el.style.animation = "shake 0.4s";
  setTimeout(() => { el.style.animation = ""; el.style.borderColor = ""; }, 500);
}

function resetScores() {
  STATE.players.forEach(p => { STATE.scores[p.name] = 0; });
  STATE.answered = {};
  go("home");
}

function saveToLocalStorage() {
  try {
    localStorage.setItem("triploom_organizer", JSON.stringify(STATE.organizer));
    localStorage.setItem("triploom_players", JSON.stringify(STATE.players));
    localStorage.setItem("triploom_scores", JSON.stringify(STATE.scores));
  } catch(e) {}
}

function flowerSVG(size) {
  const r = size / 2;
  let petals = "";
  for (let i = 0; i < 8; i++) {
    petals += `<ellipse cx="${r}" cy="${r * 0.35}" rx="${r * 0.22}" ry="${r * 0.42}" fill="#F4845F" transform="rotate(${i * 45} ${r} ${r})"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;margin:0 auto">${petals}</svg>`;
}

// ── INICIAR ───────────────────────────────────────────────────────────────────
render();
