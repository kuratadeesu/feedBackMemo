const saveBtn = document.getElementById("saveBtn");
const memoList = document.getElementById("memoList");
const searchInput = document.getElementById("searchInput");
const currentTag = document.getElementById("currentTag");
const sortSelect = document.getElementById("sortSelect");
const cancelEditButton = document.getElementById("cancelEditButton");

let memos = JSON.parse(localStorage.getItem("memos")) || [];
let selectedTag = "";
let editIndex = null;
let editingCardIndex = null;

displayMemos();

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
  //クリック時の日付取得
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
    emotion
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
  editStatus.classList.add("hidden");
  editingCardIndex = null;
  
  displayMemos();

  clearForm();
});

sortSelect.addEventListener("change", () => {
  displayMemos();
}); 

searchInput.addEventListener("input", () => {
  displayMemos();
});

function displayMemos() {
  memoList.innerHTML = "";

  if (selectedTag === "") {
    currentTag.textContent = "すべて表示中"
    currentTag.style.backgroundColor = "#f1f3f5";
  } else {
    currentTag.textContent = `現在のタグ: ${selectedTag} を表示中`
    currentTag.style.backgroundColor = "#d0ebff";
  }

  const keyword = searchInput.value;

  const filteredMemos = memos.filter((memo) => {

    const matchKeyword =
      memo.situation.includes(keyword) ||
      memo.feeling.includes(keyword) ||
      memo.reason.includes(keyword) ||
      memo.nextAction.includes(keyword) ||
      (memo.createdAt || "").includes(keyword) ||
      (memo.updatedAt || "").includes(keyword);

    const matchTag =
      selectedTag === "" ||
      memo.tag === selectedTag;

    return matchKeyword && matchTag;
  });

  const sortValue = sortSelect.value;

  filteredMemos.sort((a,b) => {
  if (sortValue === "created-desc") {

    return b.createdAt.localeCompare(a.createdAt);

  } else if (sortValue === "created-asc") {

    return a.createdAt.localeCompare(b.createdAt);

  } else if (sortValue === "updated-desc") {

    return b.updatedAt.localeCompare(a.updatedAt);

  } else if (sortValue === "updated-asc") {

    return a.updatedAt.localeCompare(b.updatedAt);
  }
  });

  filteredMemos.forEach((memo, index) => {
    const card = document.createElement("div");
    card.classList.add("memo-card");

    if (editingCardIndex === index) {
      card.classList.add("editing-card");
    }

    let emotionColor = "";

    if (memo.emotion === "😡 イライラ") {
      emotionColor = "red";
    } else if (memo.emotion === "😢 悲しい") {
      emotionColor = "blue";
    } else if (memo.emotion === "😊 良かった") {
      emotionColor = "green";
    } else if (memo.emotion === "😰 不安") {
      emotionColor = "orange";
    } else if (memo.emotion === "😞 落ち込み") {
      emotionColor = "gray";
    }

    card.innerHTML = `
    ${editingCardIndex === index? `<div class="editing-badge">
       ✏️ 編集中
      </div>`
      : ""
    }

      <div class="memo-header">
        <h3>登録日時 ${memo.createdAt || memo.date}</h3>
        <h3>更新日時 ${memo.updatedAt || "未更新"}</h3>
        <p><strong>感情</strong><br>
          <span style="color:${emotionColor}">
            ${memo.emotion}
          </span>
        </p>
        <p><strong>何があった？</strong><br>${memo.situation}</p>
        <p id="toggle-button-${index}" class="toggle-style" onclick="toggleMemo(${index})">
          ▼続きを表示
        </p>
      </div>
      <div id="memo-detail-${index}" class="hidden">
        <p><strong>相手はどう感じた？</strong><br>${memo.feeling}</p>
        <p><strong>なぜその行動をした？</strong><br>${memo.reason}</p>
        <p><strong>次どうする？</strong><br>${memo.nextAction}</p>
        <p>
          <strong>タグ</strong><br>
          <button class="tag-button" onclick="searchTag('${memo.tag}')">
            ${memo.tag}
          </button>
        </p>
        <button onclick="deleteMemo(${index})">
          削除
        </button>
        <button onclick="editMemo(${index})">
          編集
        </button>
        <p  class="toggle-style" onclick="toggleMemo(${index})">
          ▲閉じる
        </p>
      </div>
    `;

    memoList.appendChild(card);
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

  const isDelete = confirm("本当に削除しますか？");

  if (isDelete) {
    memos.splice(index, 1);

    localStorage.setItem("memos", JSON.stringify(memos));

    displayMemos();
  }
}

function searchTag(tag) {
  selectedTag = tag;
  displayMemos();
}

function clearTag() {
  selectedTag = "";
  displayMemos();
}

function editMemo(index) {
  const memo = memos[index];

  cancelEditButton.classList.remove("hidden");

  document.getElementById("situation").value = memo.situation;
  document.getElementById("feeling").value = memo.feeling;
  document.getElementById("reason").value = memo.reason;
  document.getElementById("nextAction").value = memo.nextAction;

  editIndex = index;
  editingCardIndex = index;

  document.getElementById("formArea").scrollIntoView({
    behavior: "smooth"
  });

  const editStatus = document.getElementById("editStatus");
  editStatus.textContent = "現在編集中です";
  editStatus.classList.remove("hidden");

  displayMemos();

}

function toggleMemo(index) {
  console.log(`Toggle memo at index: ${index}`);
  const detail = document.getElementById(`memo-detail-${index}`);
  const toggleButton = document.getElementById(`toggle-button-${index}`);

  detail.classList.toggle("hidden");
  toggleButton.classList.toggle("hidden");
}