import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, MapPin, Building2, ShieldCheck, ChevronDown,
  Sparkles, ArrowRight, TrendingUp, Star, Users,
  CheckCircle2, Zap, ArrowUpRight, Layers,
} from 'lucide-react';
import './Home.css';

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */
const CITIES = ['Colombo', 'Kandy', 'Galle', 'Matara', 'Jaffna', 'Negombo', 'Kurunegala'];

const CITY_DATA = [
  { name:'Colombo', count:'340+', img:'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=900&q=80' },
  { name:'Kandy',   count:'180+', img:'https://images.unsplash.com/photo-1582972236019-ea4af5ffe587?auto=format&fit=crop&w=700&q=80' },
  { name:'Galle',   count:'120+', img:'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=700&q=80' },
  { name:'Negombo', count:'95+',  img:'https://images.unsplash.com/photo-1606918901285-3bb0a15af1ca?auto=format&fit=crop&w=700&q=80' },
  { name:'Jaffna',  count:'60+',  img:'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=700&q=80' },
];

const CATEGORIES = [
  { key: 'boarding', label: 'Boarding',  icon: '🏠' },
  { key: 'vehicle',  label: 'Vehicles',  icon: '🚗' },
  { key: 'land',     label: 'Land',      icon: '🌿' },
];

const WHY_CARDS = [
  {
    icon: <Layers size={22}/>,
    title: '3 Categories, One Platform',
    body: 'Find boarding houses, vehicles for rent, and land plots all in one place — Sri Lanka\'s most complete property marketplace.',
    cta: 'Explore listings',
  },
  {
    icon: <MapPin size={22}/>,
    title: 'Interactive Map Search',
    body: 'See every listing pinned on a live map. Switch between list and map views, zoom to a city, click any marker to preview instantly.',
    cta: 'Open map view',
  },
  {
    icon: <ShieldCheck size={22}/>,
    title: 'Verified & Commission-Free',
    body: 'No commission, no hidden charges. Every listing is reviewed by our team. Connect directly with owners — we just make the introduction.',
    cta: 'How it works',
  },
];

const TRUST_ITEMS = [
  { icon:<Star size={18}/>,         title:'4.9 / 5 Rating',   desc:'Across 2,400+ verified reviews from tenants & buyers' },
  { icon:<CheckCircle2 size={18}/>, title:'Verified Owners',  desc:'Every landlord and seller is ID-checked before listing' },
  { icon:<Zap size={18}/>,          title:'Instant Contact',   desc:'Reach owners directly via WhatsApp the same day' },
  { icon:<Users size={18}/>,        title:'12,000+ Placed',   desc:'Students, expats & professionals trust our platform' },
];

const PROP_CARDS = [
  {
    size: 'lg',
    img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    badge: 'Boarding',
    fav: '♡',
    title: 'Modern Room · Colombo 7',
    city: 'Borella, Colombo',
    price: 'LKR 28,000',
    period: '/mo',
    chips: ['WiFi', 'A/C', 'Meals'],
  },
  {
    size: 'sm',
    img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
    badge: 'Vehicle',
    fav: '♡',
    title: 'Toyota Vitz 2018 · Kandy',
    city: 'Peradeniya, Kandy',
    price: 'LKR 42,000',
    period: '/mo',
    chips: ['A/C', 'Auto'],
  },
];

const WORDS = ['Perfect', 'Ideal', 'Dream', 'Right'];

/* ══════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════ */
function useWordRotator(words, ms = 2800) {
  const [state, setState] = useState({ curr: 0, prev: -1, phase: 'stable' });
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => ({ curr: (s.curr + 1) % words.length, prev: s.curr, phase: 'transitioning' }));
      setTimeout(() => setState(s => ({ ...s, phase: 'stable' })), 600);
    }, ms);
    return () => clearInterval(t);
  }, [words.length, ms]);
  return state;
}

function useReveal() {
  return useCallback((el) => {
    if (!el || el._rvAttached) return;
    el._rvAttached = true;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('vis'); io.disconnect(); } },
      { threshold: 0.10 }
    );
    io.observe(el);
  }, []);
}

function useCounter(target, dur = 1500) {
  const [val, setVal] = useState(0);
  const fired = useRef(false);
  const ref = useCallback((el) => {
    if (!el || fired.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      fired.current = true; io.disconnect();
      let t0 = null;
      const tick = (ts) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / dur, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    io.observe(el);
  }, [target, dur]);
  return { val, ref };
}

function useParallax() {
  const ref = useRef(null);
  useEffect(() => {
    const fn = () => {
      if (ref.current)
        ref.current.style.transform = `translateY(${window.scrollY * 0.18}px) scale(1.06)`;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return ref;
}

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════ */
function StatCounter({ target, suffix, label, delay }) {
  const { val, ref } = useCounter(target);
  const rv = useReveal();
  return (
    <div className="stat rv" style={{ transitionDelay: delay }} ref={(el) => { rv(el); ref(el); }}>
      <span className="stat__n">{val.toLocaleString()}{suffix}</span>
      <span className="stat__l">{label}</span>
    </div>
  );
}

function WordRotator({ words }) {
  const { curr, prev, phase } = useWordRotator(words);
  const containerRef = useRef(null);
  const [width, setWidth] = useState('auto');

  useEffect(() => {
    if (!containerRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = 'italic 700 clamp(38px,5.5vw,76px)/1 "Cormorant Garamond",Georgia,serif';
    const maxW = Math.max(...words.map(w => ctx.measureText(w).width));
    setWidth(`${Math.ceil(maxW) + 6}px`);
  }, [words]);

  return (
    <span
      ref={containerRef}
      style={{
        display:'inline-block', position:'relative', overflow:'hidden',
        height:'1.04em', verticalAlign:'bottom', minWidth: width,
      }}
    >
      {words.map((w, i) => {
        let cls = 'entering';
        if (i === curr) cls = 'current';
        else if (i === prev && phase === 'transitioning') cls = 'leaving';
        return <span key={w} className={`h-rotator__word ${cls}`}>{w}</span>;
      })}
    </span>
  );
}

function PropCard({ card }) {
  return (
    <div className={`prop-card prop-card--${card.size}`}>
      <div className="prop-card__img">
        <img src={card.img} alt={card.title} />
        <div className="prop-card__img-overlay" />
        <span className="prop-badge">{card.badge}</span>
        <span className="prop-fav">{card.fav}</span>
      </div>
      <div className="prop-card__body">
        <div className="prop-card__title">{card.title}</div>
        <div className="prop-meta"><MapPin size={11} />{card.city}</div>
        <div className="prop-footer">
          <div className="prop-price">{card.price} <span>{card.period}</span></div>
          <div className="prop-chips">
            {card.chips.map(c => <span className="prop-chip" key={c}>{c}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function Home({ setFilters, boardings = [], children, setCategoryFilter, categoryFilter }) {
  const [search, setSearch] = useState('');
  const [city, setCity]     = useState('');
  const [active, setActive] = useState('');
  const bgRef = useParallax();
  const rv    = useReveal();

  const dynamicCityData = CITY_DATA.map(c => {
    const count = boardings.filter(b => b.city?.toLowerCase() === c.name.toLowerCase()).length;
    return { ...c, count: `${count}` };
  });

  // Close mobile menu on resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 640) setMobileMenu(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const scrollToListings = () => {
    setTimeout(() => {
      const el = document.getElementById('listings');
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const doSearch = useCallback((e) => {
    e?.preventDefault();
    setFilters?.({ searchTerm: search, city });
    scrollToListings();
  }, [search, city, setFilters]);

  const pickCity = useCallback((c) => {
    const next = active === c ? '' : c;
    setActive(next); setCity(next);
    setFilters?.({ searchTerm: search, city: next });
    scrollToListings();
  }, [active, search, setFilters]);

  const pickBento = useCallback((c) => {
    setActive(c); setCity(c);
    setFilters?.({ searchTerm: search, city: c });
    scrollToListings();
  }, [search, setFilters]);

  const pickCategory = useCallback((key) => {
    if (setCategoryFilter) {
      // Enable only selected category
      const allOff = !categoryFilter?.boarding && !categoryFilter?.vehicle && !categoryFilter?.land;
      // If clicking the only enabled one or all-off, enable only that one
      setCategoryFilter({ boarding: key === 'boarding', vehicle: key === 'vehicle', land: key === 'land' });
    }
    scrollToListings();
  }, [setCategoryFilter, categoryFilter]);

  return (
    <div className="hm">

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-bg" ref={bgRef} />
        <div className="hero-overlay" />
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-glow2" />


        {/* Split body */}
        <div className="hero-body">

          {/* LEFT */}
          <div className="hero-left">
            <div className="h-badge">
              <div className="h-badge__dot" />
              Sri Lanka's Trusted Property Marketplace
            </div>

            <h1 className="h-heading">
              <span className="line1">Find the <WordRotator words={WORDS} /></span>
              <span className="line2">Property for You</span>
            </h1>

            <p className="h-sub">
              Boarding houses, vehicles &amp; land plots across Sri Lanka — verified listings,
              real photos, direct owner contact. Zero fees, always.
            </p>

            {/* Category quick-access */}
            <div className="h-categories">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  className={`h-cat-btn`}
                  onClick={() => pickCategory(cat.key)}
                >
                  <span className="cat-ico">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="h-search-wrap">
              <form className="h-search" onSubmit={doSearch}>
                <div className="h-search-inner">
                  <div className="h-field" style={{ flex:'1.4' }}>
                    <Search size={16} className="h-field__ico" strokeWidth={2.2} />
                    <input
                      type="text" placeholder="Search boarding, vehicle, land…"
                      value={search} onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="h-divider" />
                  <div className="h-field" style={{ flex:'1', minWidth:0 }}>
                    <MapPin size={16} className="h-field__ico" strokeWidth={2.2} />
                    <select value={city} onChange={e => { setCity(e.target.value); setActive(e.target.value); }}>
                      <option value="">Any city</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={13} color="rgba(10,20,40,0.35)" style={{ flexShrink:0 }} />
                  </div>
                  <button type="submit" className="h-btn">
                    <Search size={14} strokeWidth={2.5} /> Search
                  </button>
                </div>
              </form>
            </div>

            <div className="h-cities">
              {CITIES.map(c => (
                <button key={c} className={`h-city${active===c?' sel':''}`} onClick={() => pickCity(c)}>
                  <MapPin size={10} strokeWidth={2.5} /> {c}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — floating property cards (desktop only via CSS) */}
          <div className="hero-right">
            <div className="hero-bubble hero-bubble--tl">
              <div className="bubble-ico bubble-ico--gold"><Star size={16} /></div>
              <div className="bubble-text">
                <strong>4.9 / 5 Rating</strong>
                <span>2,400+ reviews</span>
              </div>
            </div>

            {PROP_CARDS.map((c, i) => <PropCard key={i} card={c} />)}

            <div className="hero-bubble hero-bubble--br">
              <div className="bubble-ico bubble-ico--sky"><CheckCircle2 size={16} /></div>
              <div className="bubble-text">
                <strong>1,200+ Listings</strong>
                <span>Verified &amp; live today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue">
          <span>Scroll</span>
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
        </div>
      </section>

      {children}

      {/* ══ STATS ══ */}
      <div className="stats-strip rv" ref={rv}>
        <StatCounter target={1200} suffix="+" label="Active Listings"   delay="0s"   />
        <StatCounter target={3}    suffix=""  label="Categories"         delay=".08s" />
        <StatCounter target={14}   suffix=""  label="Cities Covered"     delay=".16s" />
      </div>

      {/* ══ WHY ══ */}
      <section className="why">
        <div className="wrap">
          <div className="sh rv" ref={rv}>
            <div className="sh__tag"><Sparkles size={10} /> Why FindLK</div>
            <h2 className="sh__title">Everything in <em>One Place</em></h2>
            <p className="sh__body">We bring boardings, vehicles, and land plots together so you can find exactly what you need — fast and hassle-free.</p>
          </div>
          <div className="why-grid">
            {WHY_CARDS.map((c, i) => (
              <div key={i} className="why-card rv" ref={rv} style={{ transitionDelay:`${i*0.12}s` }}>
                <span className="why-card__num">0{i+1}</span>
                <div className="why-ico">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <button className="why-link">
                  <span className="why-link__txt">{c.cta}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CITIES ══ */}
      <section className="cities">
        <div className="wrap">
          <div className="sh rv" ref={rv}>
            <div className="sh__tag"><MapPin size={10} /> Popular Destinations</div>
            <h2 className="sh__title">Browse by <em>City</em></h2>
            <p className="sh__body">From bustling Colombo to historic Galle — find the property that fits your life.</p>
          </div>
          <div className="bento">
            {dynamicCityData.map((c, i) => (
              <div
                key={c.name} className="bento-item rv" ref={rv}
                style={{ transitionDelay:`${i*0.08}s` }}
                onClick={() => pickBento(c.name)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key==='Enter' && pickBento(c.name)}
                aria-label={`Browse listings in ${c.name}`}
              >
                <img className="bento-img" src={c.img} alt={c.name} loading="lazy" />
                <div className="bento-grad" />
                <span className="bento-tag">Explore</span>
                <div className="bento-info">
                  <span className="bento-city">{c.name}</span>
                  <span className="bento-count">{c.count} listings</span>
                </div>
                <div className="bento-arrow"><ArrowUpRight size={14} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST ══ */}
      <section className="trust">
        <div className="wrap">
          <div className="sh rv" ref={rv}>
            <div className="sh__tag"><ShieldCheck size={10} /> Trusted Platform</div>
            <h2 className="sh__title">Built on <em>Transparency</em></h2>
          </div>
          <div className="trust-grid">
            {TRUST_ITEMS.map((t, i) => (
              <div key={i} className="trust-card rv" ref={rv} style={{ transitionDelay:`${i*0.09}s` }}>
                <div className="trust-ico">{t.icon}</div>
                <div><h4>{t.title}</h4><p>{t.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="why" id="how" style={{ paddingTop: '88px', borderTop: '1px solid var(--border)' }}>
        <div className="wrap">
          <div className="sh rv" ref={rv}>
            <div className="sh__tag"><Sparkles size={10} /> Simple Steps</div>
            <h2 className="sh__title">How to <em>List Your Property</em></h2>
            <p className="sh__body">Ready to reach thousands of buyers and renters? Follow three simple steps to publish any listing.</p>
          </div>
          <div className="why-grid" style={{ marginTop: '44px' }}>
            <div className="why-card rv" ref={rv} style={{ transitionDelay: '0s' }}>
              <span className="why-card__num">01</span>
              <div className="why-ico"><Users size={22} /></div>
              <h3>Create an Account</h3>
              <p>Sign up or log in — takes under a minute. Your listing details and contacts are kept safe and private.</p>
            </div>
            <div className="why-card rv" ref={rv} style={{ transitionDelay: '0.12s' }}>
              <span className="why-card__num">02</span>
              <div className="why-ico"><Building2 size={22} /></div>
              <h3>Choose a Category</h3>
              <p>Click "Upload" on the top bar and choose whether you're listing a Boarding, Vehicle, or Land. Fill in the details and pick your location on the map.</p>
            </div>
            <div className="why-card rv" ref={rv} style={{ transitionDelay: '0.24s' }}>
              <span className="why-card__num">03</span>
              <div className="why-ico"><CheckCircle2 size={22} /></div>
              <h3>Review &amp; Go Live</h3>
              <p>Our admin team reviews listings for authenticity. Once approved, your listing goes live immediately for buyers and renters to find.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED ══ */}
      <section className="featured">
        <div className="wrap">
          <div className="feat-inner rv" ref={rv}>
            <div className="feat-left">
              <p className="feat-eyebrow">✨ Updated Daily</p>
              <h3>New Listings<br />Added Every Day</h3>
              <p>Fresh, verified boardings, vehicles, and land plots are added daily across all major cities. Be the first to find them.</p>
            </div>
            <div className="feat-divider" />
            <div className="feat-stats">
              {[
                { n:'47+',   l:'Added today' },
                { n:'3 min', l:'Avg. response' },
                { n:'Free',  l:'To list & contact' },
              ].map(s => (
                <div className="feat-stat" key={s.l}>
                  <span className="feat-stat__n">{s.n}</span>
                  <span className="feat-stat__l">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="cta-section">
        <div className="wrap">
          <div className="cta-box rv" ref={rv}>
            <div className="cta-ring" />
            <div className="cta-ring2" />
            <div className="cta-inner">
              <span className="cta-tag">🏠 For Owners &amp; Sellers</span>
              <h2 className="cta-h2">Have a Property?<br /><em>List It Free Today.</em></h2>
              <p className="cta-p">Reach thousands of buyers and renters actively searching right now. Boarding, vehicle, or land — goes live in under 5 minutes.</p>
              <div className="cta-btns">
                <a href="#upload" className="cta-primary">Post Your Listing <ArrowRight size={15} /></a>
                <a href="#how"    className="cta-secondary"><TrendingUp size={14} /> How it works</a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}