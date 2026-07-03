function initStars() {
  const starsCanvas = document.getElementById("stars");
  if (!starsCanvas) return;

  const ctx = starsCanvas.getContext("2d");
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 2 + 0.5,
    twinkle: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005,
  }));

  function resize() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);

    for (const star of stars) {
      star.twinkle += star.speed;
      const alpha = 0.3 + Math.sin(star.twinkle) * 0.3 + 0.4;
      ctx.beginPath();
      ctx.arc(
        star.x * starsCanvas.width,
        star.y * starsCanvas.height,
        star.size,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

initStars();
