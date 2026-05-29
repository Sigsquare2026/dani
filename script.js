const subCategoryBar =
document.getElementById("subCategoryBar");


function loadLiveBox() {
  const liveBox = document.getElementById("liveBox");

  if (!liveBox) return;

  fetch("https://api-channel.sooplive.com/v1.1/channel/0929kelly/home/section/broad")
    .then(res => res.json())
    .then(data => {
      console.log("SOOP 라이브 API:", data);

      const broad = data.data || data;

      // 방송중 아닐 때
      if (!broad || !broad.broadNo) {
        liveBox.innerHTML = `
          <a
            class="offline-box"
            href="https://www.sooplive.com/station/0929kelly/board/109545871"
            target="_blank">
            지금 다니는 휴식중❤️ 오방공 확인하기!
          </a>
        `;
        return;
      }

      // 방송중일 때
      liveBox.innerHTML = `
        <a
          class="live-card"
          href="https://play.sooplive.co.kr/0929kelly/${broad.broadNo}"
          target="_blank">

          <img
            class="live-thumb"
            src="https://liveimg.sooplive.co.kr/${broad.broadNo}.jpg?${Date.now()}"
            alt="라이브 썸네일">

          <div class="live-info">
            <div class="live-badge">LIVE</div>

            <div class="live-name">
              이다니
            </div>

            <div class="live-title">
              ${broad.broadTitle || "방송 중입니다"}
            </div>

            <div class="live-viewer">
              시청자 ${broad.currentSumViewer || 0}명
            </div>
          </div>
        </a>
      `;
    })
    .catch(err => {
      console.error(err);

      // API 오류일 때도 방송아님 박스로 표시
      liveBox.innerHTML = `
        <a
          class="offline-box"
          href="https://www.sooplive.com/station/0929kelly/board/109545871"
          target="_blank">
          지금 다니는 휴식중❤️ 오방공 확인하기!
        </a>
      `;
    });
}

loadLiveBox();

setInterval(() => {
  loadLiveBox();
}, 60000);

function searchVideos() {
  const keyword = document
    .getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

  if (!keyword) {
    videoList.innerHTML = "";
    return;
  }

  const result = videos.filter(item =>
    item.title.toLowerCase().includes(keyword) ||
    item.number.toLowerCase().includes(keyword) ||
    item.category.toLowerCase().includes(keyword)
  );

  renderVideos(result);

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });
}

function renderSubCategories(category) {

  subCategoryBar.innerHTML = "";

  // 엑셀시그만 표시
  if (category !== "엑셀시그") {
    return;
  }

  const ranges = [

    "1000~5000",
    "5001~10000",
    "10001~20000",
    "20001~30000",
    "30000~"

  ];

  ranges.forEach(range => {

    const btn =
    document.createElement("button");

    btn.className = "sub-btn";

    btn.innerText = range;

    btn.onclick = () => {
      filterByRange(range, btn);
    };

    subCategoryBar.appendChild(btn);
  });
}

function filterByRange(range, button) {

  document.querySelectorAll(".sub-btn")
    .forEach(btn => {
      btn.classList.remove("active");
    });

  button.classList.add("active");

  let min = 0;
  let max = Infinity;

  if (range.includes("~")) {

    const split = range.split("~");

    min = Number(split[0]);

    max = split[1]
      ? Number(split[1])
      : Infinity;
  }

  const filtered = videos.filter(item => {

    if (item.category !== "엑셀시그")
      return false;

    const num = Number(item.number);

    return num >= min && num <= max;
  });

  renderVideos(filtered);
}

function loadNoticeBox() {

  const noticeBox =
  document.getElementById("noticeBox");

  if (!noticeBox) return;

fetch("https://chapi.sooplive.com/api/0929kelly/board/?per_page=5&start_date=&end_date=&field=title,contents,user_nick,user_id,hashtags&keyword=&type=all&order_by=reg_date&board_number=&page=1")

    .then(res => res.json())

    .then(data => {

      console.log("공지 API", data);

      const posts = (
  data.data ||
  data.posts ||
  data.list ||
  []
).slice(0, 5);

      if (!posts.length) {

        noticeBox.innerHTML = `
          <div class="notice-title">
            📢 공지사항
          </div>

          <div class="notice-empty">
            등록된 공지가 없습니다.
          </div>
        `;

        return;
      }

      noticeBox.innerHTML = `
        <div class="notice-title">
          📢 공지사항
        </div>

        ${posts.map(post => `

          <a
            class="notice-item"

            href="https://www.sooplive.com/station/0929kelly/post/${post.title_no}"

            target="_blank">

            <div class="notice-text">
              ${post.title_name || post.title}
            </div>

            <div class="notice-meta">

              ${post.reg_date || ""}

            </div>

          </a>

        `).join("")}

<div class="notice-more-wrap">

  <a
    class="notice-more-btn"

    href="https://www.sooplive.com/station/0929kelly/board"

    target="_blank">

    공지 더보기 →

  </a>

</div>
      `;
    })

    .catch(err => {

      console.error(err);

      noticeBox.innerHTML = `
        <div class="notice-title">
          📢 공지사항
        </div>

        <div class="notice-empty">
          공지를 불러올 수 없습니다.
        </div>
      `;
    });
}

loadNoticeBox();


function openPromiseModal(event) {
  event.preventDefault();

  const modal = document.getElementById("modal");

  modal.innerHTML = `
    <div class="modal-box" onclick="event.stopPropagation()">
      <button class="close" onclick="closeModal()">×</button>

      <h2>📜 다니공약</h2>

      <img
        src="https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/%EA%B3%B5%EC%95%BD%ED%91%9C.png"
        alt="다니공약"
        style="width:100%; border-radius:12px; display:block;">
    </div>
  `;

  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("modal");

  modal.style.display = "none";
  modal.innerHTML = "";
}