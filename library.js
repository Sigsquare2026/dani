const libraryItems = [
  {
    category: "profile",
    title: "다니 프로필 1",
    thumbnail: "https://pub-xxxx.r2.dev/library/profile/profile-1.png",
    image: "https://pub-xxxx.r2.dev/library/profile/profile-1.png"
  },

  {
    category: "photo",
    title: "다니 사진 1",
    thumbnail: "https://pub-xxxx.r2.dev/library/photo/photo-1.png",
    image: "https://pub-xxxx.r2.dev/library/photo/photo-1.png"
  },

  {
    category: "video",
    title: "배경영상 1",
    thumbnail: "https://pub-xxxx.r2.dev/library/video/bg-1.png",
    video: "https://pub-xxxx.r2.dev/library/video/bg-1.mp4"
  }
];

const libraryList = document.getElementById("libraryList");
const modal = document.getElementById("modal");

function filterLibrary(category, element) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  element.classList.add("active");

  const filtered = libraryItems.filter(item => item.category === category);

  renderLibrary(filtered);
}

function renderLibrary(data) {
  libraryList.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb-box">
        <img src="${item.thumbnail}">
        <button class="play">보기</button>
      </div>

      <div class="title">
        ${item.title}
      </div>
    `;

    card.onclick = () => openLibraryModal(item);

    libraryList.appendChild(card);
  });
}

function openLibraryModal(item) {
  if (item.video) {
    modal.innerHTML = `
      <div class="modal-box" onclick="event.stopPropagation()">
        <button class="close" onclick="closeModal()">×</button>

        <h2>${item.title}</h2>

        <video
          class="main-video"
          controls
          autoplay
          playsinline
          src="${item.video}">
        </video>
      </div>
    `;
  } else {
    modal.innerHTML = `
      <div class="modal-box" onclick="event.stopPropagation()">
        <button class="close" onclick="closeModal()">×</button>

        <h2>${item.title}</h2>

        <img
          src="${item.image}"
          style="width:100%; border-radius:12px; display:block;">
      </div>
    `;
  }

  modal.style.display = "flex";
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