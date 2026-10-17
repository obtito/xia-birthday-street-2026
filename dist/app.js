(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const preferenceKey = 'xia-birthday-street-v1';
  const desserts = {
    osmanthus: {
      name: '桂花糯米糕', shortName: '桂花糕', note: '软糯、酸甜，桂花糖的香气刚刚好。',
      reactions: ['咬到桂花糖了。', '这一口软软糯糯的。', '再尝一口？'],
      verdict: '软糯适口，桂花加分。夏夏御批：通过。'
    },
    flower: {
      name: '鲜花饼', shortName: '鲜花饼', note: '酥皮、花馅，看看合不合你的口味。',
      reactions: ['咔嚓，酥皮掉渣了。', '咬到里面的花馅了。', '好吃的话，再来一口。'],
      verdict: '酥皮藏香，甜而不腻。夏夏御批：准予再来一份。'
    }
  };
  const fortunes = [
    { title: '宜吃甜，宜被好事找到。', copy: '喜欢的甜点刚好有货，期待的小事刚好发生。' },
    { title: '开心的事，可以再来一份。', copy: '愿新一岁，常有值得你说“还想再来”的日子。' },
    { title: '喜欢的东西，刚好合适。', copy: '衣服合身，饭菜合胃口，今天也合你的心意。' },
    { title: '小小的愿望，也会发芽。', copy: '先好好喜欢它，慢慢等一场属于它的春天。' },
    { title: '快乐到站，请夏夏查收。', copy: '不必盛大，也足够让你想起来就笑一下。' },
    { title: '有好天气，也有好心情。', copy: '想出门时有风景，待在家也有自在的一天。' }
  ];
  let dessert = 'osmanthus';
  const stampedDesserts = { osmanthus: false, flower: false };
  const tasteCounts = { osmanthus: 0, flower: 0 };
  const biteLevels = { osmanthus: 0, flower: 0 };
  let biteTimeout;
  let tasteTimeout;
  let bubbleTimeout;
  let stampTimeout;
  let particleTimeout;
  let dessertActionTimeout;
  let cancelDessertScroll;
  let candleOut = false;
  let fortuneIndex = Math.floor(Math.random() * fortunes.length);
  let fortuneRevealed = false;
  let cardURL = null;
  let toastTimeout;
  let celebrationTimeout;
  let audioContext;
  let master;
  let musicOn = false;
  let musicTimer;
  const oscillators = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
    if (saved && Object.hasOwn(desserts, saved.dessert)) dessert = saved.dessert;
    if (saved?.stampedDesserts) {
      for (const key of Object.keys(stampedDesserts)) stampedDesserts[key] = saved.stampedDesserts[key] === true;
    } else if (saved?.stamped === true) {
      stampedDesserts[dessert] = true;
    }
  } catch { /* Browser-local preferences are optional. */ }

  function toast(message) {
    clearTimeout(toastTimeout);
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 3800);
  }
  function savePreferences() {
    try { localStorage.setItem(preferenceKey, JSON.stringify({ dessert, stampedDesserts })); } catch { /* Private browsing can disable storage. */ }
  }
  function renderDessert() {
    document.querySelectorAll('[data-dessert]').forEach(button => {
      const selected = button.dataset.dessert === dessert;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('dessert-note').textContent = desserts[dessert].note;
    const stamped = stampedDesserts[dessert];
    $('taste-seal').hidden = !stamped;
    $('seal-flavour').textContent = desserts[dessert].shortName;
    $('taste-seal').setAttribute('aria-label', `${desserts[dessert].name}，品鉴通过，生日特供`);
    $('stamp-button').innerHTML = stamped ? '再盖一枚品鉴章 <span aria-hidden="true">✳</span>' : '盖下今日品鉴章 <span aria-hidden="true">✳</span>';
    $('stamp-result').textContent = stamped ? desserts[dessert].verdict : '';
  }
  function dessertBurst(kind, origin) {
    const holder = $('dessert-particles');
    clearTimeout(particleTimeout);
    holder.replaceChildren();
    if (reducedMotion.matches) return;
    const position = origin || (kind === 'osmanthus' ? [39, 51] : [66, 61]);
    const count = kind === 'stamp' ? 15 : kind === 'osmanthus' ? 6 : 8;
    for (let i = 0; i < count; i++) {
      const mote = document.createElement('span');
      mote.className = `dessert-mote ${kind === 'stamp' ? 'ink-speck' : kind === 'osmanthus' ? 'osmanthus-blossom' : i % 3 === 0 ? 'pastry-crumb' : 'rose-petal'}`;
      mote.style.left = `${position[0] + (Math.random() - 0.5) * 14}%`;
      mote.style.top = `${position[1] + (Math.random() - 0.5) * 8}%`;
      mote.style.setProperty('--mote-drift', `${(Math.random() - 0.5) * (kind === 'stamp' ? 85 : 65)}px`);
      mote.style.setProperty('--mote-rise', `${kind === 'stamp' ? -18 - Math.random() * 85 : 28 + Math.random() * 45}px`);
      mote.style.setProperty('--mote-turn', `${Math.random() * 240 - 120}deg`);
      mote.style.setProperty('--mote-delay', `${Math.random() * 0.12}s`);
      holder.append(mote);
    }
    particleTimeout = setTimeout(() => holder.replaceChildren(), 1600);
  }
  function renderBites() {
    for (const kind of Object.keys(biteLevels)) {
      document.querySelectorAll(`[data-bite-kind="${kind}"]`).forEach((cut, index) => cut.setAttribute('opacity', index < biteLevels[kind] ? '1' : '0'));
      document.querySelector(`[data-bite-texture="${kind}"]`).setAttribute('opacity', biteLevels[kind] ? '1' : '0');
    }
    $('dessert-art-desc').textContent = `白瓷盘上的桂花糕${biteLevels.osmanthus ? '边缘留下了小小的咬痕' : '软糯完整'}；前排鲜花饼${biteLevels.flower ? '被轻轻咬开，露出花馅' : '酥皮完整'}，后排那枚仍完整地留在盘里。`;
  }
  function playAtPlate(action, bringIntoView) {
    clearTimeout(dessertActionTimeout);
    if (cancelDessertScroll) cancelDessertScroll();
    const stage = $('dessert-scene');
    const rect = stage.getBoundingClientRect();
    if (bringIntoView && (rect.top < 20 || rect.bottom > window.innerHeight - 20)) {
      if (reducedMotion.matches) stage.scrollIntoView({ behavior: 'auto', block: 'center' });
      else {
        let finished = false;
        let deadline;
        const cleanup = () => {
          clearTimeout(dessertActionTimeout);
          clearTimeout(deadline);
          window.removeEventListener('scroll', onScroll);
          cancelDessertScroll = null;
        };
        const finish = () => { if (finished) return; finished = true; cleanup(); action(); };
        const onScroll = () => { clearTimeout(dessertActionTimeout); dessertActionTimeout = setTimeout(finish, 100); };
        cancelDessertScroll = cleanup;
        window.addEventListener('scroll', onScroll, { passive: true });
        stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dessertActionTimeout = setTimeout(finish, 160);
        deadline = setTimeout(finish, 1400);
        return;
      }
    }
    action();
  }
  function tasteDessert(kind, bringIntoView) {
    clearTimeout(biteTimeout);
    clearTimeout(tasteTimeout);
    clearTimeout(bubbleTimeout);
    clearTimeout(stampTimeout);
    const scene = $('dessert-scene');
    scene.classList.remove('tasting-osmanthus', 'tasting-flower', 'is-stamping', 'show-taste-bubble');
    scene.dataset.tastePhase = 'resting';
    dessert = kind;
    renderDessert();
    playAtPlate(() => {
      const refill = biteLevels[kind] >= 3;
      if (refill) { biteLevels[kind] = 0; renderBites(); }
      const piece = document.querySelector(kind === 'osmanthus' ? '.rice-cake-react' : '.flower-pastry-react');
      piece.parentNode.appendChild(piece);
      $('dessert-bubble').textContent = refill ? '新的一份，再轻轻尝一口。' : '拿起一小块，轻轻尝一口。';
      void scene.offsetWidth;
      scene.classList.add('show-taste-bubble');
      if (!reducedMotion.matches) scene.classList.add(`tasting-${kind}`);
      scene.dataset.tastePhase = 'lifting';
      const takeBite = () => {
        biteLevels[kind]++;
        renderBites();
        scene.dataset.tastePhase = 'biting';
        const replies = desserts[kind].reactions;
        $('dessert-bubble').textContent = replies[tasteCounts[kind]++ % replies.length];
        dessertBurst(kind, kind === 'osmanthus' ? [57, 29] : [71, 46]);
        dessertSound(kind);
        bubbleTimeout = setTimeout(() => scene.classList.remove('show-taste-bubble'), 3400);
      };
      if (reducedMotion.matches) takeBite();
      else biteTimeout = setTimeout(takeBite, 810);
      tasteTimeout = setTimeout(() => {
        scene.classList.remove('tasting-osmanthus', 'tasting-flower');
        scene.dataset.tastePhase = 'resting';
      }, reducedMotion.matches ? 250 : 1900);
    }, bringIntoView);
    savePreferences();
  }
  document.querySelectorAll('[data-dessert]').forEach(button => button.addEventListener('click', event => {
    tasteDessert(button.dataset.dessert, event.detail > 0);
  }));
  $('stamp-button').addEventListener('click', event => {
    clearTimeout(biteTimeout);
    clearTimeout(stampTimeout);
    clearTimeout(tasteTimeout);
    clearTimeout(bubbleTimeout);
    const scene = $('dessert-scene');
    scene.classList.remove('tasting-osmanthus', 'tasting-flower', 'is-stamping', 'show-taste-bubble');
    scene.dataset.tastePhase = 'resting';
    stampedDesserts[dessert] = true;
    renderDessert();
    playAtPlate(() => {
      void scene.offsetWidth;
      if (!reducedMotion.matches) scene.classList.add('is-stamping');
      const seal = $('taste-seal').getBoundingClientRect();
      const stage = $('dessert-playground').getBoundingClientRect();
      dessertBurst('stamp', [(seal.left + seal.width / 2 - stage.left) / stage.width * 100, (seal.top + seal.height / 2 - stage.top) / stage.height * 100]);
      stampTimeout = setTimeout(() => scene.classList.remove('is-stamping'), 850);
      dessertSound('stamp');
    }, event.detail > 0);
    savePreferences();
  });
  renderDessert();

  // The scratch coating is drawn locally; the button offers the same result.
  const scratch = $('scratch-canvas');
  const scratchContext = scratch.getContext('2d');
  const scratchCells = new Set();
  let scratching = false;
  let lastScratchPoint = null;
  function updateFortune() {
    $('fortune-title').textContent = fortunes[fortuneIndex].title;
    $('fortune-copy').textContent = fortunes[fortuneIndex].copy;
  }
  function drawCoating() {
    if (!scratchContext || fortuneRevealed) return;
    const rect = scratch.getBoundingClientRect();
    scratch.width = Math.round(rect.width * 2);
    scratch.height = Math.round(rect.height * 2);
    const width = scratch.width;
    const height = scratch.height;
    scratchContext.globalCompositeOperation = 'source-over';
    scratchContext.fillStyle = '#d7d9c5';
    scratchContext.fillRect(0, 0, width, height);
    scratchContext.fillStyle = '#b7bfa7';
    for (let x = 18; x < width; x += 28) {
      for (let y = 18; y < height; y += 28) {
        scratchContext.beginPath(); scratchContext.arc(x, y, 1.5, 0, Math.PI * 2); scratchContext.fill();
      }
    }
    scratchContext.strokeStyle = '#8c9a7c';
    scratchContext.lineWidth = 2;
    scratchContext.strokeRect(25, 25, width - 50, height - 50);
    scratchContext.textAlign = 'center';
    scratchContext.textBaseline = 'middle';
    scratchContext.fillStyle = '#526348';
    scratchContext.font = '46px "Songti SC", "SimSun", serif';
    scratchContext.fillText('生日好运签', width / 2, height / 2 - 31);
    scratchContext.font = '24px "PingFang SC", sans-serif';
    scratchContext.fillText('轻轻刮开，看看今天的好运', width / 2, height / 2 + 49);
    scratchCells.clear();
  }
  function revealFortune() {
    if (fortuneRevealed) return;
    const moveFocus = document.activeElement === $('reveal-fortune');
    fortuneRevealed = true;
    $('lucky-ticket').classList.add('revealed');
    document.querySelector('.ticket-result').removeAttribute('aria-hidden');
    $('reveal-fortune').hidden = true;
    $('another-fortune').hidden = false;
    if (moveFocus) $('another-fortune').focus({ preventScroll: true });
    $('luck-status').textContent = '好运可以重复领取，祝福一直有效。';
    chime();
  }
  function scratchPoint(event) {
    const rect = scratch.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * scratch.width, y: (event.clientY - rect.top) / rect.height * scratch.height };
  }
  function eraseAt(point) {
    if (!scratchContext || fortuneRevealed) return;
    const previous = lastScratchPoint || point;
    scratchContext.globalCompositeOperation = 'destination-out';
    scratchContext.lineWidth = 78;
    scratchContext.lineCap = 'round';
    scratchContext.lineJoin = 'round';
    scratchContext.beginPath(); scratchContext.moveTo(previous.x, previous.y); scratchContext.lineTo(point.x, point.y); scratchContext.stroke();
    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - previous.x, point.y - previous.y) / 20));
    for (let i = 0; i <= steps; i++) {
      const x = previous.x + (point.x - previous.x) * i / steps;
      const y = previous.y + (point.y - previous.y) * i / steps;
      const col = Math.min(27, Math.max(0, Math.floor(x / scratch.width * 28)));
      const row = Math.min(11, Math.max(0, Math.floor(y / scratch.height * 12)));
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        if (col + dx >= 0 && col + dx < 28 && row + dy >= 0 && row + dy < 12) scratchCells.add(`${col + dx},${row + dy}`);
      }
    }
    lastScratchPoint = point;
    if (scratchCells.size > 100) revealFortune();
  }
  scratch.addEventListener('pointerdown', event => {
    if (fortuneRevealed) return;
    scratching = true;
    scratch.setPointerCapture(event.pointerId);
    lastScratchPoint = null;
    eraseAt(scratchPoint(event));
  });
  scratch.addEventListener('pointermove', event => { if (scratching) eraseAt(scratchPoint(event)); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => scratch.addEventListener(name, () => { scratching = false; lastScratchPoint = null; }));
  $('reveal-fortune').addEventListener('click', revealFortune);
  $('another-fortune').addEventListener('click', () => {
    fortuneIndex = (fortuneIndex + 1 + Math.floor(Math.random() * (fortunes.length - 1))) % fortunes.length;
    updateFortune();
    $('luck-status').textContent = '新的一份好运，已经替你留好。';
    chime();
  });
  updateFortune();
  drawCoating();
  if ('ResizeObserver' in window) new ResizeObserver(drawCoating).observe($('lucky-ticket'));
  if (!scratchContext) { scratch.hidden = true; revealFortune(); }

  function celebrate() {
    if (reducedMotion.matches) return;
    const holder = $('celebration');
    clearTimeout(celebrationTimeout);
    holder.replaceChildren();
    const colors = ['#c5cba7', '#e1bb77', '#c4d5db', '#d8b2a6', '#e8d6ac'];
    for (let i = 0; i < 54; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.backgroundColor = colors[i % colors.length];
      petal.style.setProperty('--duration', `${3.5 + Math.random() * 2}s`);
      petal.style.setProperty('--delay', `${Math.random() * 1.5}s`);
      petal.style.setProperty('--drift', `${(Math.random() - 0.5) * 220}px`);
      petal.style.setProperty('--spin', `${Math.random() * 600 - 300}deg`);
      holder.append(petal);
    }
    celebrationTimeout = setTimeout(() => holder.replaceChildren(), 7200);
  }
  $('candle-button').addEventListener('click', () => {
    candleOut = !candleOut;
    $('candle-flame').classList.toggle('out', candleOut);
    $('candle-button').innerHTML = candleOut ? '再点亮一次 <span aria-hidden="true">✧</span>' : '许好了，熄灭蜡烛 <span aria-hidden="true">✧</span>';
    $('birthday-message').textContent = candleOut ? '夏夏，生日快乐。愿你所愿。' : '';
    $('cake-caption').textContent = candleOut ? '22岁，生日快乐！' : '等你许愿。';
    if (candleOut) {
      $('candle-smoke').classList.remove('rising');
      void $('candle-smoke').offsetWidth;
      $('candle-smoke').classList.add('rising');
      celebrate();
      chime();
    }
  });
  $('emperor-tag').addEventListener('click', () => {
    toast('登基成功！今日寿星，快乐优先。');
    $('emperor-tag').querySelector('span').textContent = '夏夏小皇帝 · 登基成功';
    chime();
  });

  const quickNav = $('quick-nav');
  function updateQuickNav() { quickNav.hidden = $('street').getBoundingClientRect().bottom > 0; }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(updateQuickNav);
    observer.observe($('home'));
    observer.observe($('street'));
  } else window.addEventListener('scroll', updateQuickNav, { passive: true });
  window.addEventListener('resize', updateQuickNav);
  updateQuickNav();

  function updateWishOption() {
    const empty = !$('birthday-wish').value.trim();
    $('include-wish').disabled = empty;
    if (empty) $('include-wish').checked = false;
  }
  $('birthday-wish').addEventListener('input', updateWishOption);
  updateWishOption();

  const letterDialog = $('letter-dialog');
  function openLetter() { if (!letterDialog.open) { letterDialog.showModal(); letterDialog.scrollTop = 0; } }
  $('open-letter').addEventListener('click', openLetter);
  $('open-letter-text').addEventListener('click', openLetter);
  $('close-letter').addEventListener('click', () => letterDialog.close());
  $('finish-letter').addEventListener('click', () => letterDialog.close());
  const cardDialog = $('card-dialog');
  let previewReturnFocus = null;
  $('close-card').addEventListener('click', () => cardDialog.close());
  cardDialog.addEventListener('close', () => {
    if (previewReturnFocus?.isConnected && !previewReturnFocus.disabled) previewReturnFocus.focus({ preventScroll: true });
    previewReturnFocus = null;
  });
  [letterDialog, cardDialog].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));
  let modalCount = 0;
  [letterDialog, cardDialog].forEach(dialog => {
    const observer = new MutationObserver(() => {
      modalCount = Number(letterDialog.open) + Number(cardDialog.open);
      document.body.style.overflow = modalCount ? 'hidden' : '';
      document.body.classList.toggle('modal-open', modalCount > 0);
    });
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let current = '';
    const opening = /[（《【「『〈“‘(]$/u;
    const closing = /^[，。！？；：、）》】」』〉”’.,!?;:%]/u;
    for (const character of text) {
      if (character === '\n') { lines.push(current); current = ''; continue; }
      if (ctx.measureText(current + character).width > maxWidth && current) {
        const previous = Array.from(current);
        let next = character;
        while (previous.length > 1 && (opening.test(previous[previous.length - 1]) || closing.test(next))) next = previous.pop() + next;
        lines.push(previous.join(''));
        current = next;
      }
      else current += character;
    }
    if (current) lines.push(current);
    return lines;
  }
  function drawFlower(ctx, x, y, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color;
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.ellipse(0, size * 0.55, size * 0.23, size * 0.55, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#d5b279'; ctx.beginPath(); ctx.arc(0, 0, size * 0.23, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function showImagePreview(blob, kind) {
    if (!blob) throw new Error('export-unavailable');
    if (cardURL) URL.revokeObjectURL(cardURL);
    cardURL = URL.createObjectURL(blob);
    const letter = kind === 'letter';
    previewReturnFocus = $(letter ? 'save-letter' : 'save-card');
    $('birthday-card-image').src = cardURL;
    $('birthday-card-image').alt = letter ? '小云写给夏夏的完整生日信长图' : '为夏夏生成的专属生日卡';
    $('download-card').href = cardURL;
    $('download-card').download = letter ? '小云写给夏夏的生日信.png' : '夏夏的生日卡.png';
    $('download-card').textContent = letter ? '下载信件长图 ↓' : '下载生日卡 ↓';
    $('card-dialog-title').textContent = letter ? '保存这封信' : '给夏夏的生日卡';
    $('close-card').setAttribute('aria-label', letter ? '关闭信件长图预览' : '关闭生日卡预览');
    cardDialog.dataset.previewKind = kind;
    if (!cardDialog.open) cardDialog.showModal();
    cardDialog.scrollTop = 0;
  }
  async function generateCard() {
    const button = $('save-card');
    button.disabled = true;
    button.textContent = '正在把祝福装进卡片……';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas-unavailable');
      ctx.fillStyle = '#f8f5ed'; ctx.fillRect(0, 0, 1080, 1600);
      ctx.strokeStyle = '#bbc5ae'; ctx.lineWidth = 2; ctx.strokeRect(48, 48, 984, 1504);
      ctx.strokeStyle = '#d4d8c8'; ctx.strokeRect(61, 61, 958, 1478);
      ctx.textAlign = 'center'; ctx.fillStyle = '#9d7e49'; ctx.font = '22px Georgia, serif';
      ctx.fillText('A LITTLE BIRTHDAY WISH FOR XIA', 540, 134);
      ctx.fillStyle = '#6c7b5f'; ctx.font = '92px Georgia, serif'; ctx.fillText('22', 540, 259);
      ctx.fillStyle = '#354638'; ctx.font = '65px "Songti SC", "SimSun", serif'; ctx.fillText('夏夏，生日快乐。', 540, 361);
      drawFlower(ctx, 165, 267, 29, '#a7b296'); drawFlower(ctx, 910, 340, 20, '#c3d2d4');
      const cake = document.querySelector('.cake-illustration img');
      if (!cake.complete) { try { await cake.decode(); } catch { /* Text card still works if artwork cannot load. */ } }
      if (cake.naturalWidth) {
        try { ctx.drawImage(cake, 150, 390, 780, 624); } catch { /* Retain a fully usable text card. */ }
      }
      if (!candleOut && cake.naturalWidth) {
        ctx.fillStyle = '#d3a04b'; ctx.beginPath(); ctx.ellipse(540, 505, 10, 19, 0.15, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#8d754c'; ctx.font = '22px "PingFang SC", sans-serif';
      const wish = $('include-wish').checked ? $('birthday-wish').value.trim().replace(/\s+/gu, ' ') : '';
      ctx.fillText(wish ? '给新一岁的一个小小愿望' : '愿喜欢的日子，常常来。', 540, 1042);
      ctx.fillStyle = '#354638'; ctx.font = '33px "Songti SC", "SimSun", serif';
      const message = wish || '愿新一岁，多一些喜欢的日子，也常有意料之外的好事。';
      let lines = wrapText(ctx, message, 810);
      if (lines.length > 5) { ctx.font = '28px "Songti SC", "SimSun", serif'; lines = wrapText(ctx, message, 810); }
      lines.forEach((line, i) => ctx.fillText(line, 540, 1114 + i * 47));
      const detailsY = Math.max(1300, 1145 + lines.length * 47);
      ctx.font = '20px "PingFang SC", sans-serif'; ctx.fillStyle = '#78816d';
      ctx.fillText(`今日甜点 · ${desserts[dessert].name}`, 540, Math.min(detailsY, 1390));
      ctx.fillText(fortuneRevealed ? `今日好运 · ${fortunes[fortuneIndex].title}` : '新一岁，好事慢慢发生。', 540, Math.min(detailsY + 47, 1437));
      ctx.strokeStyle = '#d4d8c8'; ctx.beginPath(); ctx.moveTo(150, 1470); ctx.lineTo(930, 1470); ctx.stroke();
      ctx.font = '18px Georgia, "PingFang SC", sans-serif'; ctx.fillStyle = '#7d856f'; ctx.fillText('2026.10.18  ·  夏夏的生日小街  ·  来自小云', 540, 1511);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      showImagePreview(blob, 'card');
    } catch { toast('这次没能生成卡片，可以再试一次，或截屏保存这一刻。'); }
    finally { button.disabled = false; button.innerHTML = '收好这张生日卡 <span aria-hidden="true">↗</span>'; }
  }
  $('save-card').addEventListener('click', generateCard);

  async function saveLetter() {
    const button = $('save-letter');
    button.disabled = true;
    button.textContent = '正在生成长图……';
    $('letter-save-status').textContent = '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas-unavailable');
      const font = '46px "Songti SC", "SimSun", serif';
      ctx.font = font;
      let y = 410;
      const paragraphs = Array.from(document.querySelectorAll('.letter-body p:not(.letter-signature)')).map(paragraph => {
        const lines = wrapText(ctx, paragraph.innerText.trim(), 840);
        const position = y;
        y += lines.length * 78 + 26;
        return { lines, y: position };
      });
      canvas.height = Math.ceil(y + 240);
      ctx.fillStyle = '#fbf8ef'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#bbc5ae'; ctx.lineWidth = 2; ctx.strokeRect(48, 48, 984, canvas.height - 96);
      ctx.textAlign = 'center'; ctx.fillStyle = '#8d754c'; ctx.font = '22px Georgia, "PingFang SC", sans-serif';
      ctx.fillText('2026.10.18  ·  22岁生日', 540, 133);
      ctx.fillStyle = '#354638'; ctx.font = '64px "Songti SC", "SimSun", serif';
      ctx.fillText('给夏夏的保证书', 540, 261);
      ctx.strokeStyle = '#d4d8c8'; ctx.beginPath(); ctx.moveTo(120, 327); ctx.lineTo(960, 327); ctx.stroke();
      ctx.font = font; ctx.textAlign = 'left';
      paragraphs.forEach(paragraph => paragraph.lines.forEach((line, index) => ctx.fillText(line, 120, paragraph.y + index * 78)));
      ctx.textAlign = 'right'; ctx.font = '46px "Songti SC", "SimSun", serif';
      ctx.fillText('——小云', 960, y + 48);
      ctx.fillStyle = '#78816d'; ctx.font = '24px "PingFang SC", sans-serif';
      ctx.fillText('2026年10月18日', 960, y + 112);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      showImagePreview(blob, 'letter');
    } catch {
      $('letter-save-status').textContent = '这次没能生成长图，可以再试一次。';
    } finally {
      button.disabled = false;
      button.innerHTML = '保存这封信 <span aria-hidden="true">↓</span>';
    }
  }
  $('save-letter').addEventListener('click', saveLetter);

  // A quiet original pentatonic miniature. Audio begins only after a click.
  function note(frequency, start, duration = 2.3, volume = 0.08) {
    if (!audioContext || !master) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(master);
    oscillator.start(start); oscillator.stop(start + duration + 0.1);
    oscillators.add(oscillator);
    oscillator.onended = () => { oscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  }
  function scheduleMusic() {
    if (!musicOn || !audioContext) return;
    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 440, 523.25, 659.25, 783.99, 880, 783.99];
    const start = audioContext.currentTime + 0.15;
    melody.forEach((frequency, index) => note(frequency, start + index * 1.65));
    [261.63, 220, 196].forEach((frequency, index) => note(frequency, start + index * 6.6, 4.5, 0.045));
  }
  function chime() {
    if (!musicOn || !audioContext || audioContext.state !== 'running') return;
    const start = audioContext.currentTime;
    [659.25, 783.99, 1046.5].forEach((frequency, index) => note(frequency, start + index * 0.12, 1.2, 0.045));
  }
  function dessertSound(kind) {
    if (!musicOn || !audioContext || audioContext.state !== 'running') return;
    const start = audioContext.currentTime;
    if (kind === 'osmanthus') {
      note(523.25, start, 0.5, 0.045);
      note(659.25, start + 0.11, 0.5, 0.035);
      return;
    }
    const length = kind === 'stamp' ? 0.075 : 0.13;
    const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * length), audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    filter.type = kind === 'stamp' ? 'lowpass' : 'highpass';
    filter.frequency.value = kind === 'stamp' ? 650 : 2500;
    gain.gain.value = kind === 'stamp' ? 0.14 : 0.035;
    source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start(start);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    if (kind === 'stamp') note(146.83, start, 0.2, 0.07);
    else note(880, start + 0.08, 0.5, 0.025);
  }
  function stopMusic() {
    musicOn = false; clearInterval(musicTimer);
    for (const oscillator of oscillators) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    oscillators.clear();
    $('sound-toggle').setAttribute('aria-pressed', 'false');
    $('sound-toggle').setAttribute('aria-label', '开启小街轻音乐');
    $('sound-label').textContent = '声音关着';
  }
  $('sound-toggle').addEventListener('click', async () => {
    if (musicOn) { stopMusic(); return; }
    const button = $('sound-toggle'); button.disabled = true;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('audio-unavailable');
      if (!audioContext) { audioContext = new Audio(); master = audioContext.createGain(); master.gain.value = 0.65; master.connect(audioContext.destination); }
      await audioContext.resume();
      musicOn = true; scheduleMusic(); musicTimer = setInterval(scheduleMusic, 19800);
      button.setAttribute('aria-pressed', 'true'); button.setAttribute('aria-label', '关闭小街轻音乐');
      $('sound-label').textContent = '轻音乐开着';
      toast('给小街一点轻轻的声音，随时可以关掉。');
    } catch { stopMusic(); toast('这个浏览器暂时不能播放声音，安静逛逛也很好。'); }
    finally { button.disabled = false; }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && musicOn) stopMusic(); });
  window.addEventListener('pagehide', stopMusic);
})();
