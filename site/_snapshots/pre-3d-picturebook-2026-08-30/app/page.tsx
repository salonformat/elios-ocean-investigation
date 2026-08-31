'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play, Volume2, VolumeX } from 'lucide-react';

const particles = Array.from({ length: 38 }, (_, index) => ({ id: index, left: (index * 37 + 11) % 100, size: 2 + (index % 5) * 1.4, delay: -((index * 1.7) % 18), duration: 13 + (index % 8) * 2.2 }));
const deepLife = Array.from({ length: 13 }, (_, index) => ({ id: index, left: 7 + ((index * 31) % 86), top: 12 + ((index * 47) % 72), scale: .65 + (index % 5) * .18, delay: (index % 7) * .24 }));

export function Experience({ language }: { language: 'en' | 'de' }) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [movement, setMovement] = useState(0);
  const [stillness, setStillness] = useState(0);
  const [isStill, setIsStill] = useState(false);
  const [soundCaption, setSoundCaption] = useState('');
  const [habitat, setHabitat] = useState({ depth: 600, light: 18, temperature: 7, food: 'falling', movement: 'drift', sense: 'light' });
  const [discovery, setDiscovery] = useState('');
  const [hasRevised, setHasRevised] = useState(false);
  const [discoveryStyle, setDiscoveryStyle] = useState<'midnight' | 'signal' | 'paper'>('midnight');
  const [coralWorld, setCoralWorld] = useState(false);
  const [twilightWorld, setTwilightWorld] = useState(false);
  const [ventWorld, setVentWorld] = useState(false);
  const [twilightInsight, setTwilightInsight] = useState(false);
  const [ventInsight, setVentInsight] = useState(false);
  const [coralFindings, setCoralFindings] = useState<Array<'shelter' | 'community' | 'feeding'>>([]);
  const [activeCoralFinding, setActiveCoralFinding] = useState<'shelter' | 'community' | 'feeding' | null>(null);
  const [previewCreature, setPreviewCreature] = useState({ x: 50, y: 50 });
  const [draggingCreature, setDraggingCreature] = useState(false);
  const [creaturePlaced, setCreaturePlaced] = useState(false);
  const [conclusionChoice, setConclusionChoice] = useState<'yes'|'maybe'|'unlikely'|null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff714d');
  const [adaptations, setAdaptations] = useState<string[]>([]);
  const drawingCanvas = useRef<HTMLCanvasElement | null>(null);
  const frame = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0, time: performance.now() });
  const lastActivity = useRef(performance.now());
  const audio = useRef<{ context: AudioContext; master: GainNode; surface: GainNode; deep: GainNode; creature: GainNode; current: AudioBufferSourceNode; drone: OscillatorNode; signal: OscillatorNode } | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const range = Math.max(window.innerHeight, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(1, window.scrollY / range * 1.8));
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const quietFor = performance.now() - lastActivity.current;
      const inDeep = scrollProgress > .48;
      const value = inDeep ? Math.min(1, Math.max(0, (quietFor - 900) / 3200)) : 0;
      setStillness(value);
      setIsStill(value >= .98);
      setMovement((value) => value * .86);
    }, 120);
    return () => window.clearInterval(timer);
  }, [scrollProgress]);
  useEffect(() => { if (twilightWorld && isStill) setTwilightInsight(true); }, [twilightWorld,isStill]);

  useEffect(() => () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    audio.current?.context.close();
  }, []);

  useEffect(() => {
    if (!audio.current || muted) return;
    const { context, surface, deep, creature, drone, signal } = audio.current;
    const now = context.currentTime;
    surface.gain.setTargetAtTime(.055 * (1 - scrollProgress) * (1 - stillness * .85), now, .7);
    deep.gain.setTargetAtTime(.012 + scrollProgress * .025, now, .9);
    creature.gain.setTargetAtTime(isStill ? .018 : movement > .55 ? .002 : .007, now, .65);
    drone.frequency.setTargetAtTime(49 - scrollProgress * 18, now, 1.2);
    signal.frequency.setTargetAtTime(isStill ? 186 : 122 + scrollProgress * 25, now, .8);
    setSoundCaption(isStill ? '[A faint three-note biological signal answers in the dark]' : scrollProgress > .58 ? '[Distant low movement · water nearly still]' : '[Slow current · filtered surface water]');
  }, [scrollProgress, stillness, isStill, movement, muted]);

  const markActivity = useCallback((intensity = .4) => {
    lastActivity.current = performance.now(); setStillness(0); setIsStill(false);
    setMovement((value) => Math.min(1, Math.max(value, intensity)));
  }, []);

  const followPointer = (event: React.PointerEvent<HTMLElement>) => {
    const now = performance.now();
    const dx = event.clientX - lastPointer.current.x; const dy = event.clientY - lastPointer.current.y;
    const elapsed = Math.max(16, now - lastPointer.current.time);
    const speed = Math.min(1, Math.hypot(dx, dy) / elapsed / 1.25);
    lastPointer.current = { x: event.clientX, y: event.clientY, time: now };
    markActivity(speed);
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setPointer({ x: (event.clientX / window.innerWidth - .5) * 2, y: (event.clientY / window.innerHeight - .5) * 2 }));
  };

  const toggleSound = async () => {
    if (!audio.current) {
      const context = new AudioContext(); const master = context.createGain(); master.gain.value = 0;
      const surface = context.createGain(); const deep = context.createGain(); const creature = context.createGain();
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 480;
      const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
      const data = buffer.getChannelData(0); let previous = 0;
      for (let i = 0; i < data.length; i += 1) { const white = Math.random() * 2 - 1; previous = previous * .985 + white * .015; data[i] = previous * 2.4; }
      const current = context.createBufferSource(); current.buffer = buffer; current.loop = true; current.connect(filter); filter.connect(surface);
      const drone = context.createOscillator(); drone.type = 'sine'; drone.frequency.value = 49; drone.connect(deep);
      const signal = context.createOscillator(); signal.type = 'triangle'; signal.frequency.value = 122; signal.connect(creature);
      surface.connect(master); deep.connect(master); creature.connect(master); master.connect(context.destination);
      surface.gain.value = .04; deep.gain.value = .01; creature.gain.value = .005; current.start(); drone.start(); signal.start();
      audio.current = { context, master, surface, deep, creature, current, drone, signal };
    }
    const nextMuted = !muted; setMuted(nextMuted);
    const { context, master } = audio.current;
    await context.resume(); master.gain.setTargetAtTime(nextMuted ? 0 : .72, context.currentTime, .8);
    setSoundCaption(nextMuted ? '' : '[Slow current · filtered surface water]');
  };

  const depth = Math.round(scrollProgress * 1000); const temperature = (21 - scrollProgress * 17).toFixed(1); const pressure = Math.round(1 + scrollProgress * 100); const light = scrollProgress < .92 ? Math.round((1 - scrollProgress) * 100) : 0;
  const creatureLeft = Math.max(14, Math.min(88, 50 + pointer.x * 36));
  const creatureTop = Math.max(18, Math.min(80, 49 + pointer.y * 31 + scrollProgress * 3));
  const creatureScale = 1 - scrollProgress * .28 + stillness * .1;
  const t = (en:string,de:string) => language === 'de' ? de : en;
  const hypothesisEn = habitat.depth > 750 && habitat.light > 45
    ? 'Bright sunlight cannot reach this depth. If the creature glows here, the light must be produced by a living organism.'
    : habitat.temperature > 14 && habitat.depth > 600
      ? 'Warm water is unusual at this depth. The creature might live near a hydrothermal vent or migrate between water layers.'
      : habitat.food === 'hunt' && habitat.movement === 'drift'
        ? 'Drifting saves energy, but makes moving prey difficult to catch. Sensitive organs or an ambush strategy could bridge that mismatch.'
        : habitat.sense === 'vision' && habitat.light < 12
          ? 'Eyes receive little information in such low light. Detecting vibrations, chemical traces or living light would provide stronger evidence.'
          : 'The selected conditions can work together. The creature’s behaviour and senses offer plausible responses to this habitat.';
  const hypothesisDe = habitat.depth > 750 && habitat.light > 45
    ? 'Helles Sonnenlicht erreicht diese Tiefe nicht. Wenn die Kreatur hier leuchtet, muss dieses Licht von einem Lebewesen erzeugt werden.'
    : habitat.temperature > 14 && habitat.depth > 600
      ? 'Warmes Wasser ist in dieser Tiefe ungewöhnlich. Die Kreatur könnte an einer hydrothermalen Quelle leben oder zwischen Wasserschichten wandern.'
      : habitat.food === 'hunt' && habitat.movement === 'drift'
        ? 'Sich treiben zu lassen spart Energie, erschwert aber das Fangen beweglicher Beute. Empfindliche Sinnesorgane oder eine Lauerstrategie könnten helfen.'
        : habitat.sense === 'vision' && habitat.light < 12
          ? 'Augen liefern bei so wenig Licht kaum Informationen. Vibrationen, chemische Spuren oder lebendiges Licht wären verlässlichere Signale.'
          : 'Die gewählten Bedingungen können zusammenpassen. Verhalten und Sinne der Kreatur sind plausible Antworten auf diesen Lebensraum.';
  const hypothesis = t(hypothesisEn,hypothesisDe);
  const realAnalogue = habitat.food === 'vent' ? t('Yeti crab — survives around chemically powered vent ecosystems','Yeti-Krabbe — lebt in chemisch angetriebenen Ökosystemen an Tiefseequellen') : habitat.sense === 'light' ? t('Lanternfish — produces light and migrates through dark water','Laternenfisch — erzeugt Licht und wandert durch dunkle Wasserschichten') : habitat.sense === 'vibration' ? t('Blind cavefish — reads water movement with pressure-sensitive organs','Blinder Höhlenfisch — liest Wasserbewegungen mit druckempfindlichen Organen') : habitat.depth > 900 ? t('Deep-sea anglerfish — finds prey where sunlight never reaches','Tiefsee-Anglerfisch — findet Beute dort, wo kein Sonnenlicht ankommt') : t('Hatchetfish — uses body shape and light to avoid detection','Beilfisch — nutzt Körperform und Licht, um unentdeckt zu bleiben');
  const discoverCoral = (finding:'shelter'|'community'|'feeding') => { setActiveCoralFinding(finding); setCoralFindings((current)=>current.includes(finding)?current:[...current,finding]); };
  const movePreviewCreature = (event: React.PointerEvent<HTMLElement>) => {
    if (!draggingCreature) return;
    event.stopPropagation(); const bounds = event.currentTarget.getBoundingClientRect();
    setPreviewCreature({ x:Math.max(12,Math.min(88,(event.clientX-bounds.left)/bounds.width*100)), y:Math.max(18,Math.min(82,(event.clientY-bounds.top)/bounds.height*100)) });
  };

  const updateHabitat = (change: Partial<typeof habitat>) => { setHabitat((current) => ({ ...current, ...change })); setHasRevised(true); };

  const drawAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawingCanvas.current; if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    const context = canvas.getContext('2d'); if (!context) return;
    if (!drawing) { context.beginPath(); context.moveTo(x,y); setDrawing(true); canvas.setPointerCapture(event.pointerId); }
    context.lineTo(x,y); context.strokeStyle=drawColor; context.lineWidth=9; context.lineCap='round'; context.lineJoin='round'; context.stroke();
  };
  const stopDrawing = () => setDrawing(false);
  const clearDrawing = () => { const canvas=drawingCanvas.current; const context=canvas?.getContext('2d'); if(canvas&&context) context.clearRect(0,0,canvas.width,canvas.height); };
  const toggleAdaptation = (item:string) => setAdaptations(current=>current.includes(item)?current.filter(value=>value!==item):current.length<3?[...current,item]:current);
  const downloadCreatureCard = () => {
    const source=drawingCanvas.current; if(!source) return;
    const card=document.createElement('canvas'); card.width=1200; card.height=1500;
    const context=card.getContext('2d'); if(!context) return;
    context.fillStyle='#f1dfd3'; context.fillRect(0,0,card.width,card.height);
    context.fillStyle='#2f2038'; context.fillRect(54,54,1092,1392);
    context.fillStyle='#f1d36b'; context.fillRect(54,54,1092,18);
    context.fillStyle='#ffad93'; context.font='600 24px sans-serif'; context.fillText(t('MY OCEAN CREATURE · FIELD CARD','MEIN OZEANWESEN · FORSCHUNGSKARTE'),94,132);
    context.fillStyle='#fff4e8'; context.font='52px Georgia,serif'; context.fillText(t('Designed for survival','Zum Überleben entworfen'),94,205);
    context.fillStyle='#ead8e6'; context.font='24px sans-serif'; context.fillText(t('A creature imagined with evidence from three ocean habitats.','Ein Wesen – erfunden mit Erkenntnissen aus drei Lebensräumen.'),94,252);
    context.fillStyle='#f7eadb'; context.fillRect(94,305,1012,690); context.drawImage(source,94,305,1012,690);
    context.fillStyle='#ffad93'; context.font='600 22px sans-serif'; context.fillText(t('ITS ADAPTATIONS','SEINE ANPASSUNGEN'),94,1060);
    context.fillStyle='#fff4e8'; context.font='31px Georgia,serif'; context.fillText(adaptations.length?adaptations.join(' · '):t('Still being investigated','Wird noch untersucht'),94,1110);
    context.fillStyle='#f1d36b'; context.font='600 22px sans-serif'; context.fillText(t('MY CONCLUSION','MEINE SCHLUSSFOLGERUNG'),94,1190);
    context.fillStyle='#fff4e8'; context.font='29px Georgia,serif';
    const verdict=conclusionChoice==='yes'?t('Yes, if …','Ja, wenn …'):conclusionChoice==='maybe'?t('Maybe, but …','Vielleicht, aber …'):conclusionChoice==='unlikely'?t('Probably not, because …','Wahrscheinlich nicht, weil …'):t('I am still observing.','Ich beobachte noch.');
    context.fillText(verdict,94,1242);
    const reason=discovery||t('Its body and behaviour must fit light, food and the living network around it.','Körper und Verhalten müssen zu Licht, Nahrung und dem Netzwerk des Lebens passen.');
    const words=reason.split(' '); let line=''; let y=1292;
    context.font='23px sans-serif'; context.fillStyle='#dfcfdf';
    words.forEach(word=>{const test=`${line}${word} `;if(context.measureText(test).width>990){context.fillText(line,94,y);line=`${word} `;y+=34}else line=test}); context.fillText(line,94,y);
    const link=document.createElement('a'); link.download='my-ocean-creature-field-card.png'; link.href=card.toDataURL('image/png'); link.click();
  };

  const downloadFieldNote = () => {
    const safeDiscovery = (discovery || 'I am still observing.').replace(/[<>&]/g, (character) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[character] || character));
    const themes = { midnight:{bg:'#061a25',card:'#082b38',ink:'#f3eee2',muted:'#b7ced1',accent:'#70dce8'}, signal:{bg:'#ff8b24',card:'#f3eee2',ink:'#082531',muted:'#48636a',accent:'#087ca7'}, paper:{bg:'#d7e7e5',card:'#f7f1e5',ink:'#082531',muted:'#48636a',accent:'#dc681d'} };
    const theme = themes[discoveryStyle];
    const card = `<!doctype html><html lang="en"><meta charset="utf-8"><title>My Deep Sea Discovery</title><style>body{margin:0;padding:48px;background:${theme.bg};color:${theme.ink};font-family:Arial,sans-serif}.card{max-width:760px;margin:auto;border:1px solid ${theme.accent};padding:52px;background:${theme.card}}small{color:${theme.accent};letter-spacing:.18em;text-transform:uppercase}h1{font:48px Georgia,serif;margin:14px 0 8px}.intro,.footer{color:${theme.muted}}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:${theme.accent};margin:36px 0}.grid div{background:${theme.card};padding:18px}.grid b{display:block;color:${theme.accent};margin-top:8px}.evidence{padding:28px;border-left:3px solid ${theme.accent};font:22px Georgia,serif;line-height:1.45}.reflection{margin-top:30px;padding-top:24px;border-top:1px solid ${theme.accent}}.footer{margin-top:36px;font-size:12px}</style><body><main class="card"><small>The Creature from the Deep · Personal discovery 01</small><h1>My Deep Sea Discovery</h1><p class="intro">A possible world for Elio’s creature, built from ocean conditions and biological evidence.</p><section class="grid"><div>Depth<b>${habitat.depth} m</b></div><div>Available light<b>${habitat.light}%</b></div><div>Temperature<b>${habitat.temperature}°C</b></div><div>Food source<b>${habitat.food}</b></div><div>Movement<b>${habitat.movement}</b></div><div>Sense<b>${habitat.sense}</b></div></section><small>What the evidence suggests</small><p class="evidence">${hypothesis}</p><section class="reflection"><small>What changed in my thinking</small><p>${safeDiscovery}</p></section><p class="footer">I connected an ocean condition to an adaptation — and separated evidence from imagination.</p></main></body></html>`;
    const url = URL.createObjectURL(new Blob([card], { type:'text/html;charset=utf-8' }));
    const link = document.createElement('a'); link.href=url; link.download='my-deep-sea-discovery.html'; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <main className={`${paused ? 'experience is-paused' : 'experience'} ${isStill ? 'life-revealed' : ''}`} onPointerMove={followPointer} onPointerDown={() => markActivity(.8)}>
      <section className="ocean-stage" aria-labelledby="hero-title">
        <div className="collage-layer collage-surface" aria-hidden="true" />
        <div className="ocean-image" aria-hidden="true" style={{ transform: `scale(1.08) translate3d(${pointer.x * -7}px, ${pointer.y * -5}px, 0)`, filter: `brightness(${1 - scrollProgress * .5}) saturate(${1 - scrollProgress * .35})` }} />
        <div className="water-light" aria-hidden="true" style={{ opacity: Math.max(.08, .52 - scrollProgress * .44) }} /><div className="deep-haze" aria-hidden="true" />
        <img className="fauna-layer" src="/fauna-background.png" alt="" aria-hidden="true" style={{ transform:`translate3d(${pointer.x * -5}px,${pointer.y * -3}px,0) scale(1.04)` }}/>
        <img className={`fish-layer ${movement > .5 ? 'scatter' : ''}`} src="/fish-midground.png" alt="" aria-hidden="true" style={{ transform:`translate3d(${pointer.x * -18}px,${pointer.y * -10}px,0) scale(${movement > .5 ? .94 : 1})` }}/>
        <img className="flora-layer" src="/flora-foreground.png" alt="" aria-hidden="true" style={{ transform:`translate3d(${pointer.x * -28}px,${pointer.y * -7}px,0) scale(1.07)` }}/>
        <div className="particles" aria-hidden="true">{particles.map((particle) => <i key={particle.id} style={{ left:`${particle.left}%`, width:particle.size, height:particle.size, animationDelay:`${particle.delay}s`, animationDuration:`${particle.duration}s` }} />)}</div>
        <header className="site-header">
          <a className="wordmark" href="#beginning" aria-label={t('Elio’s Ocean Investigation — beginning','Elios Ozean-Untersuchung — Anfang')}><span className="wordmark-dot" /><span>{t('Elio’s Ocean','Elios Ozean-')}<br />{t('Investigation','Untersuchung')}</span></a>
          <p className="chapter">01 / {t('The Discovery','Die Entdeckung')}</p>
          <div className="controls" aria-label={t('Experience controls','Steuerung')}><a className="language-link" href={language==='en'?'/de':'/en'} aria-label={t('Open German working version','Englische Fassung öffnen')}>{language==='en'?'DE':'EN'}</a><button type="button" onClick={toggleSound} aria-label={muted ? t('Turn sound on','Klang einschalten') : t('Turn sound off','Klang ausschalten')}>{muted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? t('Resume animation','Animation fortsetzen') : t('Pause animation','Animation pausieren')}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button></div>
        </header>
        {soundCaption && <p className="sound-caption" aria-live="polite">{soundCaption}</p>}
        <div id="beginning" className="hero-copy"><p className="eyebrow">{t('A child’s idea becomes an investigation','Aus einer Kinderzeichnung wird eine Forschungsreise')}</p><h1 id="hero-title">{t('Could this creature','Könnte dieses Wesen wirklich')}<br/>{t('live in the ocean?','im Ozean leben?')}</h1><p className="lead">{t('Elio was four when he drew this creature. He was certain it lived in the ocean. So we decided to investigate.','Elio war vier, als er dieses Wesen zeichnete. Für ihn war klar: Es lebt im Ozean. Wir wollten wissen, ob das stimmen könnte.')}</p><div className="journey-goal"><span>{t('Your investigation · 3 stations','Deine Untersuchung · 3 Stationen')}</span><p>{t('Open each glowing habitat in order. Complete its small experiment and collect a clue. Only then can you decide whether Elio’s creature could really live in the ocean — and design your own.','Öffne nacheinander alle drei leuchtenden Lebensräume. Führe in jeder Station das kleine Experiment durch und sammle eine Erkenntnis. Erst danach entscheidest du, ob Elios Wesen wirklich im Ozean leben könnte – und entwirfst dein eigenes.')}</p></div></div>
        <a className="descend" href="#descent"><span>{t('Descend','Abtauchen')}</span><ArrowDown size={18}/></a>
        <button className="world-portal" type="button" onClick={()=>setCoralWorld(true)}><small>{t('Start here · Station','Hier beginnen · Station')} 01 / 03</small><span>{t('Explore beneath','Tauche mit dem Wesen unter')}<br/>{t('the coral','die Koralle')}</span><b>↗</b></button>
      </section>

      <div className={`creature-guide ${movement > .52 ? 'is-wary' : ''} ${isStill ? 'is-near' : ''}`} style={{ left:`${creatureLeft}%`, top:`${creatureTop}%`, transform:`translate(-50%,-50%) scale(${creatureScale}) rotate(${pointer.x * 4}deg)`, opacity: scrollProgress > .7 ? 0 : 1, visibility:scrollProgress > .78?'hidden':'visible' }}>
        <div className="creature-glow" style={{ opacity:.35 + stillness * .65 }} aria-hidden="true"/><img className="creature" src="/elios-wesen.png" alt="Elio’s orange-and-blue drawing of an imaginary creature"/>
        <div className="creature-signals" aria-hidden="true"><i/><i/><i/></div>
      </div>

      <section id="descent" className="descent-zone" aria-labelledby="descent-title">
        <div className="collage-layer collage-descent" aria-hidden="true" />
        <div className="layers layer-sun"/><div className="layers layer-mid"/><div className="layers layer-deep"/>
        <div className="descent-copy"><p className="eyebrow">{t('Descend','Tauch tiefer')}</p><h2 id="descent-title">{t('Light fades.','Licht verschwindet.')}<br/>{t('Pressure rises.','Der Druck wächst.')}<br/><em>{t('Life adapts.','Leben findet Wege.')}</em></h2><p>{t('Move slowly. Notice what changes.','Bewege dich langsam und schau, wie sich die Welt verändert.')}</p></div>
        <div className="science-marks" aria-hidden="true"><span style={{top:'12%'}}>0 m · {t('Sunlight zone','Lichtzone')}</span><span style={{top:'48%'}}>200 m · {t('Twilight zone','Dämmerzone')}</span><span style={{top:'82%'}}>1.000 m · {t('Midnight zone','Dunkelzone')}</span></div>
        <button className="habitat-portal twilight-portal" type="button" disabled={!coralFindings.length} onClick={()=>setTwilightWorld(true)}><small>02 / {coralFindings.length?t('Next chapter','Nächstes Kapitel'):t('Complete the coral first','Erst die Koralle erkunden')}</small><strong>{t('Enter the twilight zone','In die Dämmerzone')}</strong><span>↗</span></button>
      </section>

      <section id="encounter" className="encounter" aria-labelledby="encounter-title">
        <div className="collage-layer collage-deep" aria-hidden="true" />
        <div className="encounter-current" aria-hidden="true" />
        <div className="encounter-grid">
          <div className="encounter-index"><span>02</span><small>{t('The Encounter','Die Begegnung')}</small></div>
          <div className="encounter-copy"><p className="eyebrow">{t('Stillness reveals life','Wer still wird, sieht mehr')}</p><h2 id="encounter-title">{t('The dark is not empty.','Im Dunkeln wird anderes sichtbar.')}</h2><p>{t('Become still. Let hidden signals appear.','Bleib still. Warte ab, wer sich zeigt.')}</p><a className="text-link" href="#discover">{t('Build a habitat','Baue eine Welt für das Wesen')} <span>↘</span></a></div>
        </div>
        <button className="habitat-portal vent-portal" type="button" disabled={!twilightInsight} onClick={()=>setVentWorld(true)}><small>03 / {twilightInsight?t('Final chapter','Letztes Kapitel'):t('Complete the twilight zone first','Erst die Dämmerzone erkunden')}</small><strong>{t('Find life without sunlight','Finde Leben ohne Sonnenlicht')}</strong><span>↗</span></button>
        <section id="discover" className="conclusion" aria-labelledby="conclusion-title">
          <p className="eyebrow">{t('Three habitats. Three clues.','Drei Lebensräume. Drei Erkenntnisse.')}</p>
          <h2 id="conclusion-title">{t('Could Elio’s creature live in the ocean?','Könnte Elios Wesen im Ozean leben?')}</h2>
          <div className="three-clues"><article className={coralFindings.length?'complete':''}><span>01</span><h3>{t('Relationships','Beziehungen')}</h3><p>{t('An animal is part of a network.','Ein Tier ist Teil eines Netzwerks.')}</p></article><article className={twilightInsight?'complete':''}><span>02</span><h3>{t('Perception','Wahrnehmung')}</h3><p>{t('Less light requires different senses.','Weniger Licht erfordert andere Sinne.')}</p></article><article className={ventInsight?'complete':''}><span>03</span><h3>{t('Energy','Energie')}</h3><p>{t('Life can begin without sunlight.','Leben kann ohne Sonnenlicht beginnen.')}</p></article></div>
          <div className="conclusion-choice" role="group" aria-label={t('Choose your conclusion','Wähle deine Schlussfolgerung')}><button className={conclusionChoice==='yes'?'selected':''} onClick={()=>setConclusionChoice('yes')}><b>{t('Yes, if …','Ja, wenn …')}</b></button><button className={conclusionChoice==='maybe'?'selected':''} onClick={()=>setConclusionChoice('maybe')}><b>{t('Maybe, but …','Vielleicht, aber …')}</b></button><button className={conclusionChoice==='unlikely'?'selected':''} onClick={()=>setConclusionChoice('unlikely')}><b>{t('Probably not, because …','Wahrscheinlich nicht, weil …')}</b></button></div>
          {conclusionChoice&&<label className="conclusion-reason"><span>{t('Use one clue to explain your answer.','Nutze eine Erkenntnis, um deine Antwort zu begründen.')}</span><textarea value={discovery} onChange={(event)=>setDiscovery(event.target.value)} placeholder={t('I think this because …','Ich denke das, weil …')} rows={3}/></label>}
          <section className="creature-studio" aria-labelledby="studio-title">
            <div className="studio-copy"><p className="eyebrow">{t('Your research becomes a creature','Aus deinen Erkenntnissen wird ein Wesen')}</p><h3 id="studio-title">{t('Invent an ocean animal.','Erfinde dein eigenes Ozeanwesen.')}</h3><p>{t('Draw its body, then choose up to three adaptations. Each choice should answer something you discovered about relationships, perception or energy.','Zeichne seinen Körper und wähle bis zu drei Anpassungen. Jede Entscheidung soll auf eine deiner Erkenntnisse über Beziehungen, Wahrnehmung oder Energie antworten.')}</p><div className="adaptation-list">{[
              t('Hiding place','Versteck'),t('Partner species','Partnerart'),t('Living light','Lebendiges Licht'),t('Senses vibrations','Spürt Schwingungen'),t('Chemical energy','Chemische Energie'),t('Saves energy','Spart Energie')
            ].map(item=><button type="button" key={item} className={adaptations.includes(item)?'selected':''} onClick={()=>toggleAdaptation(item)}>{item}</button>)}</div></div>
            <div className="drawing-board"><div className="drawing-tools" aria-label={t('Drawing tools','Zeichenwerkzeuge')}><span>{t('Draw here','Hier zeichnen')}</span>{['#ff714d','#168bb4','#f2a3bd','#f1d36b','#f7efe0'].map(color=><button key={color} type="button" aria-label={`${t('Choose colour','Farbe wählen')} ${color}`} className={drawColor===color?'active':''} style={{background:color}} onClick={()=>setDrawColor(color)}/>)}<button className="clear-drawing" type="button" onClick={clearDrawing}>{t('Clear','Löschen')}</button></div><canvas ref={drawingCanvas} width="760" height="520" onPointerDown={drawAt} onPointerMove={(event)=>drawing&&drawAt(event)} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} aria-label={t('Canvas for drawing your own ocean creature','Zeichenfläche für dein eigenes Ozeanwesen')}/><p>{t('Your creature is not just imaginary: its features are hypotheses about survival.','Dein Wesen ist nicht nur erfunden: Seine Merkmale sind Vermutungen darüber, wie es überleben könnte.')}</p><button className="download-creature" type="button" onClick={downloadCreatureCard}>{t('Keep my creature + evidence','Mein Wesen + Erkenntnisse mitnehmen')} <span>↓</span></button></div>
          </section>
        </section>
      </section>
      {coralWorld && <section className="coral-world" aria-label="A hidden habitat beneath the coral">
        <div className="coral-backdrop" aria-hidden="true"/>
        <div className="coral-light" aria-hidden="true"/>
        <header><div><small>Secret habitat / 01</small><strong>Beneath the coral</strong></div><button type="button" onClick={()=>{setCoralWorld(false);setActiveCoralFinding(null)}} aria-label="Return to the open ocean">Return to the ocean ×</button></header>
        <div className="coral-intro"><p className="eyebrow">{t('Chapter 1 · Relationships','Kapitel 1 · Beziehungen')}</p><h2>{t('No animal lives','Kein Tier lebt')}<br/>{t('on its own.','für sich allein.')}</h2><p>{t('Follow Elio’s creature into the coral shelter.','Folge Elios Wesen in das Versteck unter der Koralle.')}</p></div>
        <img className="coral-creature" src="/elios-wesen.png" alt="Elio’s creature exploring beneath the coral" style={{left:`${(activeCoralFinding==='shelter'?26:activeCoralFinding==='community'?72:activeCoralFinding==='feeding'?68:50)+pointer.x*13}%`,top:`${(activeCoralFinding==='shelter'?66:activeCoralFinding==='community'?35:activeCoralFinding==='feeding'?68:50)+pointer.y*11}%`,transform:`translate(-50%,-50%) rotate(${pointer.x*4}deg)`}}/>
        <button className="coral-hotspot community" type="button" onClick={()=>discoverCoral('community')} aria-label={t('Follow the creature into shelter','Dem Wesen ins Versteck folgen')}><i/><span>{t('Follow into shelter','Ins Versteck folgen')}</span></button>
        {activeCoralFinding && <aside className="coral-discovery" aria-live="polite"><small>{t('Elio’s creature discovered','Das hat Elios Wesen entdeckt')}</small><h3>{t('A habitat is a network.','Ein Lebensraum ist ein Netzwerk.')}</h3><p>{t('Coral branches offer shelter, carry food in the current and connect many different lives.','Korallen bieten Schutz, bringen Nahrung mit der Strömung und verbinden viele verschiedene Lebewesen.')}</p></aside>}
        <div className="coral-instruction"><span>{coralFindings.length?t('Clue found','Erkenntnis gefunden'):t('One action','Eine Handlung')}</span><small>{coralFindings.length?t('Relationships shape survival.','Beziehungen bestimmen das Überleben.'):t('Follow the glowing signal.','Folge dem leuchtenden Signal.')}</small></div>
      </section>}
      {twilightWorld && <section className="hidden-world twilight-world" aria-label={t('The ocean twilight zone','Die Dämmerzone des Ozeans')}><div className="world-background"/><header><div><small>02 / {t('Hidden habitat','Verborgener Lebensraum')}</small><strong>{t('The twilight zone','Die Dämmerzone')}</strong></div><button type="button" onClick={()=>setTwilightWorld(false)}>{t('Return to the descent','Zurück zum Abstieg')} ×</button></header><div className="world-copy"><p className="eyebrow">{t('Chapter 2 · Perception','Kapitel 2 · Wahrnehmung')}</p><h2>{t('How do you find anything here?','Wie findet man hier überhaupt etwas?')}</h2><p>{t('Stop moving. Let living light answer.','Bewege dich nicht. Warte, bis lebendiges Licht antwortet.')}</p><div className="world-stillness"><i style={{width:`${stillness*100}%`}}/><span>{t('Stay still','Bleib still')}</span></div></div><img className="world-creature" src="/elios-wesen.png" alt="" style={{left:`${50+pointer.x*30}%`,top:`${52+pointer.y*24}%`}}/>{twilightInsight&&<aside className="creature-insight"><small>{t('Elio’s creature discovered','Das hat Elios Wesen entdeckt')}</small><h3>{t('Less light requires different senses.','Weniger Licht erfordert andere Sinne.')}</h3><p>{t('Its blue lines might sense living light — or produce it.','Seine blauen Linien könnten lebendiges Licht wahrnehmen – oder selbst erzeugen.')}</p></aside>}</section>}
      {ventWorld && <section className="hidden-world vent-world" aria-label={t('A hydrothermal vent ecosystem','Ein Ökosystem an einer Tiefseequelle')}><div className="world-background"/><header><div><small>03 / {t('Hidden habitat','Verborgener Lebensraum')}</small><strong>{t('Life without sunlight','Leben ohne Sonnenlicht')}</strong></div><button type="button" onClick={()=>setVentWorld(false)}>{t('Return to the deep','Zurück in die Tiefe')} ×</button></header><div className="world-copy"><p className="eyebrow">{t('Chapter 3 · Energy','Kapitel 3 · Energie')}</p><h2>{t('What feeds a world with no sun?','Wovon lebt eine Welt ohne Sonne?')}</h2><p>{t('Follow the pale mineral plume to its living edge.','Folge der hellen Mineralwolke bis dorthin, wo Leben beginnt.')}</p><button type="button" onClick={()=>setVentInsight(true)}>{t('Follow the mineral plume','Der Mineralwolke folgen')}</button></div><img className="world-creature" src="/elios-wesen.png" alt="" style={{left:`${52+pointer.x*28}%`,top:`${50+pointer.y*22}%`}}/>{ventInsight&&<aside className="creature-insight"><small>{t('Elio’s creature discovered','Das hat Elios Wesen entdeckt')}</small><h3>{t('Life can begin without sunlight.','Leben kann ohne Sonnenlicht beginnen.')}</h3><p>{t('Bacteria turn chemicals into energy. Animals at the vent depend on that first step.','Bakterien machen aus chemischen Stoffen nutzbare Energie. Die Tiere an der Quelle hängen von diesem ersten Schritt ab.')}</p></aside>}</section>}
    </main>
  );
}

export default function Home() {
  return <Experience language="de" />;
}
