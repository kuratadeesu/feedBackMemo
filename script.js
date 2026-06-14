const saveBtn = document.getElementById("saveBtn");
const memoList = document.getElementById("memoList");
const searchInput = document.getElementById("searchInput");
const currentTag = document.getElementById("currentTag");
const sortSelect = document.getElementById("sortSelect");
const cancelEditButton = document.getElementById("cancelEditButton");
const favoriteFilterBtn = document.getElementById("favoriteFilterBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

const dateFilterInput = document.getElementById("dateFilterInput");
const calendarTitle = document.getElementById("calendarTitle");
const calendarCells = document.getElementById("calendarCells");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const remindSection = document.getElementById("remindSection");
const remindContent = document.getElementById("remindContent");
const monthlySummarySection = document.getElementById("monthlySummarySection");
const suggestedTagsContainer = document.getElementById("suggestedTags");
const tagDatalist = document.getElementById("tagDatalist");

const situationInput = document.getElementById("situation"); 
const emotionSelect = document.getElementById("emotion");     
const charCounter = document.getElementById("charCounter");   

const tagModal = document.getElementById("tagModal");
const modalTargetTag = document.getElementById("modalTargetTag");
const newTagNameInput = document.getElementById("newTagName");
const modalRenameBtn = document.getElementById("modalRenameBtn");
const modalDeleteBtn = document.getElementById("modalDeleteBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");

let memos = [];
let editId = null;
let currentFilterTag = null;
let showFavoritesOnly = false;

let currentDate = new Date();
let selectedDateStr = null;
let emotionChart = null;

// カラーカスタマイズ連動
const customColorInput = document.getElementById("customColorInput");
if (customColorInput) {
  customColorInput.addEventListener("input", (e) => {
    applyCustomColor(e.target.value);
  });
}

function applyCustomColor(hex) {
  document.documentElement.style.setProperty("--custom-base-color", hex);
  
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  
  // 単色背景用の淡いくすみトーンをセット（透明度0.08）
  const solidBgColor = `rgba(${r}, ${g}, ${b}, 0.08)`;
  document.documentElement.style.setProperty("--custom-bg-light", solidBgColor);
  
  // グラデーション設定を完全に消去して、一色のソリッドな背景にする
  document.body.style.backgroundImage = "none";
  document.body.style.backgroundColor = solidBgColor;

  localStorage.setItem("customThemeColor", hex);
  if (emotionChart) updateChart();
}

// 起動時にローカルストレージから色設定を復元する
const savedColor = localStorage.getItem("customThemeColor");
if (savedColor) {
  if (customColorInput) customColorInput.value = savedColor;
  applyCustomColor(savedColor);
} else {
  applyCustomColor("#6366f1");
}

// 文字数カウンター
if (situationInput && charCounter) {
  situationInput.addEventListener("input", () => {
    const len = situationInput.value.length;
    charCounter.textContent = `${len} / 1000`;
    if (len > 1000) {
      charCounter.style.color = "#ef4444";
    } else {
      charCounter.style.color = "#94a3b8";
    }
  });
}

// サジェストタグ
const PRESET_TAGS = ["旦那", "妻", "子供", "仕事", "コミュニケーション", "振り返り", "家事", "感謝"];
function renderSuggestedTags() {
  if (!suggestedTagsContainer) return;
  suggestedTagsContainer.innerHTML = "";
  PRESET_TAGS.forEach(tag => {
    const pill = document.createElement("span");
    pill.className = "suggest-tag-pill";
    pill.textContent = `+ ${tag}`;
    pill.addEventListener("click", () => {
      const tagsInput = document.getElementById("tags");
      if (!tagsInput) return;
      let currentVal = tagsInput.value.trim();
      if (currentVal === "") {
        tagsInput.value = tag;
      } else {
        const arr = currentVal.split(",").map(t => t.trim());
        if (!arr.includes(tag)) {
          arr.push(tag);
          tagsInput.value = arr.join(", ");
        }
      }
    });
    suggestedTagsContainer.appendChild(pill);
  });
}

function updateTagDatalist() {
  if (!tagDatalist) return;
  tagDatalist.innerHTML = "";
  const allTags = new Set(PRESET_TAGS);
  memos.forEach(m => {
    if (m.tags) m.tags.forEach(t => allTags.add(t));
  });
  allTags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    tagDatalist.appendChild(opt);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const localData = localStorage.getItem("relationship_memos");
  if (localData) {
    try { memos = JSON.parse(localData); } catch(e) { memos = []; }
  }
  renderSuggestedTags();
  updateTagDatalist();
  renderCalendar();
  updateChart();
  renderMemos();
});

function saveData() {
  localStorage.setItem("relationship_memos", JSON.stringify(memos));
  updateTagDatalist();
  renderCalendar();
  updateChart();
  renderMemos();
}

if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const situation = situationInput.value.trim();
    const emotion = emotionSelect.value;
    const actionReason = document.getElementById("actionReason").value.trim();
    const nextAction = document.getElementById("nextAction").value.trim();
    const tagsVal = document.getElementById("tags").value.trim();

    if (!situation) {
      alert("「何があった？」の内容は必ず入力してください。");
      return;
    }
    if (situation.length > 1000) {
      alert("「何があった？」の内容は1000文字以内で入力してください。");
      return;
    }

    let tagArray = [];
    if (tagsVal) {
      tagArray = tagsVal.split(",").map(t => t.trim()).filter(t => t.length > 0);
    }

    if (editId) {
      const memo = memos.find(m => m.id === editId);
      if (memo) {
        memo.situation = situation;
        memo.emotion = emotion;
        memo.actionReason = actionReason;
        memo.nextAction = nextAction;
        memo.tags = tagArray;
      }
      editId = null;
      saveBtn.textContent = "📝 メモを保存する";
      if (cancelEditButton) cancelEditButton.classList.add("hidden");
      const statusEl = document.getElementById("editStatus");
      if (statusEl) statusEl.classList.add("hidden");
    } else {
      const targetDateStr = selectedDateStr || getYYYYMMDD(new Date());
      const newMemo = {
        id: Date.now(),
        date: targetDateStr,
        createdAt: new Date().toISOString(),
        situation: situation,
        emotion: emotion,
        actionReason: actionReason,
        nextAction: nextAction,
        tags: tagArray,
        favorite: false
      };
      memos.push(newMemo);
    }

    situationInput.value = "";
    document.getElementById("actionReason").value = "";
    document.getElementById("nextAction").value = "";
    document.getElementById("tags").value = "";
    if (charCounter) charCounter.textContent = "0 / 1000";

    saveData();
  });
}

if (cancelEditButton) {
  cancelEditButton.addEventListener("click", () => {
    editId = null;
    saveBtn.textContent = "📝 メモを保存する";
    cancelEditButton.classList.add("hidden");
    situationInput.value = "";
    document.getElementById("actionReason").value = "";
    document.getElementById("nextAction").value = "";
    document.getElementById("tags").value = "";
    if (charCounter) charCounter.textContent = "0 / 1000";
    const statusEl = document.getElementById("editStatus");
    if (statusEl) statusEl.classList.add("hidden");
  });
}

function renderMemos() {
  if (!memoList) return;
  memoList.innerHTML = "";

  let filtered = [...memos];

  if (selectedDateStr) {
    filtered = filtered.filter(m => m.date === selectedDateStr);
  }
  if (currentFilterTag) {
    filtered = filtered.filter(m => m.tags && m.tags.includes(currentFilterTag));
  }
  if (showFavoritesOnly) {
    filtered = filtered.filter(m => m.favorite === true);
  }

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  if (keyword) {
    filtered = filtered.filter(m => {
      const inSit = m.situation.toLowerCase().includes(keyword);
      const inReason = m.actionReason && m.actionReason.toLowerCase().includes(keyword);
      const inNext = m.nextAction && m.nextAction.toLowerCase().includes(keyword);
      const inTags = m.tags && m.tags.some(t => t.toLowerCase().includes(keyword));
      return inSit || inReason || inNext || inTags;
    });
  }

  const sortOrder = sortSelect ? sortSelect.value : "desc";
  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return sortOrder === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    }
    return sortOrder === "desc" ? b.id - a.id : a.id - b.id;
  });

  if (filtered.length === 0) {
    let msg = "登録された振り返りメモがありません。";
    if (selectedDateStr || currentFilterTag || showFavoritesOnly || keyword) {
      msg = "該当する条件のメモは見つかりませんでした。";
    }
    memoList.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:14px; margin:40px 0;">${msg}</p>`;
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement("div");
    card.className = "memo-card";

    const header = document.createElement("div");
    header.className = "memo-header";

    const meta = document.createElement("div");
    meta.className = "memo-meta";
    
    const dSpan = document.createElement("span");
    dSpan.className = "memo-date";
    dSpan.textContent = formatJapaneseDate(m.date);
    meta.appendChild(dSpan);

    const badge = document.createElement("span");
    badge.className = `badge badge-${m.emotion}`;
    badge.textContent = getEmotionLabel(m.emotion);
    meta.appendChild(badge);

    header.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "memo-actions";

    const favBtn = document.createElement("button");
    favBtn.className = "btn-icon";
    favBtn.innerHTML = m.favorite ? "⭐" : "☆";
    favBtn.title = m.favorite ? "お気に入り解除" : "お気に入り登録";
    favBtn.addEventListener("click", () => {
      m.favorite = !m.favorite;
      saveData();
    });
    actions.appendChild(favBtn);

    const editBtn = document.createElement("button");
    editBtn.className = "btn-icon";
    editBtn.innerHTML = "✏️";
    editBtn.title = "編集";
    editBtn.addEventListener("click", () => {
      editId = m.id;
      situationInput.value = m.situation;
      emotionSelect.value = m.emotion;
      document.getElementById("actionReason").value = m.actionReason || "";
      document.getElementById("nextAction").value = m.nextAction || "";
      document.getElementById("tags").value = m.tags ? m.tags.join(", ") : "";
      
      if (charCounter) charCounter.textContent = `${m.situation.length} / 1000`;

      saveBtn.textContent = "💾 変更を保存する";
      if (cancelEditButton) cancelEditButton.classList.remove("hidden");
      
      const statusEl = document.getElementById("editStatus");
      if (statusEl) {
        statusEl.textContent = `現在、${formatJapaneseDate(m.date)} のメモを編集しています。`;
        statusEl.classList.remove("hidden");
      }
      document.getElementById("formArea").scrollIntoView({ behavior: "smooth" });
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon";
    delBtn.innerHTML = "🗑️";
    delBtn.title = "削除";
    delBtn.addEventListener("click", () => {
      if (confirm("この振り返りメモを削除してもよろしいですか？")) {
        memos = memos.filter(item => item.id !== m.id);
        if (editId === m.id) {
          editId = null;
          saveBtn.textContent = "📝 メモを保存する";
          if (cancelEditButton) cancelEditButton.classList.add("hidden");
          const statusEl = document.getElementById("editStatus");
          if (statusEl) statusEl.classList.add("hidden");
        }
        saveData();
      }
    });
    actions.appendChild(delBtn);

    header.appendChild(actions);
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "memo-body";
    body.textContent = m.situation;
    card.appendChild(body);

    if (m.actionReason || m.nextAction) {
      const sub = document.createElement("div");
      sub.className = "memo-subsections";

      if (m.actionReason) {
        const t1 = document.createElement("div");
        t1.className = "sub-block-title";
        t1.innerHTML = `<span class="icon">String🔍</span>なぜその行動をした？`;
        const c1 = document.createElement("div");
        c1.className = "sub-block-content";
        c1.textContent = m.actionReason;
        sub.appendChild(t1);
        sub.appendChild(c1);
      }
      if (m.nextAction) {
        const t2 = document.createElement("div");
        t2.className = "sub-block-title";
        t2.innerHTML = `<span class="icon">🚀</span>次どうする？`;
        const c2 = document.createElement("div");
        c2.className = "sub-block-content";
        c2.textContent = m.nextAction;
        sub.appendChild(t2);
        sub.appendChild(c2);
      }
      card.appendChild(sub);
    }

    if (m.tags && m.tags.length > 0) {
      const tDiv = document.createElement("div");
      tDiv.className = "memo-tags";
      m.tags.forEach(t => {
        const tSpan = document.createElement("span");
        tSpan.className = "tag-item";
        tSpan.textContent = `# ${t}`;
        tSpan.addEventListener("click", (e) => {
          e.stopPropagation();
          openTagModal(t);
        });
        tDiv.appendChild(tSpan);
      });
      card.appendChild(tDiv);
    }

    memoList.appendChild(card);
  });
}

function openTagModal(tagName) {
  if (!tagModal || !modalTargetTag) return;
  modalTargetTag.textContent = tagName;
  if (newTagNameInput) newTagNameInput.value = tagName;
  tagModal.classList.remove("hidden");
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", () => {
    if (tagModal) tagModal.classList.add("hidden");
  });
}

if (modalRenameBtn) {
  modalRenameBtn.addEventListener("click", () => {
    const oldName = modalTargetTag.textContent;
    const newName = newTagNameInput.value.trim();
    if (!newName) {
      alert("新しいタグ名を入力してください。");
      return;
    }
    if (oldName === newName) {
      if (tagModal) tagModal.classList.add("hidden");
      return;
    }
    memos.forEach(m => {
      if (m.tags) {
        m.tags = m.tags.map(t => t === oldName ? newName : t);
        m.tags = [...new Set(m.tags)];
      }
    });
    if (tagModal) tagModal.classList.add("hidden");
    saveData();
    alert(`タグ名「${oldName}」を「${newName}」に一括変更しました。`);
  });
}

if (modalDeleteBtn) {
  modalDeleteBtn.addEventListener("click", () => {
    const oldName = modalTargetTag.textContent;
    if (confirm(`タグ「${oldName}」を全データから完全に削除します。よろしいですか？`)) {
      memos.forEach(m => {
        if (m.tags) {
          m.tags = m.tags.filter(t => t !== oldName);
        }
      });
      if (tagModal) tagModal.classList.add("hidden");
      saveData();
      alert(`タグ「${oldName}」を一括削除しました。`);
    }
  });
}

if (searchInput) { searchInput.addEventListener("input", renderMemos); }
if (sortSelect) { sortSelect.addEventListener("change", renderMemos); }
if (favoriteFilterBtn) {
  favoriteFilterBtn.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    if (showFavoritesOnly) {
      favoriteFilterBtn.classList.add("active");
    } else {
      favoriteFilterBtn.classList.remove("active");
    }
    renderMemos();
  });
}

// カレンダー構築
if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateChart();
  });
}
if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateChart();
  });
}

function renderCalendar() {
  if (!calendarTitle || !calendarCells) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  calendarTitle.textContent = `${year}年${month + 1}月`;

  calendarCells.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.style.background = "none";
    calendarCells.appendChild(emptyCell);
  }

  const todayStr = getYYYYMMDD(new Date());

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    
    if (dateStr === todayStr) {
      cell.classList.add("current-day");
    }
    if (dateStr === selectedDateStr) {
      cell.classList.add("selected-date");
    }

    const mCount = memos.filter(m => m.date === dateStr);
    if (mCount.length > 0) {
      cell.classList.add("has-memo");
    }

    const numSpan = document.createElement("span");
    numSpan.className = "cal-date-num";
    numSpan.textContent = day;
    cell.appendChild(numSpan);

    const dotsDiv = document.createElement("div");
    dotsDiv.className = "cal-dots";
    
    const uniqueEmotionsInDay = [...new Set(mCount.map(m => m.emotion))];
    uniqueEmotionsInDay.slice(0, 3).forEach(em => {
      const dot = document.createElement("span");
      dot.style.backgroundColor = getEmotionColorCode(em);
      dotsDiv.appendChild(dot);
    });
    cell.appendChild(dotsDiv);

    cell.addEventListener("click", () => {
      if (selectedDateStr === dateStr) {
        selectedDateStr = null;
      } else {
        selectedDateStr = dateStr;
      }
      renderCalendar();
      renderMemos();
    });

    calendarCells.appendChild(cell);
  }

  renderRemindBanner(year, month);
}

function renderRemindBanner(year, month) {
  if (!remindSection || !remindContent) return;

  const targetMemos = memos.filter(m => {
    const d = new Date(m.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (targetMemos.length === 0) {
    remindSection.classList.add("hidden");
    return;
  }

  targetMemos.sort((a, b) => b.id - a.id);
  const latest = targetMemos[0];

  if (latest.nextAction) {
    remindContent.innerHTML = `直近の心掛けアクション：<strong>「${latest.nextAction}」</strong> を意識して過ごしましょう。`;
    remindSection.classList.remove("hidden");
  } else {
    remindSection.classList.add("hidden");
  }
}

// チャート統計ロジック
function updateChart() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const currentMonthMemos = memos.filter(m => {
    const d = new Date(m.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (monthlySummarySection) {
    const happyCount = currentMonthMemos.filter(m => m.emotion === "happy").length;
    const angryCount = currentMonthMemos.filter(m => m.emotion === "angry").length;
    
    let advice = "今月はまだ振り返りデータがありません。";
    if (currentMonthMemos.length > 0) {
      if (happyCount > currentMonthMemos.length * 0.5) {
        advice = "😊 素晴らしい関係性です！お互いのきもちを大切にするやり取りが定着しています。引き続き継続しましょう。";
      } else if (angryCount > currentMonthMemos.length * 0.3) {
        advice = "⚠️ ぶつかり合いが増えている傾向です。発言の前に一歩立ち止まり、「相手を第一優先に考える」アクションを意識してみましょう。";
      } else {
        advice = "😐 感情の波は穏やかです。日常のちょっとした気づきや感謝も書き留めておくと、より深い関係構築に役立ちます。";
      }
    }
    
    // 目標設定表示の生成
    const baseColor = getComputedStyle(document.documentElement).getPropertyValue('--custom-base-color').trim() || "#6366f1";
    const goalKey = `goal_memos_${year}_${month}`;
    const savedGoal = localStorage.getItem(goalKey) || "5";
    const currentCount = currentMonthMemos.length;
    const goalNum = parseInt(savedGoal, 10) || 5;
    const progressPercent = Math.min(Math.round((currentCount / goalNum) * 100), 100);
    const isCompleted = progressPercent >= 100;

    monthlySummarySection.innerHTML = `
      <p>📝 今月の記録数: <strong>${currentCount}</strong> 件</p>
      <p>${advice}</p>
      <div class="monthly-goal-card">
        <div class="goal-header-row">
          <span class="goal-title">🎯 今月の目標記録数</span>
          <span class="goal-input-inline">
            <input type="number" id="monthlyGoalInput" min="1" value="${goalNum}">
            <button id="saveGoalBtn">設定</button>
          </span>
        </div>
        <div class="goal-header-row" style="margin-top:8px;">
          <span class="goal-progress-text">${currentCount} / ${goalNum} 件 (${progressPercent}%)</span>
          ${isCompleted ? '<span class="badge badge-happy" style="padding:2px 8px; font-size:10px;">達成！</span>' : ''}
        </div>
        <div class="goal-meter-bg">
          <div id="goalMeterBar" class="goal-meter-bar ${isCompleted ? 'completed' : ''}" style="width: ${progressPercent}%;"></div>
        </div>
      </div>
    `;

    const saveGoalBtn = document.getElementById("saveGoalBtn");
    const monthlyGoalInput = document.getElementById("monthlyGoalInput");
    if (saveGoalBtn && monthlyGoalInput) {
      saveGoalBtn.addEventListener("click", () => {
        const val = parseInt(monthlyGoalInput.value, 10);
        if (val && val > 0) {
          localStorage.setItem(goalKey, val.toString());
          updateChart(); 
        }
      });
    }
  }

  const counts = { happy: 0, sad: 0, angry: 0, surprised: 0, neutral: 0 };
  currentMonthMemos.forEach(m => {
    if (counts[m.emotion] !== undefined) counts[m.emotion]++;
  });

  const labels = Object.keys(counts).map(k => getEmotionLabel(k));
  const dataValues = Object.values(counts);
  const total = dataValues.reduce((a, b) => a + b, 0);

  const colors = ['#4ade80', '#38bdf8', '#ef4444', '#fb923c', '#94a3b8'];

  if (emotionChart) {
    emotionChart.destroy();
  }

  const chartCanvas = document.getElementById('emotionChart');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  
  if (total === 0) {
    emotionChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['データなし'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e2e8f0']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    return;
  }

  emotionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      }
    }
  });
}

// インポート・エクスポート
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (memos.length === 0) {
      alert("エクスポートするデータがありません。");
      return;
    }
    const dataStr = JSON.stringify(memos, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation_memo_backup_${getYYYYMMDD(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (importBtn && fileInput) {
  importBtn.addEventListener("click", () => {
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target.result);
        if (Array.isArray(importedData)) {
          if (confirm(`ファイルから ${importedData.length} 件のメモを読み込みます。現在のデータに追加してもよろしいですか？（重複チェックは行われません）`)) {
            memos = memos.concat(importedData);
            saveData();
            alert("データのインポートが完了しました。");
          }
        } else {
          alert("不正なファイル形式です。データの構造が正しくありません。");
        }
      } catch (err) {
        alert("ファイルの読み込みに失敗しました。JSONファイルを選択してください。");
      }
    };
    reader.readAsText(file);
    fileInput.value = ""; // リセット
  });
}

// ユーティリティ関数群
function getYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatJapaneseDate(dateStr) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
}

function getEmotionLabel(key) {
  const labels = {
    happy: "😊 嬉・納得",
    sad: "😢 悲しみ",
    angry: "😠 怒り",
    surprised: "😲 驚き",
    neutral: "😐 その他"
  };
  return labels[key] || key;
}

function getEmotionColorCode(key) {
  const colors = {
    happy: "#4ade80",
    sad: "#38bdf8",
    angry: "#ef4444",
    surprised: "#fb923c",
    neutral: "#94a3b8"
  };
  return colors[key] || "#cbd5e1";
}


// --- 💡 フッターモーダル（このアプリについて / プライバシーポリシー）の開閉制御 ---
const aboutMenuBtn = document.getElementById("aboutMenuBtn");
const privacyMenuBtn = document.getElementById("privacyMenuBtn");
const aboutModal = document.getElementById("aboutModal");
const privacyModal = document.getElementById("privacyModal");
const closeAboutBtn = document.getElementById("closeAboutBtn");
const closePrivacyBtn = document.getElementById("closePrivacyBtn");

// 「このアプリについて」を開く
if (aboutMenuBtn && aboutModal) {
  aboutMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    aboutModal.classList.remove("hidden");
  });
}

// 「プライバシーポリシー」を開く
if (privacyMenuBtn && privacyModal) {
  privacyMenuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    privacyModal.classList.remove("hidden");
  });
}

// 「このアプリについて」を閉じる (Xボタン)
if (closeAboutBtn && aboutModal) {
  closeAboutBtn.addEventListener("click", () => {
    aboutModal.classList.add("hidden");
  });
}

// 「プライバシーポリシー」を閉じる (Xボタン)
if (closePrivacyBtn && privacyModal) {
  closePrivacyBtn.addEventListener("click", () => {
    privacyModal.classList.add("hidden");
  });
}

// 背景（オーバーレイ）をクリックしたときにも閉じるようにする設定
[aboutModal, privacyModal].forEach(modal => {
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
});