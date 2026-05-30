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

let memos = JSON.parse(localStorage.getItem("memos")) || [];
let selectedTag = "";
let selectedDateStr = "";
let editIndex = null;
let editingCardIndex = null;
let emotionChart = null;
let showOnlyFavorite = false;

let currentCalendarDate = new Date();

displayMemos();
renderCalendar();
checkReminders();

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
  const situation = document.getElementById("situation").value;
  const feeling = document.getElementById("feeling").value;
  const reason = document.getElementById("reason").value;
  const nextAction = document.getElementById("nextAction").value;
  const tag = document.getElementById("tag").value;
  const emotion = document.getElementById("emotion").value;

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
    tag,
    emotion,
    favorite: false
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

function renderCalendar() {
  calendarCells.innerHTML = "";
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarTitle.textContent = `${year}年 ${month + 1}月`;

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
      targetCard.scrollIntoView({ behavior: "smooth" });
      targetCard.style.outline = "2px solid #6366f1";
      setTimeout(() => { targetCard.style.outline = "none"; }, 2000);
    }
  }, 100);
}

// 💡 過去ログの組み立て部分を見易く大幅変更
function displayMemos() {
  memoList.innerHTML = "";

  let statusText = "すべて表示中";
  if (selectedTag) statusText = `タグ: ${selectedTag}`;
  if (selectedDateStr) statusText += ` [${selectedDateStr}]`;
  if (showOnlyFavorite) statusText += " ★";
  currentTag.textContent = statusText;

  const keyword = searchInput.value;

  const filteredMemos = memos.filter((memo) => {
    const matchKeyword =
      (memo.situation || "").includes(keyword) ||
      (memo.feeling || "").includes(keyword) ||
      (memo.reason || "").includes(keyword) ||
      (memo.nextAction || "").includes(keyword) ||
      (memo.createdAt || "").includes(keyword) ||
      (memo.updatedAt || "").includes(keyword);

    const matchTag = selectedTag === "" || memo.tag === selectedTag;
    const matchFavorite = !showOnlyFavorite || memo.favorite === true;
    const matchDate = selectedDateStr === "" || (memo.createdAt && memo.createdAt.split(" ")[0] === selectedDateStr);

    return matchKeyword && matchTag && matchFavorite && matchDate;
  });

  updateChart(filteredMemos);

  const sortValue = sortSelect.value;
  filteredMemos.sort((a, b) => {
    if (sortValue === "created-desc") return b.createdAt.localeCompare(a.createdAt);
    if (sortValue === "created-asc") return a.createdAt.localeCompare(b.createdAt);
    if (sortValue === "updated-desc") return b.updatedAt.localeCompare(a.updatedAt);
    if (sortValue === "updated-asc") return a.updatedAt.localeCompare(b.updatedAt);
  });

  filteredMemos.forEach((memo) => {
    const originalIndex = memos.indexOf(memo);

    const card = document.createElement("div");
    card.classList.add("memo-card");

    if (editingCardIndex === originalIndex) {
      card.classList.add("editing-card");
    }

    let emotionClass = "gray";
    if (memo.emotion && memo.emotion.includes("イライラ")) emotionClass = "red";
    else if (memo.emotion && memo.emotion.includes("悲しい")) emotionClass = "blue";
    else if (memo.emotion && memo.emotion.includes("良かった")) emotionClass = "green";
    else if (memo.emotion && memo.emotion.includes("不安")) emotionClass = "orange";
    else if (memo.emotion && memo.emotion.includes("落ち込み")) emotionClass = "gray";

    // 💡 HTMLパーツを役割毎のクラスに変更し、圧倒的に見やすくしました
    card.innerHTML = `
      ${editingCardIndex === originalIndex ? `<div class="editing-badge">✏️ 編集中</div>` : ""}

      <div class="card-top-bar">
        <div class="card-meta">
          <span>登録: ${memo.createdAt}</span>
          <span>更新: ${memo.updatedAt || "未更新"}</span>
        </div>
        <div class="card-right-controls">
          ${memo.emotion ? `<span class="emotion-badge ${emotionClass}">${memo.emotion}</span>` : ""}
          <span class="favorite-star ${memo.favorite ? 'active' : ''}" onclick="toggleFavorite(${originalIndex})">
            ${memo.favorite ? "★" : "☆"}
          </span>
        </div>
      </div>

      <div class="memo-body">
        <div>
          <strong>📌 何があった？</strong>
          <div class="situation-preview">${memo.situation}</div>
        </div>
        
        <div id="toggle-button-${originalIndex}" class="toggle-trigger-container">
          <div class="toggle-style" onclick="toggleMemo(${originalIndex})">詳細を見る ▾</div>
        </div>
        
        <div id="memo-detail-${originalIndex}" class="memo-detail hidden">
          <div class="bubble-block partner">
            <strong>👥 相手はどう感じた？</strong>
            <div>${memo.feeling || "（未入力）"}</div>
          </div>

          <div class="bubble-block">
            <strong>💡 なぜその行動をした？</strong>
            <div>${memo.reason || "（未入力）"}</div>
          </div>

          <div class="next-action-block">
            <strong>🌱 次どうする？（アクション）</strong>
            <div>${memo.nextAction || "（未入力）"}</div>
          </div>
          
          ${memo.tag ? `
            <div class="tag-container">
              <button class="tag-button" onclick="searchTag('${memo.tag}')"># ${memo.tag}</button>
            </div>
          ` : ""}
          
          <div class="card-actions">
            <button class="btn-edit" onclick="editMemo(${originalIndex})">編集</button>
            <button class="btn-delete" onclick="deleteMemo(${originalIndex})">削除</button>
          </div>
          
          <div class="toggle-trigger-container close-trigger">
            <div class="toggle-style" onclick="toggleMemo(${originalIndex})">詳細を閉じる ▴</div>
          </div>
          
        </div>
      </div>
    `;

    memoList.appendChild(card);
  });
}

function updateChart(targetMemos) {
  const counts = {
    "😊 良かった": 0,
    "😢 悲しい": 0,
    "😡 イライラ": 0,
    "😰 不安": 0,
    "😞 落ち込み": 0
  };

  targetMemos.forEach(memo => {
    if (counts[memo.emotion] !== undefined) { counts[memo.emotion]++; }
  });

  const labels = Object.keys(counts);
  const dataValues = Object.values(counts);
  const totalMemos = dataValues.reduce((sum, val) => sum + val, 0);

  if (totalMemos === 0) {
    if (emotionChart) { emotionChart.destroy(); emotionChart = null; }
    document.querySelector(".chart-section").style.display = "none";
    return;
  } else {
    document.querySelector(".chart-section").style.display = "flex";
  }

  const colors = ["#4ade80", "#38bdf8", "#ef4444", "#fb923c", "#cbd5e1"];
  const borderColors = ["#16a34a", "#0284c7", "#ef4444", "#ea580c", "#64748b"];

  const ctx = document.getElementById("emotionChart").getContext("2d");
  if (emotionChart) { emotionChart.destroy(); }

  emotionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{ data: dataValues, backgroundColor: colors, borderColor: borderColors, borderWidth: 1 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, 
        tooltip: { callbacks: { label: function(context) { return ` ${context.label}: ${context.raw} 件`; } } }
      },
      cutout: "70%"
    }
  });
}

function clearForm() {
  document.getElementById("situation").value = "";
  document.getElementById("feeling").value = "";
  document.getElementById("reason").value = "";
  document.getElementById("nextAction").value = "";
  document.getElementById("tag").value = "";
  document.getElementById("emotion").value = "";
}

function deleteMemo(index) {
  if (confirm("本当に削除しますか？")) {
    memos.splice(index, 1);
    localStorage.setItem("memos", JSON.stringify(memos));
    displayMemos();
    renderCalendar();
    checkReminders();
  }
}

function searchTag(tag) { selectedTag = tag; displayMemos(); }

function clearTag() {
  selectedTag = "";
  selectedDateStr = "";
  showOnlyFavorite = false;
  dateFilterInput.value = "";
  favoriteFilterBtn.classList.remove("active");
  favoriteFilterBtn.textContent = "☆ お気に入り";
  displayMemos();
  renderCalendar();
}

function editMemo(index) {
  const memo = memos[index];
  cancelEditButton.classList.remove("hidden");
  document.getElementById("situation").value = memo.situation;
  document.getElementById("feeling").value = memo.feeling;
  document.getElementById("reason").value = memo.reason;
  document.getElementById("nextAction").value = memo.nextAction;
  document.getElementById("tag").value = memo.tag || "";
  document.getElementById("emotion").value = memo.emotion || "";
  editIndex = index;
  editingCardIndex = index;
  document.getElementById("formArea").scrollIntoView({ behavior: "smooth" });
  const editStatus = document.getElementById("editStatus");
  editStatus.textContent = "現在編集中です";
  editStatus.classList.remove("hidden");
  displayMemos();
}

function toggleMemo(index) {
  document.getElementById(`memo-detail-${index}`).classList.toggle("hidden");
  document.getElementById(`toggle-button-${index}`).classList.toggle("hidden");
}

function toggleFavorite(index) {
  memos[index].favorite = !memos[index].favorite;
  localStorage.setItem("memos", JSON.stringify(memos));
  displayMemos();
}