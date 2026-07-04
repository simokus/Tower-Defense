// Bootstrap: wire up the Game engine, UI, and the render/update loop.
(function () {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);
  UI.init(game);

  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (UI.currentScreen === 'game' && game.level) {
      game.update(dt);
      game.render();
      UI.updateHud();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
