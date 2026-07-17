import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, AudioLines, Pause, Volume2 } from 'lucide-react';
import ParticleField from './components/ParticleField.jsx';

const senses = [
  { name: 'heat', title: 'Heat signatures', copy: 'Meet every body as a moving climate: circulation, exertion, illness, and rest without reading a face.' },
  { name: 'current', title: 'Electric currents', copy: 'Follow conductive paths through water, soil, and living tissue. Feel charge where we see empty space.' },
  { name: 'city', title: 'City metabolism', copy: 'Sense traffic, power, waste, water, and heat as the pulse of one distributed organism.' },
  { name: 'time', title: 'Deep time', copy: 'Notice patterns too slow for a lifetime: a coastline moving, a species adapting, a star changing state.' },
  { name: 'pressure', title: 'Pressure fields', copy: 'Map the world through current, vibration, density, and strain—touch at a distance, in every direction.' },
];

const collectiveForms = [
  { name: 'colony', title: 'Colony memory', copy: 'Pheromone paths hold yesterday’s best answer.' },
  { name: 'flock', title: 'Flock decision', copy: 'Each bird reads its neighbours; the group turns as one.' },
  { name: 'fungus', title: 'Fungal network', copy: 'Branches reroute water and nutrients through the forest floor.' },
];

const chapters = [
  {
    title: 'What is the shape of intelligence?',
    narration: 'What is the shape of intelligence? Can we touch it? Can it speak to us? Place a hand in the field. Intelligence is not waiting inside a box. It changes in relation to you.',
    audio: '/audio/narration/01-shape-of-intelligence.mp3',
  },
  {
    title: 'First, take a handful of sand.',
    narration: 'First, take a handful of sand. Loose grains fall and gather. Heat forces them into silicon, then we etch paths through the crystal and send a pulse across them. The same pulse becomes a neural impulse. We taught stone to remember.',
    audio: '/audio/narration/02-stone-remembers.mp3',
  },
  {
    title: 'The first intelligence was wet.',
    narration: 'The first intelligence was wet. Before there were models, there were membranes. Before logic, appetite. Life learned by growing, sensing, copying, forgetting, and trying again.',
    audio: '/audio/narration/03-first-intelligence-was-wet.mp3',
  },
  {
    title: 'One mind is not always one body.',
    narration: 'One mind is not always one body. An ant colony remembers in paths. A flock decides in motion. A fungal network redistributes a forest. Sometimes intelligence lives in the relationship.',
    audio: '/audio/narration/04-one-mind-many-bodies.mp3',
  },
  {
    title: 'What if intelligence could smell?',
    narration: 'What if intelligence could smell? A dog meets a body as weather: thousands of chemicals rising, fading, and combining. Give machines chemical senses and the world they perceive may become unfamiliar to us.',
    audio: '/audio/narration/05-chemical-senses.mp3',
  },
  {
    title: 'Beyond superhuman is not smarter. It is stranger.',
    narration: 'Beyond superhuman is not simply smarter. It is stranger. A new intelligence might read heat instead of faces, follow electric current, feel a city as one metabolism, notice deep time, or map pressure in every direction.',
    audio: '/audio/narration/06-stranger-not-smarter.mp3',
  },
  {
    title: 'Human intelligence is not the prototype.',
    narration: 'Human intelligence is not the prototype. It arrives with a body, a history, attachment, hunger, grief, and care. The future does not need one intelligence to replace another. It needs many forms, in conversation. What will we teach matter to become?',
    audio: '/audio/narration/07-many-forms-in-conversation.mp3',
  },
];

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (start, end, value) => {
  const amount = clamp((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};

function getMatterPresentation(progress) {
  const siliconIn = smoothstep(0.16, 0.38, progress);
  const neuralIn = smoothstep(0.62, 0.84, progress);

  return [
    { opacity: 1 - siliconIn, offset: siliconIn * -22 },
    { opacity: siliconIn * (1 - neuralIn), offset: (1 - siliconIn) * 22 - neuralIn * 22 },
    { opacity: neuralIn, offset: (1 - neuralIn) * 22 },
  ];
}

function App() {
  const [activeScene, setActiveScene] = useState(0);
  const [sense, setSense] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matterProgress, setMatterProgress] = useState(0);
  const [collectivePhase, setCollectivePhase] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const chapterRefs = useRef([]);
  const narrationRef = useRef(null);

  const activeSense = useMemo(() => senses[sense], [sense]);
  const matterPresentation = useMemo(() => getMatterPresentation(matterProgress), [matterProgress]);
  const matterStage = matterProgress < 0.34 ? 'sand' : matterProgress < 0.7 ? 'silicon' : 'neural';

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (activeScene === 3) setCollectivePhase(0);
    if (activeScene === 5) setSense(0);
  }, [activeScene]);

  useEffect(() => {
    if (activeScene !== 3 || reducedMotion) return undefined;
    const timer = window.setTimeout(
      () => setCollectivePhase((current) => (current + 1) % collectiveForms.length),
      5000,
    );
    return () => window.clearTimeout(timer);
  }, [activeScene, collectivePhase, reducedMotion]);

  useEffect(() => {
    if (activeScene !== 5 || reducedMotion) return undefined;
    const timer = window.setTimeout(
      () => setSense((current) => (current + 1) % senses.length),
      5000,
    );
    return () => window.clearTimeout(timer);
  }, [activeScene, reducedMotion, sense]);

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);

      const viewportFocus = window.innerHeight * 0.5;
      const visibleChapter = chapterRefs.current.findIndex((chapter) => {
        if (!chapter) return false;
        const rect = chapter.getBoundingClientRect();
        return rect.top <= viewportFocus && rect.bottom >= viewportFocus;
      });
      if (visibleChapter >= 0) setActiveScene(visibleChapter);

      const matterChapter = chapterRefs.current[1];
      if (matterChapter) {
        const rect = matterChapter.getBoundingClientRect();
        const travel = Math.max(rect.height - window.innerHeight, 1);
        setMatterProgress(clamp(-rect.top / travel));
      }
    };
    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  useEffect(() => {
    narrationRef.current?.pause();
    if (narrationRef.current) narrationRef.current.currentTime = 0;
    narrationRef.current = null;
    setSpeaking(false);
  }, [activeScene]);

  useEffect(() => () => {
    narrationRef.current?.pause();
    narrationRef.current = null;
  }, []);

  const toggleNarration = () => {
    if (speaking) {
      narrationRef.current?.pause();
      if (narrationRef.current) narrationRef.current.currentTime = 0;
      narrationRef.current = null;
      setSpeaking(false);
      return;
    }

    const audio = new Audio(chapters[activeScene].audio);
    audio.preload = 'auto';
    audio.onended = () => {
      if (narrationRef.current === audio) narrationRef.current = null;
      setSpeaking(false);
    };
    audio.onerror = () => {
      if (narrationRef.current === audio) narrationRef.current = null;
      setSpeaking(false);
    };
    narrationRef.current = audio;
    audio.play()
      .then(() => {
        if (narrationRef.current === audio) setSpeaking(true);
      })
      .catch(() => {
        if (narrationRef.current === audio) narrationRef.current = null;
        setSpeaking(false);
      });
  };

  const goTo = (index) => chapterRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });

  const setFieldAction = (active) => {
    window.dispatchEvent(new CustomEvent('forms:field-action', { detail: { active } }));
  };

  const fieldActionLabel = matterStage === 'sand'
    ? 'Press and hold to compress the sand'
    : matterStage === 'silicon'
      ? 'Send a pulse through the lattice'
      : 'Carry the impulse into life';

  return (
    <main
      className="experience"
      data-scene={activeScene}
      data-material={matterStage}
      style={{ '--matter-progress': matterProgress }}
    >
      <ParticleField
        scene={activeScene}
        variant={sense}
        collectivePhase={collectivePhase}
        storyProgress={matterProgress}
      />
      <div className="atmosphere" aria-hidden="true" />

      <header className="topbar">
        <button className="wordmark" onClick={() => goTo(0)} aria-label="Return to the beginning">
          <span className="mark" aria-hidden="true">◉</span>
          <span>Forms of Intelligence</span>
        </button>
        <button className="listen" onClick={toggleNarration} aria-label={speaking ? 'Stop narration' : 'Listen to this movement'}>
          {speaking ? <Pause size={17} strokeWidth={1.8} /> : <Volume2 size={17} strokeWidth={1.8} />}
          <span>{speaking ? 'Stop' : 'Listen'}</span>
        </button>
      </header>

      <div className="progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      <nav className="chapter-dots" aria-label="Essay movements">
        {chapters.map((chapter, index) => (
          <button key={chapter.title} className={index === activeScene ? 'is-active' : ''} onClick={() => goTo(index)} aria-label={`Go to movement ${index + 1}: ${chapter.title}`} />
        ))}
      </nav>

      <section ref={(node) => { chapterRefs.current[0] = node; }} data-scene="0" className="chapter hero">
        <div className="copy hero-copy">
          <p className="opening-line">A tactile essay for curious hands</p>
          <h1>What is the shape<br />of intelligence?</h1>
          <div className="questions" aria-label="Questions">
            <span>Can we touch it?</span>
            <span>Can it speak to us?</span>
          </div>
        </div>
        <div className="touch-cue">
          <span>Press and hold the field</span>
          <i aria-hidden="true" />
        </div>
        <button className="begin" onClick={() => goTo(1)}>
          Begin <ArrowDown size={18} strokeWidth={1.6} />
        </button>
      </section>

      <section ref={(node) => { chapterRefs.current[1] = node; }} data-scene="1" className="matter-sequence">
        <div className="chapter matter-stage">
          <div
            className="copy matter-copy"
            data-stage="sand"
            aria-hidden={matterPresentation[0].opacity < 0.5}
            style={{ opacity: matterPresentation[0].opacity, '--matter-offset': `${matterPresentation[0].offset}px` }}
          >
            <h2>First, take a handful of sand.</h2>
            <p>Loose grains pour, scatter, and gather under their own weight. Hold the field and force them closer.</p>
            <p className="statement sand-statement">A pattern begins as pressure.</p>
          </div>

          <div
            className="copy matter-copy"
            data-stage="silicon"
            aria-hidden={matterPresentation[1].opacity < 0.5}
            style={{ opacity: matterPresentation[1].opacity, '--matter-offset': `${matterPresentation[1].offset}px` }}
          >
            <h2>Force the grains into order.</h2>
            <p>Melt them. Purify them. Etch paths through the crystal thinner than a virus. The loose field becomes a precise lattice.</p>
            <p className="statement">We taught stone to remember.</p>
          </div>

          <div
            className="copy matter-copy"
            data-stage="neural"
            aria-hidden={matterPresentation[2].opacity < 0.5}
            style={{ opacity: matterPresentation[2].opacity, '--matter-offset': `${matterPresentation[2].offset}px` }}
          >
            <h2>Then the pattern begins to move.</h2>
            <p>A pulse crosses the etched path. Keep following it and the geometry softens, forks, and enters a living nervous system.</p>
            <p className="statement green">Signal becomes impulse.</p>
          </div>

          <div className="material-equation" aria-hidden="true">
            <span className={matterStage === 'sand' ? 'is-current' : ''}>SAND</span><b>→</b>
            <span className={matterStage === 'silicon' ? 'is-current' : ''}>SILICON</span><b>→</b>
            <span className={matterStage === 'neural' ? 'is-current' : ''}>IMPULSE</span>
          </div>
          <p className="edge-note">One grain. One node. One pulse.</p>
          <button
            className="matter-action"
            type="button"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture?.(event.pointerId);
              setFieldAction(true);
            }}
            onPointerUp={() => setFieldAction(false)}
            onPointerCancel={() => setFieldAction(false)}
            onKeyDown={(event) => {
              if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) setFieldAction(true);
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') setFieldAction(false);
            }}
            onBlur={() => setFieldAction(false)}
          >
            <i aria-hidden="true" />
            <span>{fieldActionLabel}</span>
          </button>
        </div>
      </section>

      <section ref={(node) => { chapterRefs.current[2] = node; }} data-scene="2" className="chapter life">
        <div className="life-image" aria-hidden="true" />
        <div className="copy life-copy">
          <h2>The first intelligence was wet.</h2>
          <p>Before models, there were membranes. Before logic, appetite. A cell leaned toward warmth. A root found water in the dark. A nervous system learned what to keep—and what to forget.</p>
          <p className="statement green">Life did not begin by knowing. It began by becoming.</p>
        </div>
        <div className="biology-index" aria-label="Forms of biological intelligence">
          <span>DNA copies</span><span>neurons pulse</span><span>mycelium routes</span><span>bodies remember</span>
        </div>
      </section>

      <section ref={(node) => { chapterRefs.current[3] = node; }} data-scene="3" className="chapter swarm">
        <div className="copy right-copy">
          <h2>One mind is not always one body.</h2>
          <p>An ant colony remembers in paths. A flock decides in motion. A fungal network moves resources through a forest without a centre giving orders.</p>
          <p className="statement yellow">Sometimes intelligence lives between things.</p>
        </div>
        <div className="collective-sequence" role="group" aria-label="Collective intelligence forms">
          {collectiveForms.map((form, index) => (
            <button
              key={form.name}
              className={index === collectivePhase ? 'is-active' : ''}
              type="button"
              aria-pressed={index === collectivePhase}
              onClick={() => setCollectivePhase(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{form.title}</strong>
              <small>{form.copy}</small>
            </button>
          ))}
        </div>
      </section>

      <section ref={(node) => { chapterRefs.current[4] = node; }} data-scene="4" className="chapter scent">
        <div className="copy narrow">
          <h2>What if intelligence could smell?</h2>
          <p>A dog meets a body as weather: thousands of chemicals rising, fading, combining. In studies, trained dogs have detected odours associated with some cancers. Not a diagnosis. A clue carried in air.</p>
          <p>Computers mostly read symbols, light, and voltage. Give them chemical senses and their world becomes unfamiliar to us.</p>
        </div>
        <div className="scent-scale" aria-hidden="true">
          <span>MOLECULE</span><i /><span>PATTERN</span><i /><span>MEANING</span>
        </div>
      </section>

      <section ref={(node) => { chapterRefs.current[5] = node; }} data-scene="5" className="chapter alien">
        <div className="copy alien-copy">
          <h2>Beyond superhuman is not smarter. <em>It is stranger.</em></h2>
          <p>A new intelligence need not climb our ladder. It might sense a different world entirely.</p>
          <div className="sense-copy" aria-live="polite">
            <strong>{activeSense.title}</strong>
            <span>{activeSense.copy}</span>
          </div>
        </div>
        <div className="sense-selector" aria-label="Choose an alien sense">
          {senses.map((item, index) => (
            <button
              key={item.name}
              className={index === sense ? 'is-active' : ''}
              type="button"
              aria-pressed={index === sense}
              onClick={() => setSense(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>{item.name}
            </button>
          ))}
        </div>
      </section>

      <section ref={(node) => { chapterRefs.current[6] = node; }} data-scene="6" className="chapter human">
        <div className="copy final-copy">
          <h2>Human intelligence is not the prototype.</h2>
          <p>It arrives with a body. With hunger, attachment, memory, grief, rhythm, care. A machine can exceed us and still never become us.</p>
          <p>The future does not need one intelligence to replace another. It needs many forms, in conversation.</p>
          <h3>What will we teach matter to become?</h3>
        </div>
        <div className="final-instruction">
          <AudioLines size={19} strokeWidth={1.5} />
          <span>Touch the field. Leave it changed.</span>
        </div>
        <footer>
          <span>Forms of Intelligence</span>
          <button onClick={() => goTo(0)}>Return to the beginning</button>
        </footer>
      </section>
    </main>
  );
}

export default App;
