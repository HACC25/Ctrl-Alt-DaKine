// @ts-nocheck
import { useEffect, useState } from 'react';
import './UHHilo.css';
import PathwaySection from '../sections/PathwaySection';

export default function UHHilo({ insights, answers, onSaveMajor, onGeneratePath, generatedPath }) {
  const [major, setMajor] = useState('marinescience');
  // Hobby selection removed from UI; default used for simulation
  const hobby = 'outdoors';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    marinescience: {
      majorName: "Marine Science",
      classList: [
        { name: "MARE 100 (Marine Biology)", building: "Marine Science Lab" },
        { name: "BIOL 171 (Intro to Oceanography)", building: "Science and Technology Building" }
      ],
      clubs: [
        { name: "Marine Science Club", location: "Marine Science Lab" },
        { name: "Ocean Conservation Group", location: "Campus Center Meeting Room" }
      ],
      links: { title: "Marine Science Program", url: "https://hilo.hawaii.edu/marinesci/" }
    },
    pharmacy: {
      majorName: "Pharmacy",
      classList: [
        { name: "PHARM 101 (Introduction to Pharmacy)", building: "College of Pharmacy" },
        { name: "CHEM 161 (General Chemistry)", building: "Science and Technology Building" }
      ],
      clubs: [
        { name: "Pre-Pharmacy Club", location: "Pharmacy Building Study Lounge" },
        { name: "Student Pharmacy Association", location: "UCB Bale Conference Room" }
      ],
      links: { title: "College of Pharmacy", url: "https://hilo.hawaii.edu/pharmacy/" }
    },
    astronomy: {
      majorName: "Astronomy",
      classList: [
        { name: "ASTR 110 (Survey of Astronomy)", building: "Physical Sciences Building" },
        { name: "PHYS 170 (General Physics)", building: "Science and Technology Building" }
      ],
      clubs: [
        { name: "Astronomy Club", location: "Campus Center Observatory" },
        { name: "Physics & Astronomy Society", location: "Physical Sciences Lounge" }
      ],
      links: { title: "Physics & Astronomy Department", url: "https://hilo.hawaii.edu/physics/" }
    },
    hawaiianstudies: {
      majorName: "Hawaiian Studies",
      classList: [
        { name: "HWST 107 (Hawaiian Culture)", building: "Ka Haka ʻUla o Keʻelikōlani" },
        { name: "HAW 101 (Elementary Hawaiian)", building: "Ka Haka ʻUla Building" }
      ],
      clubs: [
        { name: "Ka Leo Hawaiʻi (Hawaiian Language Club)", location: "Ka Haka ʻUla Cultural Center" },
        { name: "Hula Club", location: "Performing Arts Center" }
      ],
      links: { title: "Ka Haka ʻUla o Keʻelikōlani", url: "https://hilo.hawaii.edu/khaka/" }
    }
  };

  const hobbyConfigs = {
    outdoors: { name: "explore the waterfalls and rainforests near campus", location: "Rainbow Falls or Akaka Falls" },
    gaming: { name: "join a board game night", location: "the Campus Center Game Room" },
    culture: { name: "visit the ʻImiloa Astronomy Center", location: "adjacent to campus" },
    sports: { name: "play pickup basketball or volleyball", location: "the Student Life Center courts" }
  };

  const handleGenerate = async () => {
    // Provide a safe fallback for majors that are recommended by AI but not
    // present in our local `config`. This prevents runtime errors and still
    // allows the user to see a readable major name saved in Summary.
    const majorConfig = config[major] || {
      majorName: (insights?.majors?.find((m) => normalizeMajorKey(m.name) === major)?.name) || major,
      classList: [],
      clubs: [],
      links: { title: '', url: '' },
    };
    const activity = hobbyConfigs[hobby];
    const club = majorConfig.clubs && majorConfig.clubs.length ? majorConfig.clubs[Math.floor(Math.random() * majorConfig.clubs.length)] : { name: '', location: '' };

    const class1 = majorConfig.classList?.[0] || { name: 'No class scheduled', building: 'TBD' };
    const class2 = majorConfig.classList?.[1] || { name: 'No class scheduled', building: 'TBD' };

    setSimData({
      majorName: majorConfig.majorName,
      class1,
      class2,
      club,
      activity,
      links: majorConfig.links,
      // placeholder for generated AI path
      path: []
    });

    setShowSimulation(true);

    // Scroll to the path section to show the course pathway
    setTimeout(() => {
      document.getElementById('path')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    // Call backend to generate a path. If the request fails, use a local fallback.
    try {
      const resp = await fetch('/api/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: answers?.experiencesandinterests || [], skills: answers?.skills || [], summary: answers?.whyuh || '' })
      });
      const json = await resp.json();
      const p = json?.path ?? json?.data?.path ?? null;
      if (Array.isArray(p) && p.length) {
        // Keep the local simData path for the page but notify App of the global generated path
        setSimData((s) => ({ ...(s || {}), path: p }));
        if (typeof onGeneratePath === 'function') onGeneratePath(p);
      } else {
        // fallback - simple local path
        const fallback = [
          { course_code: 'COMP 101', title: 'Intro to CS', building_location: 'Keller Hall 110' },
          { course_code: 'MATH 110', title: 'Calculus I', building_location: 'Bilger Hall 201' },
          { course_code: 'WRTG 150', title: 'College Writing', building_location: 'Sinclair Library' }
        ];
        setSimData((s) => ({ ...(s || {}), path: fallback }));
        if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
      }
    } catch (e) {
      console.warn('generate-path request failed', e);
      const fallback = [
        { course_code: 'COMP 101', title: 'Intro to CS', building_location: 'Keller Hall 110' },
        { course_code: 'MATH 110', title: 'Calculus I', building_location: 'Bilger Hall 201' },
      ];
      setSimData((s) => ({ ...(s || {}), path: fallback }));
      if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
    }
  };

  // Map a human-friendly major name to the keys we use in the config
  // e.g. 'Computer Science' -> 'computerscience'
  function normalizeMajorKey(name) {
    if (!name) return null;
    return name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .replace(/^-+|-+$/g, '');
  }

  // Build a quick map of normalized major -> original label from insights
  const recommendedMajors: string[] = (insights?.majors || []).map((m) => m?.name || '');
  const recommendedMap: Record<string, string> = recommendedMajors.reduce((acc: Record<string, string>, name: string) => {
    const key = normalizeMajorKey(name) || '';
    if (key) acc[key] = name;
    return acc;
  }, {});

  // When insights or answers change, try to initialize the major dropdown.
  useEffect(() => {
    // Priority: answers.uhMajorKey (explicit saved value) -> top AI recommendation -> leave current
    if (answers?.uhMajorKey) {
      setMajor(answers.uhMajorKey);
      return;
    }

    const recommendedMajor = insights?.majors?.[0]?.name || null;
    const norm = normalizeMajorKey(recommendedMajor);
    // If AI recommended a top major, default the dropdown to it and persist
    // the friendly label. We don't require a matching config to pre-select; if
    // there is no local config we will still store the choice so the user can
    // keep the selection and the Summary will display the readable name.
    if (norm) {
      setMajor(norm);
      if (typeof onSaveMajor === 'function') onSaveMajor(norm, recommendedMajors[0]);
    }
  }, [insights, answers]);

  // When user selects a major, persist it into App answers and local UHManoa state
  function handleMajorChange(e) {
    const newKey = e.target.value;
    setMajor(newKey);
    const label = recommendedMap[newKey] || config[newKey]?.majorName || newKey;
    if (typeof onSaveMajor === 'function') onSaveMajor(newKey, label);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pathway:major-selected', { detail: { majorKey: newKey, majorLabel: label } }));
      window.dispatchEvent(new Event('pathway:play'));
    }
  }

  return (
    <>
      {/* SECTION 1: Splash Screen */}
      <section id="uh-start" className="section uhl-splash">
        <div className="uhl-splash-overlay">
          <h1 className="uhl-splash-title">UNIVERSITY OF HAWAIʻI</h1>
          <h2 className="uhl-splash-subtitle">AT HILO</h2>
        </div>
        <div className="uhl-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

      {/* SECTION 2: Welcome & Image Grid */}
      <section id="uh-welcome" className="section uhl-welcome">
        <div className="uhl-welcome-content">
          <h2 className="uhl-welcome-title">ALOHA PŪ! WELCOME TO UH HILO</h2>
          <div className="uhl-welcome-text">
            <p>
              Welcome to UH Hilo, where we believe in fostering a close-knit, student-centered community.
              Nestled on Hawaiʻi Island near rainforests, waterfalls, and world-renowned telescopes, our campus
              offers a unique environment for learning, discovery, and personal growth.
            </p>
            <p>
              Since our founding, we've championed hands-on research and deep connections to Hawaiian culture.
              From marine science on our doorstep to astronomy on Maunakea, you'll find opportunities here you
              won't find anywhere else. Come see what makes UH Hilo a home away from home for students from
              around the world.
            </p>
            <p className="uhl-signature">-UH Hilo Admissions Team</p>
          </div>

          <div className="uhl-image-grid">
            <div className="uhl-image-card">
              <img 
                src="https://hilo.hawaii.edu/images/depts/marinescience/201L_MakaniAha.jpg" 
                alt="Marine Science Lab"
              />
            </div>
            <div className="uhl-image-card">
              <img 
                src="https://pharmacy.uhh.hawaii.edu/images/mega-menu-about.jpg" 
                alt="College of Pharmacy"
              />
            </div>
            <div className="uhl-image-card">
              <img 
                src="https://www.hawaii.edu/news/wp-content/uploads/2019/08/hilo-imiloa-astronomy-center.jpg" 
                alt="Imiloa Astronomy Center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Personalize Your Journey */}
      <section id="uh-personalize" className="section uhl-personalize">
        <div className="uhl-personalize-content">
          <h2 className="uhl-personalize-title">LET'S PLAN YOUR PATH</h2>
          <p className="uhl-personalize-subtitle">
            As your guide, I'd love to show you what a typical path could look like. Just tell me a bit about your interests, and we'll create a personalized schedule just for you.
          </p>

          <div className="uhl-input-grid">
            <div className="uhl-input-group">
              <label htmlFor="major">What's your intended major?</label>
              <select id="major" value={major} onChange={handleMajorChange}>
                {recommendedMajors.length > 0 ? (
                  recommendedMajors.map((name) => {
                    const key = normalizeMajorKey(name) || name;
                    return (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    );
                  })
                ) : (
                  Object.keys(config).map((key) => (
                    <option key={key} value={key}>
                      {config[key].majorName}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Hobby selection removed - simulation uses a default activity */}
          </div>

          <button className="uhl-generate-btn" onClick={handleGenerate}>
            Show Me My Path
          </button>

          {/* The timeline has been removed — path is rendered in the Path section below.
              PathwaySection is shown after personalization and before next steps. */}
          
          {/* Path is rendered as a top-level section after personalization (moved below) */}
        </div>
      </section>

      {/* SECTION: Path (top-level section so scrollToSection('path') works) */}
      <section id="path" className="section section-path">
        <PathwaySection
          nodes={generatedPath || []}
          selectedMajorKey={major}
          selectedMajorName={recommendedMap[major] || config[major]?.majorName || major}
          campusInfo={{
            name: "UH Hilo",
            summary: "A welcoming campus on Hawaiʻi Island that blends academic rigor with natural beauty and Hawaiian culture, known for hands-on research and close faculty relationships.",
            highlights: [
              "Small class sizes and personalized attention",
              "World-class astronomy and marine science programs",
              "Access to Maunakea observatories and coastal research",
              "Strong Hawaiian language and cultural programs",
              "Strong programs in marine biology, astronomy, and pharmacy",
            ],
          }}
        />
      </section>

      {/* SECTION 4: Next Steps & Footer */}
      <section id="uh-next-steps" className="section uhl-next-steps">
        <div className="uhl-next-content">
          <h3 className="uhl-next-title">READY FOR THE REAL THING?</h3>
          <p className="uhl-next-text">
            This is just one of countless days you can have at UH Hilo. Whether you're drawn to marine science, astronomy, pharmacy, or Hawaiian studies, our tight-knit community is here to support you.
          </p>
          <p className="uhl-next-farewell">E mālama pono (Take care),</p>
          <p className="uhl-next-signature">- The UH Hilo Admissions Team</p>

          <div className="uhl-next-actions">
            <a 
              href="https://hilo.hawaii.edu/admissions/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="uhl-apply-btn"
            >
              Apply to UH Hilo
            </a>
            {simData && (
              <a 
                href={simData.links.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uhl-program-link"
              >
                Learn about {simData.links.title}
              </a>
            )}
          </div>

          <footer className="uhl-footer">
            <p>&copy; 2024 University of Hawaiʻi at Hilo. All rights reserved.</p>
            <div className="uhl-footer-links">
              <a href="https://hilo.hawaii.edu/" target="_blank" rel="noopener noreferrer">Main Campus</a>
              <a href="https://hilo.hawaii.edu/contact/" target="_blank" rel="noopener noreferrer">Contact</a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">Privacy</a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}