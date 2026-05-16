const saveBtn = document.getElementById("saveBtn");
const memoList = document.getElementById("memoList");

let memos = JSON.parse(localStorage.getItem("memos")) || [];

displayMemos();

saveBtn.addEventListener("click", () => {
  const situation = document.getElementById("situation").value;
  const feeling = document.getElementById("feeling").value;
  const reason = document.getElementById("reason").value;
  const nextAction = document.getElementById("nextAction").value;

  //クリック時の日付取得
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day =  now.getDate();
  const date = `${year}/${month}/${day}`;

  const memo = {
    situation,
    feeling,
    reason,
    nextAction,
    date
  };

  memos.push(memo);

  localStorage.setItem("memos", JSON.stringify(memos));

  displayMemos();

  clearForm();
});

function displayMemos() {
  memoList.innerHTML = "";

  memos.forEach((memo) => {
    const card = document.createElement("div");
    card.classList.add("memo-card");

    card.innerHTML = `
      <h3>${memo.date}</h3>
      <p><strong>何があった？</strong><br>${memo.situation}</p>
      <p><strong>相手はどう感じた？</strong><br>${memo.feeling}</p>
      <p><strong>なぜ？</strong><br>${memo.reason}</p>
      <p><strong>次どうする？</strong><br>${memo.nextAction}</p>
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