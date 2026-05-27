const videos = [
  {
    category: "엑셀시그",
    number: "1212",
    title: "진압해",
    thumbnail: "thumbnails/엑셀시그/1212.gif",

    video: "https://pub-xxxx.r2.dev/엑셀시그/1212/진압해.mp4",

    clips: [
      {
        label: "2026.05.26",
        video: "https://pub-xxxx.r2.dev/엑셀시그/1212/진압해.mp4"
      },
      {
        label: "2026.05.05",
        video: "https://pub-xxxx.r2.dev/엑셀시그/1212/진압해-2.mp4"
      }
    ]
  },

  {
    category: "갠방시그",
    number: "1222",
    title: "첫눈",
    thumbnail: "thumbnails/갠방시그/1222.gif",

    video: "https://pub-xxxx.r2.dev/갠방시그/1222/첫눈.mp4",

    clips: [
      {
        label: "2026.05.25",
        video: "https://pub-xxxx.r2.dev/갠방시그/1222/첫눈.mp4"
      }
    ]
  },

  {
    category: "직캠",
    number: "열혈",
    title: "다니감지기",
    thumbnail: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/thumbnails/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.gif",

    video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/1%EC%A7%80%EA%B8%B0-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4",

    clips: [
      {
        label: "다니감지기",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/1%EC%A7%80%EA%B8%B0-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "토토충",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/1%ED%86%A0%ED%86%A0%EC%B6%A9-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "#88",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/88-%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "구르는다니",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EA%B5%AC%EB%A5%B4-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "깅더듬",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EB%8D%94%EB%93%AC-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "봄이랑꼬미",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EA%BC%AC%EB%AF%B8-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "_min",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EB%AF%BC-%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "다니만의스윗",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EC%8A%A4%EC%9C%97-%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "다니용천",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EC%9A%A9%EC%B2%9C-%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "다니율응",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%EC%9C%A8%EC%9D%91-%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      },
      {
        label: "10PRO",
        video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EB%8B%A4%EB%8B%88%EA%B0%90%EC%A7%80%EA%B8%B0/%ED%94%84%EB%A1%9C-%EA%B0%90%EC%A7%80%EA%B8%B0.mp4"
      }
    ]
  },
{
  category: "직캠",
  number: "열혈",
  title: "구르는다니",
  thumbnail: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/thumbnails/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.gif",

  video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/1%EA%B5%AC%EB%A5%B4-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4",

  clips: [
    {
      label: "구르는다니",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/1%EA%B5%AC%EB%A5%B4-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4"
    },
    {
      label: "구르는다니",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EA%B5%AC%EB%A5%B4-%EA%B5%AC%EB%A5%B4.mp4"
    },
    {
      label: "깅더듬",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EB%8D%94%EB%93%AC-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4"
    },
    {
      label: "건들면꺠뭄",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EA%B9%A8%EB%AD%84-%EA%B5%AC%EB%A5%B4.mp4"
    },
    {
      label: "지나가던똥개",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EB%98%A5%EA%B0%9C-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4"
    },
    {
      label: "백호수호신",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EB%B0%B1%ED%98%B8-%EA%B5%AC%EB%A5%B4.mp4"
    },
    {
      label: "다니만의스윗",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EC%8A%A4%EC%9C%97-%EA%B5%AC%EB%A5%B4.mp4"
    },
    {
      label: "Xeno제노",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%EC%A0%9C%EB%85%B8-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4"
    },
    {
      label: "10Pro",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%ED%85%90%ED%94%84%EB%A1%9C-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4"
    },
    {
      label: "다니품잇",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%ED%92%88%EC%9E%87-%EA%B5%AC%EB%A5%B4%EA%B0%9C.mp4"
    },
    {
      label: "☆Hwany☆",
      video: "https://pub-8523117b63a24b1799623892e83a57fd.r2.dev/videos/%EC%A7%81%EC%BA%A0/%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88/%ED%99%94%EB%8B%88-%EA%B5%AC%EB%A5%B4%EB%8A%94%EB%8B%A4%EB%8B%88.mp4"
      }
    ]
  }
];

const videoList = document.getElementById("videoList");

function renderVideos(data) {
  videoList.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-box">
        <img src="${item.thumbnail}" alt="${item.title}">
        <button class="play">▶</button>
      </div>

      <div class="title">
        <span class="num">${item.number}</span>
        ${item.title}
      </div>
    `;

    card.onclick = () => openModal(item);
    videoList.appendChild(card);
  });
}

function filterVideos(category, element) {
  const filtered = videos.filter(item => item.category === category);

  renderVideos(filtered);

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  element.classList.add("active");
}

function openModal(item) {
  modal.innerHTML = `
    <div class="modal-box" onclick="event.stopPropagation()">
      <button class="close" onclick="closeModal()">×</button>

      <h2>▶ ${item.title} (${item.number})</h2>

      <video
        class="main-video"
        controls
        autoplay
        playsinline
        src="${item.video}">
      </video>

      <div class="sub-title">
        ${item.title} (${item.number}) 다른 영상
      </div>

      <div class="date-button-list">
        ${item.clips.map(clip => `
          <button class="date-btn" onclick="changeVideo('${clip.video}')">
            ${clip.label}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function changeVideo(src) {
  const video = document.querySelector(".main-video");

  if (!video) return;

  video.pause();
  video.src = src;
  video.load();
  video.play();
}

function closeModal() {
  const video = document.querySelector(".main-video");

  if (video) {
    video.pause();
    video.src = "";
  }

  modal.style.display = "none";
  modal.innerHTML = "";
}

modal.onclick = closeModal;

filterVideos("엑셀시그", document.querySelector(".tab"));