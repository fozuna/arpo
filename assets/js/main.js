const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const year = document.getElementById('year');
const heroEl = document.querySelector('.hero');
const processRoot = document.querySelector('[data-process]');

function onScroll(){
  if(window.scrollY > 8){header.classList.add('scrolled');}
  else{header.classList.remove('scrolled');}
}
onScroll();
window.addEventListener('scroll', onScroll, {passive:true});

if(navToggle){
  navToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({top, behavior:'smooth'});
      document.body.classList.remove('nav-open');
      navToggle && navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

if(year){year.textContent = String(new Date().getFullYear());}

// Lazy load hero photographic background with graceful fallback
if(heroEl){
  const loadHeroBg = () => {
    const sources = [
      'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=2400&q=80',
      'https://images.unsplash.com/photo-1553729784-e91953dec042?auto=format&fit=crop&w=2400&q=80'
    ];
    const url = sources[0];
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      heroEl.style.setProperty('--hero-bg', `url("${url}")`);
      heroEl.classList.add('bg-loaded');
    };
    img.onerror = () => {
      // fallback remains the SVG pattern
    };
    img.src = url;
  };
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ loadHeroBg(); obs.disconnect(); }
      });
    }, {rootMargin: '0px 0px 200px 0px'});
    io.observe(heroEl);
  } else {
    // Older browsers: load immediately
    loadHeroBg();
  }
}

// Interactive process panel (tabs)
if(processRoot){
  const panel = processRoot.querySelector('.process-panel');
  const panelTitle = panel.querySelector('.panel-title');
  const panelDesc = panel.querySelector('.panel-desc');
  const panelList = panel.querySelector('.panel-list');
  const panelImg = panel.querySelector('.panel-media img');
  const items = Array.from(processRoot.querySelectorAll('.process-item'));
  const panelInitialSrc = panelImg ? panelImg.getAttribute('src') : '';
  const panelInitialAlt = panelImg ? panelImg.getAttribute('alt') : 'Imagem ilustrativa da etapa do processo.';
  const imageExistsCache = new Map();
  const semanticHints = {
    diagnostico: ['diagnostico', 'governanca', 'analise', 'controle'],
    mapeamento: ['mapeamento', 'risco', 'riscos', 'matriz'],
    auditoria: ['auditoria', 'compliance', 'controle', 'financeiro'],
    plano: ['plano', 'estrategico', 'roadmap', 'workshop'],
    implantacao: ['implantacao', 'monitoramento', 'execucao', 'time']
  };
  const imageSearchConfig = {
    baseDir: './assets/img',
    exts: ['webp', 'jpg', 'jpeg', 'png'],
    prefixes: ['', 'process-']
  };

  const content = {
    diagnostico: {
      title: 'Diagnóstico',
      desc: 'Levantamento técnico do ambiente de controles, governança e processos críticos, com entrevistas, amostragens e análise de evidências.',
      bullets: [
        'Benefícios: visão 360° do risco; baseline de maturidade; priorização rápida.',
        'Casos de uso: expansão, M&A, adequação regulatória, reestruturação.'
      ],
      img: '',
      alt: 'Reunião executiva com análise de indicadores e diagnóstico de riscos corporativos.'
    },
    mapeamento: {
      title: 'Mapeamento de riscos',
      desc: 'Identificação, avaliação e classificação por impacto e probabilidade, com matriz de risco e definição de risk owners.',
      bullets: [
        'Benefícios: foco em riscos materiais; alocação eficiente de recursos.',
        'Casos de uso: implantação de ERM, revisão de SOX/controles internos.'
      ],
      img: '',
      alt: 'Equipe mapeando riscos em painel estratégico com post-its e categorização por prioridade.'
    },
    auditoria: {
      title: 'Auditoria e análise',
      desc: 'Testes de desenho e efetividade de controles, walkthroughs, data analytics e avaliação de conformidade.',
      bullets: [
        'Benefícios: redução de falhas; evidências para decisões; compliance fortalecido.',
        'Casos de uso: auditoria interna recorrente, due diligence, readiness.'
      ],
      img: '',
      alt: 'Auditoria financeira com documentos, calculadora e validação de conformidade.'
    },
    plano: {
      title: 'Plano estratégico',
      desc: 'Roadmap de mitigação com quick wins, marcos, responsáveis e indicadores de resultado.',
      bullets: [
        'Benefícios: execução pragmática; ganhos mensuráveis no curto prazo.',
        'Casos de uso: PMO de riscos, programas de melhoria contínua.'
      ],
      img: '',
      alt: 'Planejamento estratégico em workshop executivo com definição de roadmap e metas.'
    },
    implantacao: {
      title: 'Implantação e monitoramento',
      desc: 'Apoio à implementação de políticas, processos e indicadores, com ciclos de acompanhamento e reports executivos.',
      bullets: [
        'Benefícios: sustentabilidade dos controles; cultura orientada a risco.',
        'Casos de uso: roll-out corporativo, auditorias follow-up, comitês de risco.'
      ],
      img: '',
      alt: 'Time corporativo acompanhando a implantação de ações e indicadores de performance.'
    }
  };

  function normalize(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function tokenize(value){
    return normalize(value).split(/[^a-z0-9]+/).filter(t=>t.length > 3);
  }

  function fileStem(path){
    const part = path.split('/').pop() || '';
    return normalize(part.replace(/\.[a-z0-9]+$/i, '').replace(/^process-/, ''));
  }

  function scoreCandidate(path, key, entry){
    const stem = fileStem(path);
    let score = 0;
    if(stem === normalize(key)){score += 12;}
    if(stem.includes(normalize(key))){score += 8;}
    const hints = semanticHints[key] || [];
    hints.forEach(h=>{ if(stem.includes(normalize(h))){score += 3;} });
    const textTokens = tokenize([entry.title, entry.desc].join(' '));
    textTokens.forEach(t=>{ if(stem.includes(t)){score += 1;} });
    if(path.endsWith('.webp')){score += 1;}
    return score;
  }

  function buildCandidates(key, entry){
    const set = new Set();
    const tokens = new Set([key, ...(semanticHints[key] || []), ...tokenize(entry.title), ...tokenize(entry.desc)]);
    tokens.forEach(token=>{
      imageSearchConfig.prefixes.forEach(prefix=>{
        imageSearchConfig.exts.forEach(ext=>{
          set.add(`${imageSearchConfig.baseDir}/${prefix}${token}.${ext}`);
        });
      });
    });
    set.add(`${imageSearchConfig.baseDir}/${key}.jpg`);
    set.add(`${imageSearchConfig.baseDir}/process-${key}.jpg`);
    return Array.from(set).sort((a, b)=> scoreCandidate(b, key, entry) - scoreCandidate(a, key, entry));
  }

  function canLoadImage(src){
    if(imageExistsCache.has(src)){ return imageExistsCache.get(src); }
    const pending = new Promise(resolve=>{
      const test = new Image();
      let settled = false;
      const finish = (ok)=>{
        if(settled) return;
        settled = true;
        resolve(ok);
      };
      test.onload = ()=> finish(true);
      test.onerror = ()=> finish(false);
      setTimeout(()=> finish(false), 3000);
      test.src = src;
    });
    imageExistsCache.set(src, pending);
    return pending;
  }

  async function resolvePlaceholder(){
    const fallbackCandidates = [
      `${imageSearchConfig.baseDir}/diagnostico.jpg`,
      `${imageSearchConfig.baseDir}/governanca.jpg`,
      `${imageSearchConfig.baseDir}/mapeamento.jpg`,
      panelInitialSrc
    ].filter(Boolean);
    for(const src of fallbackCandidates){
      if(await canLoadImage(src)){ return src; }
    }
    return panelInitialSrc || `${imageSearchConfig.baseDir}/diagnostico.jpg`;
  }

  async function resolveImageForEntry(key, entry, fallbackSrc){
    const candidates = buildCandidates(key, entry);
    for(const src of candidates){
      if(await canLoadImage(src)){ return src; }
    }
    return fallbackSrc;
  }

  async function autoMapProcessImages(){
    const fallback = await resolvePlaceholder();
    const keys = Object.keys(content);
    for(const key of keys){
      const entry = content[key];
      const mapped = await resolveImageForEntry(key, entry, fallback);
      content[key].img = mapped;
      if(!content[key].alt){
        content[key].alt = `Imagem ilustrativa da etapa ${entry.title.toLowerCase()} no processo de gestão de riscos.`;
      }
    }
    return fallback;
  }

  function swapImage(src, alt, fallbackSrc){
    if(!panelImg) return;
    panelImg.classList.add('loading');
    const img = new Image();
    img.onload = ()=>{
      panelImg.src = src;
      panelImg.alt = alt;
      panelImg.classList.remove('loading');
    };
    img.onerror = ()=>{
      panelImg.src = fallbackSrc || panelInitialSrc || src;
      panelImg.alt = alt || panelInitialAlt;
      panelImg.classList.remove('loading');
    };
    img.src = src;
  }

  function select(key, trigger){
    if(!content[key]) return;
    items.forEach(it=>{
      const active = it === trigger;
      it.classList.toggle('is-active', active);
      it.setAttribute('aria-selected', String(active));
    });
    panel.classList.remove('fade-in'); panel.classList.add('fade-out');
    setTimeout(()=>{
      const c = content[key];
      panelTitle.textContent = c.title;
      panelDesc.textContent = c.desc;
      panelList.innerHTML = '';
      c.bullets.forEach(b=>{
        const li = document.createElement('li'); li.textContent = b; panelList.appendChild(li);
      });
      swapImage(c.img || panelInitialSrc, c.alt || panelInitialAlt, panelInitialSrc);
      panel.classList.remove('fade-out'); panel.classList.add('fade-in');
    }, 300);
  }

  items.forEach(btn=>{
    btn.addEventListener('click', ()=> select(btn.dataset.key, btn));
    btn.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(btn.dataset.key, btn); }
    });
  });

  autoMapProcessImages().then((fallbackSrc)=>{
    const active = processRoot.querySelector('.process-item.is-active') || items[0];
    if(!active){ return; }
    const key = active.dataset.key;
    if(!content[key]){ return; }
    swapImage(content[key].img || fallbackSrc, content[key].alt || panelInitialAlt, fallbackSrc);
  });

  (function(){
    const params = new URLSearchParams(location.search);
    if(params.get('test') !== 'process-images') return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;background:#0F1E3A;color:#fff;padding:10px 12px;border-radius:8px;font:12px/1.4 Inter,Arial;max-width:460px';
    document.body.appendChild(overlay);
    const scenarios = [
      { key: 'diagnostico', entry: content.diagnostico },
      { key: 'auditoria', entry: content.auditoria },
      { key: 'nao-encontrado', entry: { title: 'Etapa não mapeada', desc: 'Texto sem correspondência de arquivo.' } }
    ];
    autoMapProcessImages().then(async (fallbackSrc)=>{
      const lines = [];
      for(const scenario of scenarios){
        const mapped = scenario.key in content
          ? content[scenario.key].img
          : await resolveImageForEntry(scenario.key, scenario.entry, fallbackSrc);
        const usedFallback = mapped === fallbackSrc;
        lines.push(`${scenario.key}: ${usedFallback ? 'fallback' : 'ok'} -> ${mapped.split('/').pop()}`);
      }
      overlay.textContent = `Teste de mapeamento de imagens: ${lines.join(' | ')}`;
    });
  })();
}

// Simple usability test runner for the process section
(function(){
  const params = new URLSearchParams(location.search);
  if(params.get('test') !== 'process') return;
  const root = document.querySelector('[data-process]');
  if(!root) return;
  const items = Array.from(root.querySelectorAll('.process-item'));
  const title = root.querySelector('.panel-title');
  let i = 0;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;right:12px;bottom:12px;background:#0F1E3A;color:#fff;padding:8px 12px;border-radius:8px;font:12px/1.4 Inter,Arial';
  document.body.appendChild(overlay);
  function step(){
    if(i >= items.length){ overlay.textContent = 'Teste concluído: painel atualizado para todos os itens.'; return; }
    const btn = items[i++]; btn.click();
    setTimeout(()=>{
      const ok = title && title.textContent && btn.querySelector('h3') && title.textContent.includes(btn.querySelector('h3').textContent);
      overlay.textContent = `Etapa ${i}: ${ok ? 'OK' : 'Falha'} - ${title.textContent}`;
      setTimeout(step, 450);
    }, 350);
  }
  step();
})();

// Testimonials carousel
(function(){
  const root = document.querySelector('[data-carousel]');
  if(!root) return;
  const slides = Array.from(root.querySelectorAll('.slide'));
  const dotsWrap = root.querySelector('.dots');
  const prevBtn = root.querySelector('[data-prev]');
  const nextBtn = root.querySelector('[data-next]');
  let current = 0;
  let timer = null;
  const interval = 4800;

  function renderDots(){
    if(!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i)=>{
      const b = document.createElement('button');
      b.className = 'dot';
      b.type = 'button';
      b.setAttribute('role','tab');
      b.setAttribute('aria-label', `Ir para depoimento ${i+1}`);
      b.setAttribute('aria-selected', String(i===current));
      b.addEventListener('click', ()=> go(i, true));
      dotsWrap.appendChild(b);
    });
  }

  function update(){
    slides.forEach((s, i)=>{
      const active = i===current;
      s.setAttribute('aria-hidden', String(!active));
      s.style.pointerEvents = active ? 'auto' : 'none';
      s.style.zIndex = String(active ? 2 : 1);
    });
    if(dotsWrap){
      const ds = dotsWrap.querySelectorAll('.dot');
      ds.forEach((d,i)=>d.setAttribute('aria-selected', String(i===current)));
    }
  }

  function go(i, user){
    current = (i+slides.length) % slides.length;
    update();
    if(user) restart();
  }
  function next(){ go(current+1, false); }
  function prev(){ go(current-1, false); }

  function start(){
    if(timer) clearInterval(timer);
    timer = setInterval(next, interval);
  }
  function stop(){
    if(timer){ clearInterval(timer); timer = null; }
  }
  function restart(){ stop(); start(); }

  prevBtn && prevBtn.addEventListener('click', ()=> go(current-1, true));
  nextBtn && nextBtn.addEventListener('click', ()=> go(current+1, true));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowLeft'){ e.preventDefault(); go(current-1, true); }
    if(e.key==='ArrowRight'){ e.preventDefault(); go(current+1, true); }
  });

  renderDots();
  update();
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=> e.isIntersecting ? start() : stop());
    }, {rootMargin:'0px 0px 200px 0px'});
    io.observe(root);
  } else { start(); }

  const params = new URLSearchParams(location.search);
  if(params.get('test') === 'carousel'){
    let count = 0;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;left:12px;bottom:12px;background:#0F1E3A;color:#fff;padding:8px 12px;border-radius:8px;font:12px/1.4 Inter,Arial;z-index:9999';
    document.body.appendChild(overlay);
    const id = setInterval(()=>{
      next();
      overlay.textContent = `Slide ativo: ${current+1}/${slides.length}`;
      if(++count>6){ clearInterval(id); overlay.textContent += ' • teste concluído'; }
    }, 1500);
  }
})();
