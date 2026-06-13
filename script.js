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

const customColorInput = document.getElementById("customColorInput");

let rawMemos = JSON.parse(localStorage.getItem("memos")) || [];
let memos = rawMemos.map(memo => {
  if (memo.createdAt && memo.createdAt.includes("/")) {
    const parts = memo.createdAt.split(" ");
    const dateParts = parts[0].split("/");
    const yyyy = dateParts[0];
    const mm = String(dateParts[1]).padStart(2, "0");
    const dd = String(dateParts[2]).padStart(2, "0");
    memo.createdAt = `${yyyy}-${mm}-${dd}${parts[1] ? " " + parts[1] : ""}`;
  }
  if (memo.updatedAt && memo.updatedAt.includes("/")) {
    const parts = memo.updatedAt.split(" ");
    const dateParts = parts[0].split("/");
    const yyyy = dateParts[0];
    const mm = String(dateParts[1]).padStart(2, "0");
    const dd = String(dateParts[2]).padStart(2, "0");
    memo.updatedAt = `${yyyy}-${mm}-${dd}${parts[1] ? " " + parts[1] : ""}`;
  }
  return memo;
});
localStorage.setItem("memos", JSON.stringify(memos));

let selectedTag = "";
let selectedDateStr = "";
let editIndex = null;
let editingCardIndex = null;
let emotionChart = null;
let showOnlyFavorite = false;
let selectedManageTag = "";

let currentCalendarDate = new Date();

// 🎨 カスタムカラーのリアルタイム反映と保存
const initialColor = localStorage.getItem("appCustomColor") || "#6366f1";
if (customColorInput) {
  customColorInput.value = initialColor;
  applyCustomColor(initialColor);

  customColorInput.addEventListener("input", (e) => {
    applyCustomColor(e.target.value);
  });

  customColorInput.addEventListener("change", (e) => {
    localStorage.setItem("appCustomColor", e.target.value);
  });
}

function applyCustomColor(hex) {
  // 1. 選択されたメインの色をセット
  document.documentElement.style.setProperty("--custom-base-color", hex);
  
  // 2. 背景に使うための淡いくすみ色（単色）を計算
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  
  // 目がチカチカしないように、透明度を 0.08（かなり淡いトーン）にします
  const solidBgColor = `rgba(${r}, ${g}, ${b}, 0.08)`;
  document.documentElement.style.setProperty("--custom-bg-light", solidBgColor);

  // ✨【ここを変更！】グラデーションを完全に消去し、全面を一色のフラットな背景色にする
  document.body.style.backgroundImage = "none"; // グラデーションを捨てる
  document.body.style.backgroundColor = solidBgColor; // 単色を適用
}

const formInputs = {
  situation: situationInput,
  feeling: document.getElementById("feeling"),
  reason: document.getElementById("reason"),
  nextAction: document.getElementById("nextAction"),
  tag: document.getElementById("tag"),
  emotion: emotionSelect
};

function saveDraft() {
  if (editIndex !== null) return;
  const draftData = {};
  Object.keys(formInputs).forEach(key => {
    if (formInputs[key]) draftData[key] = formInputs[key].value;
  });
  localStorage.setItem("memo_draft", JSON.stringify(draftData));
}

function loadDraft() {
  const draft = localStorage.getItem("memo_draft");
  if (draft && editIndex === null) {
    try {
      const draftData = JSON.parse(draft);
      Object.keys(formInputs).forEach(key => {
        if (formInputs[key] && draftData[key] !== undefined) {
          formInputs[key].value = draftData[key];
        }
      });
    } catch (e) {
      console.error("下書きの復元に失敗しました", e);
    }
  }
}

function clearDraft() {
  localStorage.removeItem("memo_draft");
}

Object.values(formInputs).forEach(input => {
  if (input) {
    input.addEventListener("input", saveDraft);
    input.addEventListener("change", saveDraft);
  }
});

displayMemos();
renderCalendar();
checkReminders();
renderSuggestedTags();
validateForm(); 
loadDraft(); 
validateForm();

function validateForm() {
  const situationValue = situationInput.value.trim();
  const emotionValue = emotionSelect.value;
  const charCount = situationValue.length;

  if (charCount >= 3) {
    charCounter.textContent = `${charCount} 文字 (入力OK)`;
    charCounter.classList.add("success");
  } else {
    charCounter.textContent = `${charCount} 文字 (最低3文字)`;
    charCounter.classList.remove("success");
  }

  if (charCount >= 3 && emotionValue !== "") {
    saveBtn.disabled = false;
  } else {
    saveBtn.disabled = true;
  }
}

situationInput.addEventListener("input", validateForm);
emotionSelect.addEventListener("change", validateForm);

cancelEditButton.addEventListener("click", () => {
  document.getElementById("editStatus").textContent = "";
  editIndex = null;
  cancelEditButton.classList.add("hidden");
  clearForm();
  document.getElementById("editStatus").classList.add("hidden");
  editingCardIndex = null;
  displayMemos();
  loadDraft(); 
  validateForm();
});

saveBtn.addEventListener("click", () => {
  const situation = situationInput.value;
  const feeling = document.getElementById("feeling").value;
  const reason = document.getElementById("reason").value;
  const nextAction = document.getElementById("nextAction").value;
  const tagInput = document.getElementById("tag").value;
  const emotion = emotionSelect.value;

  if (situation.trim().length < 3 || !emotion) {
    alert("「何があった？」を3文字以上入力し、感情を選択してください。");
    return;
  }

  const tagArray = tagInput
    .split(/[,，、]/)
    .map(t => t.trim())
    .filter(t => t !== "");

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day} ${hours}:${minutes}`;

  const memo = {
    situation,
    feeling,
    reason,
    nextAction,
    createdAt: dateStr,
    updatedAt: dateStr,
    tags: tagArray,
    tag: tagInput,
    emotion,
    favorite: (editIndex !== null) ? memos[editIndex].favorite : false
  };

  if (editIndex === null) {
    memos.unshift(memo);
  } else {
    memo.createdAt = memos[editIndex].createdAt;
    memo.updatedAt = dateStr;
    memos.splice(editIndex, 1);
    memos.unshift(memo);
    editIndex = null;
  }

  localStorage.setItem("memos", JSON.stringify(memos));
  clearDraft(); 

  document.getElementById("editStatus").textContent = "";
  cancelEditButton.classList.add("hidden");
  document.getElementById("editStatus").classList.add("hidden");
  editingCardIndex = null;
  
  displayMemos();
  renderCalendar();
  checkReminders();
  renderSuggestedTags();
  clearForm();
});

sortSelect.addEventListener("change", () => { displayMemos(); }); 
searchInput.addEventListener("input", () => { displayMemos(); });

dateFilterInput.addEventListener("change", () => {
  const val = dateFilterInput.value;
  if (val) {
    selectedDateStr = val;
  } else {
    selectedDateStr = "";
  }
  displayMemos();
  renderCalendar();
});

favoriteFilterBtn.addEventListener("click", () => {
  showOnlyFavorite = !showOnlyFavorite;
  if (showOnlyFavorite) {
    favoriteFilterBtn.classList.add("active");
    favoriteFilterBtn.textContent = "★ お気に入り";
  } else {
    favoriteFilterBtn.classList.remove("active");
    favoriteFilterBtn.textContent = "☆ お気に入り";
  }
  displayMemos();
});

exportBtn.addEventListener("click", () => {
  if (memos.length === 0) { alert("保存されているメモがありません。"); return; }
  const dataStr = JSON.stringify(memos, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `conversation_memos_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => { fileInput.click(); });
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        if (confirm(`ファイルから ${importedData.length} 件のデータを復元しますか？\n※現在のデータは上書きされます。`)) {
          memos = importedData.map(memo => {
            if (memo.createdAt && memo.createdAt.includes("/")) {
              const parts = memo.createdAt.split(" ");
              const dateParts = parts[0].split("/");
              memo.createdAt = `${dateParts[0]}-${String(dateParts[1]).padStart(2,"0")}-${String(dateParts[2]).padStart(2,"0")}${parts[1] ? " " + parts[1] : ""}`;
            }
            return memo;
          });
          localStorage.setItem("memos", JSON.stringify(memos));
          displayMemos();
          renderCalendar();
          checkReminders();
          renderSuggestedTags();
          validateForm();
          alert("データの復元が完了しました！");
        }
      } else { alert("ファイルの形式が正しくありません。"); }
    } catch (error) { alert("ファイルの読み込みに失敗しました。"); }
    fileInput.value = "";
  };
  reader.readAsText(file);
});

prevMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
});
nextMonthBtn.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
});

function renderSuggestedTags() {
  suggestedTagsContainer.innerHTML = "";
  tagDatalist.innerHTML = "";
  const allTags = [];

  memos.forEach(memo => {
    if (memo.tags && Array.isArray(memo.tags)) {
      memo.tags.forEach(t => allTags.push(t.trim()));
    } else if (memo.tag) {
      memo.tag.split(/[,，、]/).forEach(t => {
        if(t.trim()) allTags.push(t.trim());
      });
    }
  });

  const tagCounts = {};
  allTags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });

  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  
  sortedTags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    tagDatalist.appendChild(option);
  });

  const displayLimitTags = sortedTags.slice(0, 8);

  if (displayLimitTags.length === 0) {
    suggestedTagsContainer.innerHTML = "<span style='font-size:11px; color:#94a3b8;'>（過去のタグ履歴がここに並びます）</span>";
    return;
  }

  displayLimitTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggested-tag-btn";
    btn.textContent = `+ ${tag}`;
    
    btn.addEventListener("click", () => {
      const currentInput = document.getElementById("tag").value.trim();
      if (currentInput === "") {
        document.getElementById("tag").value = tag;
      } else {
        const currentTags = currentInput.split(/[,，、]/).map(t => t.trim());
        if (!currentTags.includes(tag)) {
          document.getElementById("tag").value = currentInput + ", " + tag;
        }
      }
      saveDraft();
    });

    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openTagManager(tag);
    });

    let pressTimer;
    btn.addEventListener("touchstart", () => {
      pressTimer = setTimeout(() => { openTagManager(tag); }, 600);
    });
    btn.addEventListener("touchend", () => { clearTimeout(pressTimer); });
    btn.addEventListener("touchmove", () => { clearTimeout(pressTimer); });

    suggestedTagsContainer.appendChild(btn);
  });
}

function openTagManager(tag) {
  selectedManageTag = tag;
  modalTargetTag.textContent = tag;
  newTagNameInput.value = tag;
  tagModal.classList.remove("hidden");
}

modalCloseBtn.addEventListener("click", () => { tagModal.classList.add("hidden"); });

modalRenameBtn.addEventListener("click", () => {
  const newName = newTagNameInput.value.trim();
  if (!newName) { alert("有効なタグ名を入力してください。"); return; }
  if (newName === selectedManageTag) { tagModal.classList.add("hidden"); return; }

  if (confirm(`本当に過去ログのタグ「${selectedManageTag}」を一括で「${newName}」に変更しますか？`)) {
    memos.forEach(memo => {
      if (memo.tags && Array.isArray(memo.tags)) {
        memo.tags = memo.tags.map(t => t === selectedManageTag ? newName : t);
        memo.tags = [...new Set(memo.tags)];
        memo.tag = memo.tags.join(", ");
      } else if (memo.tag) {
        let tempArr = memo.tag.split(/[,，、]/).map(t => t.trim());
        tempArr = tempArr.map(t => t === selectedManageTag ? newName : t);
        memo.tags = [...new Set(tempArr)].filter(t => t !== "");
        memo.tag = memo.tags.join(", ");
      }
    });
    localStorage.setItem("memos", JSON.stringify(memos));
    tagModal.classList.add("hidden");
    displayMemos();
    renderSuggestedTags();
    alert("タグ名の変更をすべて反映しました。");
  }
});

modalDeleteBtn.addEventListener("click", () => {
  if (confirm(`本当に過去のすべてのメモからタグ「${selectedManageTag}」を一括消去しますか？\n（メモ本文は削除されません）`)) {
    memos.forEach(memo => {
      if (memo.tags && Array.isArray(memo.tags)) {
        memo.tags = memo.tags.filter(t => t !== selectedManageTag);
        memo.tag = memo.tags.join(", ");
      } else if (memo.tag) {
        let tempArr = memo.tag.split(/[,，、]/).map(t => t.trim());
        tempArr = tempArr.filter(t => t !== selectedManageTag);
        memo.tags = tempArr.filter(t => t !== "");
        memo.tag = memo.tags.join(", ");
      }
    });
    localStorage.setItem("memos", JSON.stringify(memos));
    tagModal.classList.add("hidden");
    if (selectedTag === selectedManageTag) selectedTag = "";
    displayMemos();
    renderSuggestedTags();
    alert("タグを一括消去しました。");
  }
});

function renderCalendar() {
  calendarCells.innerHTML = "";
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarTitle.textContent = `${year}年 ${month + 1}月`;

  updateMonthlySummary(year, month);

  const formatMM = String(month + 1).padStart(2, '0');
  const targetPrefix = `${year}-${formatMM}-`;
  const monthlyMemosForChart = memos.filter(m => m.createdAt && m.createdAt.startsWith(targetPrefix));
  updateChart(monthlyMemosForChart); 

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("calendar-cell", "other-month");
    calendarCells.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDay; day++) {
    const cell = document.createElement("div");
    cell.classList.add("calendar-cell");
    cell.innerHTML = `<span>${day}</span>`;

    const formatDD = String(day).padStart(2, '0');
    const thisCellDateStr = `${year}-${formatMM}-${formatDD}`;

    if (selectedDateStr === thisCellDateStr) {
      cell.classList.add("selected-day");
    }

    const dayMemos = memos.filter(m => m.createdAt && m.createdAt.split(" ")[0] === thisCellDateStr);
    
    if (dayMemos.length > 0) {
      const dotsContainer = document.createElement("div");
      dotsContainer.classList.add("calendar-dots-container");
      
      dayMemos.forEach(m => {
        const dot = document.createElement("div");
        dot.classList.add("calendar-dot");
        
        if (m.emotion && m.emotion.includes("イライラ")) dot.classList.add("dot-red");
        else if (m.emotion && m.emotion.includes("悲しい")) dot.classList.add("dot-blue");
        else if (m.emotion && m.emotion.includes("良かった")) dot.classList.add("dot-green");
        else if (m.emotion && m.emotion.includes("不安")) dot.classList.add("dot-orange");
        else dot.classList.add("dot-gray");
        dotsContainer.appendChild(dot);
      });
      cell.appendChild(dotsContainer);
    }

    cell.addEventListener("click", () => {
      if (selectedDateStr === thisCellDateStr) {
        selectedDateStr = "";
        dateFilterInput.value = "";
      } else {
        selectedDateStr = thisCellDateStr;
        dateFilterInput.value = thisCellDateStr;
      }
      displayMemos();
      renderCalendar();
    });
    calendarCells.appendChild(cell);
  }
}

window.saveMonthlyGoal = function(year, month) {
  const goalInput = document.getElementById("monthlyGoalInput");
  if (!goalInput) return;
  let goalValue = parseInt(goalInput.value, 10);
  if (isNaN(goalValue) || goalValue < 0) goalValue = 0;
  localStorage.setItem(`goal_${year}_${month + 1}`, goalValue);
  updateMonthlySummary(year, month);
};

function updateMonthlySummary(year, month) {
  const formatMM = String(month + 1).padStart(2, '0');
  const targetPrefix = `${year}-${formatMM}-`;
  const monthlyMemos = memos.filter(m => m.createdAt && m.createdAt.startsWith(targetPrefix));
  const totalCount = monthlyMemos.length;

  const allRecordedDates = [...new Set(memos.filter(m => m.createdAt).map(m => m.createdAt.split(" ")[0]))]
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => b - a);

  const uniqueDaysInMonth = [...new Set(monthlyMemos.map(m => m.createdAt.split(" ")[0]))].length;
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (allRecordedDates.length > 0) {
    const latestRecordDate = new Date(allRecordedDates[0]);
    latestRecordDate.setHours(0, 0, 0, 0);

    if (latestRecordDate >= yesterday) {
      let checkDate = new Date(latestRecordDate);
      let dateIndex = 0;
      while (dateIndex < allRecordedDates.length) {
        const compareDate = new Date(allRecordedDates[dateIndex]);
        compareDate.setHours(0, 0, 0, 0);

        if (checkDate.getTime() === compareDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
          dateIndex++;
        } else if (compareDate > checkDate) {
          dateIndex++;
        } else {
          break;
        }
      }
    }
  }

  const storedGoal = localStorage.getItem(`goal_${year}_${month + 1}`);
  const goalCount = storedGoal !== null ? parseInt(storedGoal, 10) : 0;
  let progressPercent = 0;
  if (goalCount > 0) {
    progressPercent = Math.min(Math.round((totalCount / goalCount) * 100), 100);
  }
  const isCompleted = progressPercent >= 100 && goalCount > 0;

  const goalHTML = `
    <div class="goal-container">
      <div class="goal-header-row">
        <div class="goal-title">
          🎯 目標ログ件数:
          <div class="goal-input-inline">
            <input type="number" id="monthlyGoalInput" min="0" value="${goalCount}" placeholder="0">
            <button onclick="window.saveMonthlyGoal(${year}, ${month})">設定</button>
          </div>
        </div>
        <div class="goal-progress-text">
          ${goalCount > 0 ? `進捗: ${totalCount} / ${goalCount} 件 (${progressPercent}%)` : "目標未設定"}
          ${isCompleted ? ' 🎉 達成！' : ''}
        </div>
      </div>
      <div class="goal-meter-bg">
        <div class="goal-meter-bar ${isCompleted ? 'completed' : ''}" style="width: ${goalCount > 0 ? progressPercent : 0}%"></div>
      </div>
    </div>
  `;

  if (totalCount === 0) {
    monthlySummarySection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
        <h3 class="summary-title" style="margin-bottom: 0;">📈 ${year}年${month + 1}月のサマリー</h3>
        <div class="summary-streak-mini">
          <span>🌱 現在のストリーク: <strong>${currentStreak}</strong> 日連続</span>
          <span>📅 今月の稼働日数: <strong>${uniqueDaysInMonth}</strong> 日</span>
        </div>
      </div>
      <p style="font-size:12px; color:#94a3b8; text-align:center; margin:15px 0 0 0;">この月のログデータがまだありません。メモを追加してみましょう！</p>
      ${goalHTML}
    `;
    return;
  }

  const emotionCounts = {};
  monthlyMemos.forEach(m => {
    if (m.emotion) {
      emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
    }
  });

  let topEmotion = "なし";
  let maxCount = 0;
  Object.keys(emotionCounts).forEach(emo => {
    if (emotionCounts[emo] > maxCount) {
      maxCount = emotionCounts[emo];
      topEmotion = emo;
    }
  });

  monthlySummarySection.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
      <h3 class="summary-title" style="margin-bottom: 0;">📈 ${year}年${month + 1}月のサマリー</h3>
      <div class="summary-streak-mini">
        <span>🌱 現在のストリーク: <strong>${currentStreak}</strong> 日連続</span>
        <span>📅 今月の稼働日数: <strong>${uniqueDaysInMonth}</strong> 日</span>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px;">
      <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #f1f5f9; text-align:center;">
        <div style="font-size:11px; color:#64748b; font-weight:700;">総ログ件数</div>
        <div style="font-size:20px; font-weight:800; color:#1e293b; margin-top:4px;">${totalCount} <span style="font-size:12px; font-weight:600; color:#94a3b8;">件</span></div>
      </div>
      <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #f1f5f9; text-align:center;">
        <div style="font-size:11px; color:#64748b; font-weight:700;">最も多い感情ベース</div>
        <div style="font-size:15px; font-weight:800; color:#1e293b; margin-top:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${topEmotion} ${maxCount > 0 ? `(${maxCount}回)` : ''}</div>
      </div>
    </div>
    ${goalHTML}
  `;
}

function checkReminders() {
  if (!remindSection || !remindContent) return;
  
  const now = new Date();
  const currentMM = String(now.getMonth() + 1).padStart(2, '0');
  const currentDD = String(now.getDate()).padStart(2, '0');
  const todayPrefix = `-${currentMM}-${currentDD}`;

  const pastMemosOnThisDay = memos.filter(m => {
    if (!m.createdAt) return false;
    const datePart = m.createdAt.split(" ")[0];
    if (datePart === `${now.getFullYear()}-${currentMM}-${currentDD}`) return false;
    return datePart.endsWith(todayPrefix);
  });

  if (pastMemosOnThisDay.length === 0) {
    remindSection.classList.add("hidden");
    return;
  }

  remindSection.classList.remove("hidden");
  remindContent.innerHTML = "";

  const randomMemo = pastMemosOnThisDay[Math.floor(Math.random() * pastMemosOnThisDay.length)];
  const yearsAgo = now.getFullYear() - new Date(randomMemo.createdAt.split(" ")[0]).getFullYear();

  const div = document.createElement("div");
  div.style.cursor = "pointer";
  div.innerHTML = `
    <p style="margin:0 0 6px 0; font-size:12px; color:#15803d; font-weight:700;">
      💡 <strong>${yearsAgo}年前の今日</strong>（${randomMemo.createdAt.split(" ")[0]}）にこんなことがありました：
    </p>
    <div style="font-size:13px; color:#1e293b; background:rgba(255,255,255,0.6); padding:10px 14px; border-radius:10px; border:1px solid #bbf7d0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
      <strong>${randomMemo.emotion.split(" ")[0]} ${randomMemo.situation.substring(0, 40)}...</strong>
    </div>
  `;

  div.addEventListener("click", () => {
    searchInput.value = randomMemo.situation;
    displayMemos();
    searchInput.scrollIntoView({ behavior: 'smooth' });
  });

  remindContent.appendChild(div);
}

function displayMemos() {
  memoList.innerHTML = "";
  
  let filteredMemos = [...memos];

  if (selectedTag) {
    currentTag.classList.remove("hidden");
    currentTag.textContent = `🏷️ タグ: ${selectedTag} ✕`;
    currentTag.style.cursor = "pointer";
    currentTag.onclick = () => { selectedTag = ""; displayMemos(); };

    filteredMemos = filteredMemos.filter(m => {
      if (m.tags && Array.isArray(m.tags)) {
        return m.tags.includes(selectedTag);
      } else if (m.tag) {
        return m.tag.split(/[,，、]/).map(t => t.trim()).includes(selectedTag);
      }
      return false;
    });
  } else {
    currentTag.classList.add("hidden");
  }

  if (selectedDateStr) {
    filteredMemos = filteredMemos.filter(m => m.createdAt && m.createdAt.startsWith(selectedDateStr));
  }

  if (showOnlyFavorite) {
    filteredMemos = filteredMemos.filter(m => m.favorite === true);
  }

  const keyword = searchInput.value.trim().toLowerCase();
  if (keyword) {
    filteredMemos = filteredMemos.filter(m => 
      m.situation.toLowerCase().includes(keyword) || 
      (m.feeling && m.feeling.toLowerCase().includes(keyword)) ||
      (m.reason && m.reason.toLowerCase().includes(keyword)) ||
      (m.nextAction && m.nextAction.toLowerCase().includes(keyword)) ||
      (m.tag && m.tag.toLowerCase().includes(keyword))
    );
  }

  if (sortSelect.value === "oldest") {
    filteredMemos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    filteredMemos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (filteredMemos.length === 0) {
    memoList.innerHTML = "<p style='text-align:center; color:#94a3b8; font-size:13px; padding:30px 0;'>該当する振り返りメモが見つかりません。</p>";
    return;
  }

  filteredMemos.forEach((memo) => {
    const originalIndex = memos.indexOf(memo);

    const card = document.createElement("div");
    card.className = "memo-card";
    if (editingCardIndex === originalIndex) {
      card.classList.add("editing-highlight");
    }

    let highlightSituation = escapeHtml(memo.situation);
    let highlightFeeling = escapeHtml(memo.feeling || "");
    let highlightReason = escapeHtml(memo.reason || "");
    let highlightNextAction = escapeHtml(memo.nextAction || "");

    if (keyword) {
      const regex = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
      const replacer = "<mark>$1</mark>";
      if (highlightSituation) highlightSituation = highlightSituation.replace(regex, replacer);
      if (highlightFeeling) highlightFeeling = highlightFeeling.replace(regex, replacer);
      if (highlightReason) highlightReason = highlightReason.replace(regex, replacer);
      if (highlightNextAction) highlightNextAction = highlightNextAction.replace(regex, replacer);
    }

    let tagsHTML = "";
    const tArr = memo.tags && Array.isArray(memo.tags) ? memo.tags : (memo.tag ? memo.tag.split(/[,，、]/).map(t => t.trim()).filter(t => t !== "") : []);
    tArr.forEach(t => {
      tagsHTML += `<span class="memo-tag-badge" style="display:inline-block; font-size:11px; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:6px; margin-right:4px; margin-top:4px; cursor:pointer;"># ${escapeHtml(t)}</span>`;
    });

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div>
          <span style="font-size:12px; font-weight:700; color:#94a3b8; margin-right:8px;">${memo.createdAt}</span>
          <span style="font-size:12px; padding:3px 8px; border-radius:6px; font-weight:700; background:#f8fafc; border:1px solid #e2e8f0;">${memo.emotion}</span>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-card-action fav-btn" style="background:none; font-size:16px; color:${memo.favorite ? '#f59e0b':'#cbd5e1'};">${memo.favorite ? '★':'☆'}</button>
          <button class="btn-card-action edit-btn" style="background:#eff6ff; color:#2563eb; font-size:11px; padding:4px 8px; border-radius:6px;">編集</button>
          <button class="btn-card-action delete-btn" style="background:#fef2f2; color:#dc2626; font-size:11px; padding:4px 8px; border-radius:6px;">削除</button>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:13.5px; color:#334155;">
        <div><strong style="color:#64748b; font-size:12px; display:block; margin-bottom:2px;">✏️ 出来事:</strong> ${highlightSituation}</div>
        ${memo.feeling ? `<div><strong style="color:#64748b; font-size:12px; display:block; margin-bottom:2px;">👥 相手のきもちへの想像:</strong> ${highlightFeeling}</div>` : ""}
        ${memo.reason ? `<div><strong style="color:#64748b; font-size:12px; display:block; margin-bottom:2px;">💡 行動の背景・理由:</strong> ${highlightReason}</div>` : ""}
        ${memo.nextAction ? `<div style="background: #fafafa; padding:10px; border-radius:10px; border-left:3px solid var(--primary-color);"><strong style="color:var(--primary-color); font-size:12px; display:block; margin-bottom:2px;">🌱 次のアクション:</strong> ${highlightNextAction}</div>` : ""}
      </div>
      <div class="memo-tags-list" style="margin-top:10px;">${tagsHTML}</div>
    `;

    card.querySelectorAll(".memo-tag-badge").forEach((badge, idx) => {
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedTag = tArr[idx];
        displayMemos();
      });
    });

    card.querySelector(".fav-btn").addEventListener("click", () => {
      memos[originalIndex].favorite = !memos[originalIndex].favorite;
      localStorage.setItem("memos", JSON.stringify(memos));
      displayMemos();
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      editIndex = originalIndex;
      editingCardIndex = originalIndex;

      situationInput.value = memo.situation;
      document.getElementById("feeling").value = memo.feeling || "";
      document.getElementById("reason").value = memo.reason || "";
      document.getElementById("nextAction").value = memo.nextAction || "";
      document.getElementById("tag").value = memo.tag || (memo.tags ? memo.tags.join(", ") : "");
      emotionSelect.value = memo.emotion;

      document.getElementById("editStatus").classList.remove("hidden");
      document.getElementById("editStatus").textContent = `✍️ 現在、${memo.createdAt} のログを編集モードで書き換えています...`;
      cancelEditButton.classList.remove("hidden");

      document.getElementById("formArea").scrollIntoView({ behavior: 'smooth' });
      validateForm();
      displayMemos();
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("この振り返りメモを削除してもよろしいですか？")) {
        if (editIndex === originalIndex) {
          editIndex = null;
          editingCardIndex = null;
          document.getElementById("editStatus").textContent = "";
          document.getElementById("editStatus").classList.add("hidden");
          cancelEditButton.classList.add("hidden");
          clearForm();
        }
        memos.splice(originalIndex, 1);
        localStorage.setItem("memos", JSON.stringify(memos));
        displayMemos();
        renderCalendar();
        checkReminders();
        renderSuggestedTags();
        validateForm();
      }
    });

    memoList.appendChild(card);
  });
}

function clearForm() {
  situationInput.value = "";
  document.getElementById("feeling").value = "";
  document.getElementById("reason").value = "";
  document.getElementById("nextAction").value = "";
  document.getElementById("tag").value = "";
  emotionSelect.value = "";
  validateForm();
}

function updateChart(monthlyMemos) {
  const counts = {
    '😢 悲しい': 0,
    '😡 イライラ': 0,
    '😰 不安': 0,
    '😞 落ち込み': 0,
    '😊 良かった': 0
  };

  monthlyMemos.forEach(m => {
    if (counts[m.emotion] !== undefined) counts[m.emotion]++;
  });

  const labels = Object.keys(counts);
  const dataValues = Object.values(counts);
  const total = dataValues.reduce((a, b) => a + b, 0);

  const colors = ['#38bdf8', '#ef4444', '#fb923c', '#94a3b8', '#4ade80'];

  if (emotionChart) {
    emotionChart.destroy();
  }

  const ctx = document.getElementById('emotionChart').getContext('2d');
  
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
        legend: { display: false }
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}