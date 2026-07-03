const counterEl = document.getElementById("counter");
const launchBtn = document.getElementById("launchBtn");
const resetBtn = document.getElementById("resetBtn");
const emojiToggle = document.getElementById("emojiToggle");
const spaceLabel = document.getElementById("spaceLabel");
const anyLabel = document.getElementById("anyLabel");
const emojiLayer = document.getElementById("emojiLayer");

let clickCount = 0;

function randomEmoji() {
  if (emojiToggle.checked) {
    return UNICODE_16_EMOJIS[
      Math.floor(Math.random() * UNICODE_16_EMOJIS.length)
    ];
  }

  return SPACE_EMOJIS[Math.floor(Math.random() * SPACE_EMOJIS.length)];
}

function updateToggleLabels() {
  spaceLabel.classList.toggle("active", !emojiToggle.checked);
  anyLabel.classList.toggle("active", emojiToggle.checked);
}

function spawnEmoji(originX, originY) {
  const el = document.createElement("div");
  el.className = "flying-emoji";
  el.textContent = randomEmoji();
  emojiLayer.appendChild(el);

  const size = 32;
  let x = originX - size / 2;
  let y = originY - size / 2;

  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 6;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  function tick() {
    x += vx;
    y += vy;

    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;

    const hitEdge =
      x <= 0 || x >= maxX || y <= 0 || y >= maxY;

    if (hitEdge) {
      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      return;
    }

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function handleClick(event) {
  clickCount += 1;
  counterEl.textContent = clickCount;

  counterEl.classList.remove("pulse");
  void counterEl.offsetWidth;
  counterEl.classList.add("pulse");

  const rect = launchBtn.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  spawnEmoji(originX, originY);
}

function handleReset() {
  clickCount = 0;
  counterEl.textContent = "0";
  counterEl.classList.remove("pulse");
  emojiLayer.innerHTML = "";
}

launchBtn.addEventListener("click", handleClick);
resetBtn.addEventListener("click", handleReset);
emojiToggle.addEventListener("change", updateToggleLabels);
updateToggleLabels();
