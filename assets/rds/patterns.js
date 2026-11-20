/* Pattern sheet lab: seed, topic and layout controls for the motif system (assets/rds/motifs.js). */
(function () {
  var form = document.querySelector('[data-lab]'), art = document.querySelector('[data-lab-art]');
  if (!form || !art) return;
  var seed = form.querySelector('[data-seed]'), topic = form.querySelector('[data-topic]'), kind = form.querySelector('[data-kind]'), status = form.querySelector('[data-status]'), pause = form.querySelector('[data-pause]');
  if (window.matchMedia && matchMedia('(max-width: 640px)').matches) kind.value = 'card';
  var q = new URLSearchParams(location.search); if (q.get('seed')) seed.value = q.get('seed');
  function draw(s) {
    if (!window.RDSArt) return;
    art.removeAttribute('data-art-mobile'); art.setAttribute('data-rds-art', kind.value); art.className = 'rv-tiles rds-art';
    RDSArt.render(art, { kind: kind.value, seed: s || seed.value || 'seed', topic: topic.value });
    status.textContent = 'Seed: ' + (s || seed.value || 'seed') + ' · ' + kind.value + (topic.value ? ' · ' + topic.value : '');
  }
  function go() { if (window.RDSArt) draw(); else window.addEventListener('load', draw); }
  seed.addEventListener('input', go); topic.addEventListener('change', go); kind.addEventListener('change', go);
  form.querySelector('[data-reroll]').addEventListener('click', function () { var s = Math.random().toString(36).slice(2, 8); seed.value = s; draw(s); });
  pause.addEventListener('click', function () { var on = pause.getAttribute('aria-pressed') === 'true'; pause.setAttribute('aria-pressed', on ? 'false' : 'true'); pause.textContent = on ? 'Pause drift' : 'Resume drift'; document.documentElement.classList.toggle('rv-art-paused', !on); });
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
