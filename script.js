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

let memos = JSON.parse(localStorage.getItem("memos")) || [];
let selectedTag = "";
let selectedDateStr = "";
let editIndex = null;
let editingCardIndex = null;
let emotionChart = null;
let showOnlyFavorite = false;
let selectedManageTag = "";

let currentCalendarDate = new Date();

displayMemos();
renderCalendar();
checkReminders();
renderSuggestedTags();
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
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const date = `${year}/${month}/${day} ${hours}:${minutes}`;

  const memo = {
    situation,
    feeling,
    reason,
    nextAction,
    createdAt: date,
    updatedAt: date,
    tags: tagArray,
    tag: tagInput,
    emotion,
    favorite: (editIndex !== null) ? memos[editIndex].favorite : false
  };

  if (editIndex === null) {
    memos.unshift(memo);
  } else {
    memo.createdAt = memos[editIndex].createdAt;
    memo.updatedAt = date;
    memos.splice(editIndex, 1);
    memos.unshift(memo);
    editIndex = null;
  }

  localStorage.setItem("memos", JSON.stringify(memos));

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
    const d = new Date(val);
    selectedDateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
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
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        if (confirm(`ファイルから ${importedData.length} 件のデータを復元しますか？\n※現在のデータは上書きされます。`)) {
          memos = importedData;
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

  const targetPrefix = `${year}/${month + 1}/`;
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

    const thisCellDateStr = `${year}/${month + 1}/${day}`;

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
        const formatMM = String(month + 1).padStart(2, '0');
        const formatDD = String(day).padStart(2, '0');
        dateFilterInput.value = `${year}-${formatMM}-${formatDD}`;
      }
      displayMemos();
      renderCalendar();
    });

    calendarCells.appendChild(cell);
  }
}

function updateMonthlySummary(year, month) {
  const targetPrefix = `${year}/${month + 1}/`;
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

  if (totalCount === 0) {
    monthlySummarySection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
        <h3 class="summary-title" style="margin-bottom: 0;">📈 ${year}年${month + 1}月のサマリー</h3>
        <div class="summary-streak-mini">
          <span>🌱 現在のストリーク: <strong>${currentStreak}</strong> 日連続</span>
          <span>📅 今月の稼働日数: <strong>${uniqueDaysInMonth}</strong> 日</span>
        </div>
      </div>
      <p style="font-size:12px; color:#94a3b8; text-align:center; margin:15px 0 0 0;">この月のログデータがまだありません。メモを保存すると自動で集計されます。</p>
    `;
    return;
  }

  const counts = { "😊 良かった": 0, "😢 悲しい": 0, "😡 イライラ": 0, "😰 不安": 0, "😞 落ち込み": 0 };
  monthlyMemos.forEach(memo => {
    if (counts[memo.emotion] !== undefined) counts[memo.emotion]++;
  });

  let maxEmotion = "なし";
  let maxCount = 0;
  Object.entries(counts).forEach(([emotion, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      maxEmotion = emotion;
    }
  });

  const maxRatio = totalCount > 0 ? Math.round((maxCount / totalCount) * 100) : 0;

  let breakdownHTML = "";
  Object.entries(counts).forEach(([emotion, cnt]) => {
    if (cnt > 0) {
      breakdownHTML += `<span class="summary-breakdown-item">${emotion}: ${cnt}件</span>`;
    }
  });

  monthlySummarySection.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
      <h3 class="summary-title" style="margin-bottom: 0;">📈 ${year}年${month + 1}月のサマリー</h3>
      <div class="summary-streak-mini">
        <span title="連続で記録できている日数です">🌱 現在のストリーク: <strong>${currentStreak}</strong> 日連続</span>
        <span title="今月中に何日ログインして記録できたか">📅 今月の稼働日数: <strong>${uniqueDaysInMonth}</strong> 日</span>
      </div>
    </div>
    <div class="summary-grid">
      <div class="summary-stat-card">
        <div class="summary-stat-label">総振り返り数</div>
        <div class="summary-stat-value">${totalCount} <span style="font-size:12px; font-weight:700; color:#64748b;">件</span></div>
        <div class="summary-stat-sub">今月積み上げた対話ログ</div>
      </div>
      <div class="summary-stat-card">
        <div class="summary-stat-label">一番多かった感情</div>
        <div class="summary-stat-value" style="font-size:16px; padding-top:4px;">${maxEmotion}</div>
        <div class="summary-stat-sub">全体の ${maxRatio}% を占めています</div>
      </div>
      <div class="summary-stat-card" style="grid-column: span 1;">
        <div class="summary-stat-label">感情の内訳</div>
        <div class="summary-breakdown-list">${breakdownHTML}</div>
      </div>
    </div>
  `;
}

function checkReminders() {
  remindContent.innerHTML = "";
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  const oneWeekAgoStr = `${oneWeekAgo.getFullYear()}/${oneWeekAgo.getMonth() + 1}/${oneWeekAgo.getDate()}`;
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(now.getMonth() - 1);
  const oneMonthAgoStr = `${oneMonthAgo.getFullYear()}/${oneMonthAgo.getMonth() + 1}/${oneMonthAgo.getDate()}`;

  const pastMemo = memos.find(m => {
    if (!m.createdAt) return false;
    const memoDate = m.createdAt.split(" ")[0];
    return memoDate === oneWeekAgoStr || memoDate === oneMonthAgoStr;
  });

  if (pastMemo) {
    remindSection.classList.remove("hidden");
    const isWeek = pastMemo.createdAt.split(" ")[0] === oneWeekAgoStr;
    remindContent.innerHTML = `
      <div style="font-size:13px; color:#166534; margin-bottom:6px;">
        <strong>${isWeek ? '【1週間前の今日】' : '【1ヶ月前の今日】'}</strong> の大切な振り返りメモです。
      </div>
      <div style="font-size:14px; color:#334155; background:#fff; padding:14px; border-radius:14px; border:1px solid #bbf7d0;">
        <strong>出来事:</strong> ${pastMemo.situation}<br>
        <span style="font-size:12px; color:#4f46e5; font-weight:700; cursor:pointer; display:inline-block; margin-top:6px;" onclick="focusOnMemo('${pastMemo.createdAt}')">➔ このログまでジャンプする</span>
      </div>
    `;
  } else {
    remindSection.classList.add("hidden");
  }
}

function focusOnMemo(createdAtTime) {
  clearTag();
  setTimeout(() => {
    const cards = Array.from(document.querySelectorAll(".memo-card"));
    const targetCard = cards.find(card => card.innerHTML.includes(`登録: ${createdAtTime}`));
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      targetCard.style.borderColor = "#6366f1";
      setTimeout(() => { targetCard.style.borderColor = "rgba(226, 232, 240, 0.6)"; }, 3000);
    }
  }, 100);
}

function displayMemos() {
  memoList.innerHTML = "";
  let filteredMemos = [...memos];

  if (selectedTag) {
    currentTag.textContent = `タグ: ${selectedTag}`;
    currentTag.classList.remove("hidden");
    filteredMemos = filteredMemos.filter(m => {
      if(m.tags && Array.isArray(m.tags)) return m.tags.includes(selectedTag);
      return m.tag && m.tag.split(/[,，、]/).map(t => t.trim()).includes(selectedTag);
    });
  } else {
    currentTag.classList.add("hidden");
  }

  if (selectedDateStr) {
    filteredMemos = filteredMemos.filter(m => m.createdAt && m.createdAt.split(" ")[0] === selectedDateStr);
  }

  if (showOnlyFavorite) {
    filteredMemos = filteredMemos.filter(m => m.favorite === true);
  }

  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    filteredMemos = filteredMemos.filter(m => 
      m.situation.toLowerCase().includes(query) ||
      (m.feeling && m.feeling.toLowerCase().includes(query)) ||
      (m.reason && m.reason.toLowerCase().includes(query)) ||
      (m.nextAction && m.nextAction.toLowerCase().includes(query))
    );
  }

  const sortOrder = sortSelect.value;
  if (sortOrder === "oldest") {
    filteredMemos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    filteredMemos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (filteredMemos.length === 0) {
    memoList.innerHTML = `<p style="text-align:center; color:#94a3b8; font-size:13px; margin:40px 0;">該当する振り返りメモが見つかりません。</p>`;
    return;
  }

  filteredMemos.forEach(memo => {
    const originalIndex = memos.indexOf(memo);

    let emoClass = "gray";
    if (memo.emotion.includes("イライラ")) emoClass = "red";
    else if (memo.emotion.includes("悲しい")) emoClass = "blue";
    else if (memo.emotion.includes("良かった")) emoClass = "green";
    else if (memo.emotion.includes("不安")) emoClass = "orange";

    // 💡【新機能】カード自体のクラス名に ${emoClass} を注入して背景色を感情連携させる
    const card = document.createElement("div");
    card.className = `memo-card ${emoClass}`;

    let tagsHTML = "";
    const tagsList = memo.tags || (memo.tag ? memo.tag.split(/[,，、]/).map(t => t.trim()).filter(t => t) : []);
    tagsList.forEach(t => {
      tagsHTML += `<span class="card-tag" onclick="event.stopPropagation(); searchTag('${t}')">#${t}</span>`;
    });

    const isDetailHidden = (editingCardIndex === originalIndex) ? "" : "hidden";
    const btnText = (editingCardIndex === originalIndex) ? "▲ 詳細を閉じる" : "▼ 詳細を見る";

    let highlightSituation = memo.situation;
    if (query) {
      const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
      highlightSituation = memo.situation.replace(regex, "<mark>$1</mark>");
    }

    card.innerHTML = `
      <div class="card-top-bar" onclick="toggleMemo(${originalIndex})">
        <div class="card-meta">
          <span>登録: ${memo.createdAt}</span>
          ${memo.updatedAt && memo.updatedAt !== memo.createdAt ? `<span>更新: ${memo.updatedAt}</span>` : ""}
        </div>
        <div class="card-right-controls">
          <span class="emotion-badge ${emoClass}">${memo.emotion}</span>
          <span class="favorite-star ${memo.favorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${originalIndex})">★</span>
        </div>
      </div>
      <div class="memo-body" onclick="toggleMemo(${originalIndex})">
        <div class="situation-preview">${highlightSituation}</div>
        <div id="memo-detail-${originalIndex}" class="memo-detail ${isDetailHidden}">
          ${memo.feeling ? `<div class="detail-block"><strong>👥 相手のきもちの推測</strong><div>${highlight(memo.feeling, query)}</div></div>` : ""}
          ${memo.reason ? `<div class="detail-block"><strong>💡 行動の背景・理由</strong><div>${highlight(memo.reason, query)}</div></div>` : ""}
          ${memo.nextAction ? `<div class="detail-block action"><strong>🌱 次のアクション</strong><div>${highlight(memo.nextAction, query)}</div></div>` : ""}
        </div>
        ${tagsHTML ? `<div class="card-tags">${tagsHTML}</div>` : ""}
      </div>
      <div class="card-footer">
        <button id="toggle-btn-${originalIndex}" class="btn-text-action" onclick="toggleMemo(${originalIndex})">${btnText}</button>
        <div>
          <button class="btn-text-action" onclick="editMemo(${originalIndex})">✏️ 編集</button>
          <button class="btn-text-action danger" onclick="deleteMemo(${originalIndex})">🗑️ 削除</button>
        </div>
      </div>
    `;
    memoList.appendChild(card);
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function toggleMemo(index) {
  const detail = document.getElementById(`memo-detail-${index}`);
  const btn = document.getElementById(`toggle-btn-${index}`);
  if (detail.classList.contains("hidden")) {
    detail.classList.remove("hidden");
    btn.textContent = "▲ 詳細を閉じる";
    if (editingCardIndex === null) editingCardIndex = index;
  } else {
    detail.classList.add("hidden");
    btn.textContent = "▼ 詳細を見る";
    if (editingCardIndex === index) editingCardIndex = null;
  }
}

function toggleFavorite(index) {
  memos[index].favorite = !memos[index].favorite;
  localStorage.setItem("memos", JSON.stringify(memos));
  displayMemos();
}

function deleteMemo(index) {
  if (confirm("本当にこのメモを削除しますか？")) {
    if (editIndex === index) {
      editIndex = null;
      cancelEditButton.classList.add("hidden");
      document.getElementById("editStatus").classList.add("hidden");
      clearForm();
    }
    memos.splice(index, 1);
    localStorage.setItem("memos", JSON.stringify(memos));
    displayMemos();
    renderCalendar();
    checkReminders();
    renderSuggestedTags();
    validateForm();
  }
}

function editMemo(index) {
  const memo = memos[index];
  cancelEditButton.classList.remove("hidden");
  situationInput.value = memo.situation;
  document.getElementById("feeling").value = memo.feeling;
  document.getElementById("reason").value = memo.reason;
  document.getElementById("nextAction").value = memo.nextAction;
  document.getElementById("tag").value = memo.tag || "";
  emotionSelect.value = memo.emotion || "";
  editIndex = index;
  editingCardIndex = index;
  document.getElementById("formArea").scrollIntoView({ behavior: "smooth" });
  const editStatus = document.getElementById("editStatus");
  editStatus.textContent = "現在編集中です";
  editStatus.classList.remove("hidden");
  displayMemos();
  validateForm(); 
}

function searchTag(tag) { selectedTag = tag; displayMemos(); }

function clearTag() {
  selectedTag = "";
  selectedDateStr = "";
  showOnlyFavorite = false;
  dateFilterInput.value = "";
  searchInput.value = "";
  favoriteFilterBtn.classList.remove("active");
  favoriteFilterBtn.textContent = "☆ お気に入り";
  displayMemos();
  renderCalendar();
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
  const counts = { "😊 良かった": 0, "😢 悲しい": 0, "😡 イライラ": 0, "😰 不安": 0, "😞 落ち込み": 0 };
  monthlyMemos.forEach(m => {
    if (counts[m.emotion] !== undefined) counts[m.emotion]++;
  });

  const labels = Object.keys(counts);
  const dataValues = Object.values(counts);
  const total = dataValues.reduce((a, b) => a + b, 0);

  const colors = ['#4ade80', '#38bdf8', '#ef4444', '#fb923c', '#94a3b8'];

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

  // 🛠️ 括弧のバランスを正しく修正したグラフ描画処理
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
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percentage = Math.round((value / total) * 100);
              return ` ${context.label}: ${value}件 (${percentage}%)`;
            }
          }
        }
      }
    }
  }); 
}