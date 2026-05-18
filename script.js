const saveBtn = document.getElementById("saveBtn");
const memoList = document.getElementById("memoList");
const searchInput = document.getElementById("searchInput");

let memos = JSON.parse(localStorage.getItem("memos")) || [];

let editIndex = null;

displayMemos();

saveBtn.addEventListener("click", () => {
  const situation = document.getElementById("situation").value;
  const feeling = document.getElementById("feeling").value;
  const reason = document.getElementById("reason").value;
  const nextAction = document.getElementById("nextAction").value;
  const tag = document.getElementById("tag").value;

  //クリック時の日付取得
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const date = `${year}/${month}/${day} ${hours}:${minutes}`;

  const memo = {
    situation,
    feeling,
    reason,
    nextAction,
    date,
    tag
  };

  if (editIndex === null) {
    memos.unshift(memo);
  } else {
    memos.splice(editIndex, 1);
    memos.unshift(memo);
    editIndex = null;
  }
  

  localStorage.setItem("memos", JSON.stringify(memos));

  displayMemos();

  clearForm();
});

searchInput.addEventListener("input", () => {
  displayMemos();
});

function displayMemos() {
  memoList.innerHTML = "";
  const keyword = searchInput.value;

  const filteredMemos = memos.filter((memo) => {
    return (
      memo.situation.includes(keyword) ||
      memo.feeling.includes(keyword) ||
      memo.reason.includes(keyword) ||
      memo.nextAction.includes(keyword) ||
      memo.date.includes(keyword)
    );
  });

  filteredMemos.forEach((memo, index) => {
    const card = document.createElement("div");
    card.classList.add("memo-card");

    card.innerHTML = `
      <h3>${memo.date}</h3>
      <p><strong>何があった？</strong><br>${memo.situation}</p>
      <p><strong>相手はどう感じた？</strong><br>${memo.feeling}</p>
      <p><strong>なぜその行動をした？</strong><br>${memo.reason}</p>
      <p><strong>次どうする？</strong><br>${memo.nextAction}</p>
      <p><strong>タグ</strong><br>${memo.tag}</p>
      <button onclick="deleteMemo(${index})">
        削除
      </button>
      <button onclick="editMemo(${index})">
        編集
      </button>
    `;

    memoList.appendChild(card);
  });
}

function clearForm() {
  document.getElementById("situation").value = "";
  document.getElementById("feeling").value = "";
  document.getElementById("reason").value = "";
  document.getElementById("nextAction").value = "";
}

function deleteMemo(index) {

  const isDelete = confirm("本当に削除しますか？"); 

  if(isDelete) {
    memos.splice(index, 1);

    localStorage.setItem("memos", JSON.stringify(memos));

    displayMemos();
  }
}

function editMemo(index) {
  const memo = memos[index];

  document.getElementById("situation").value = memo.situation;
  document.getElementById("feeling").value = memo.feeling;
  document.getElementById("reason").value = memo.reason;
  document.getElementById("nextAction").value = memo.nextAction;

  editIndex = index;
}