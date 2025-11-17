// @ts-nocheck
import { useEffect, useState } from 'react';
import './UHMaui.css';
import PathwaySection from '../sections/PathwaySection';

export default function UHMaui({ insights, answers, onSaveMajor, onGeneratePath, generatedPath }) {
  const [major, setMajor] = useState('appliedbusiness');
  // Hobby selection removed from UI; default used for simulation
  const hobby = 'outdoors';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    appliedbusiness: {
      majorName: "Applied Business",
      classList: [
        { name: "BUS 101 (Introduction to Business)", building: "Pā'ina Building" },
        { name: "ACC 124 (Principles of Accounting)", building: "Kaʻaʻike Building" }
      ],
      clubs: [
        { name: "Business Club", location: "Student Center Lounge" },
        { name: "Entrepreneurship Society", location: "Kaʻaʻike Conference Room" }
      ],
      links: { title: "Applied Business Program", url: "https://maui.hawaii.edu/business/" }
    },
    sustainablescience: {
      majorName: "Sustainable Science Management",
      classList: [
        { name: "SUST 110 (Introduction to Sustainability)", building: "Science & Technology Building" },
        { name: "BIOL 171 (Intro to Biology)", building: "Lab Building" }
      ],
      clubs: [
        { name: "Sustainability Club", location: "Campus Garden" },
        { name: "Environmental Science Society", location: "Science Building Study Room" }
      ],
      links: { title: "Sustainable Science Program", url: "https://maui.hawaii.edu/ssm/" }
    },
    engineeringtech: {
      majorName: "Engineering Technology",
      classList: [
        { name: "ET 100 (Engineering Fundamentals)", building: "Trades Building" },
        { name: "PHYS 100 (Introduction to Physics)", building: "Science Building" }
      ],
      clubs: [
        { name: "Engineering Technology Club", location: "Trades Workshop" },
        { name: "Robotics Team", location: "Lab Annex" }
      ],
      links: { title: "Engineering Technology Program", url: "https://maui.hawaii.edu/engineering/" }
    },
    culinary: {
      majorName: "Culinary Arts",
      classList: [
        { name: "CULN 105 (Culinary Fundamentals)", building: "Pā'ina Culinary Lab" },
        { name: "HOST 101 (Hospitality Management)", building: "Kaʻaʻike Building" }
      ],
      clubs: [
        { name: "Culinary Arts Club", location: "Pā'ina Kitchen" },
        { name: "Student Chef Association", location: "Campus Dining Area" }
      ],
      links: { title: "Culinary Arts Program", url: "https://maui.hawaii.edu/culinary/" }
    }
  };

  const hobbyConfigs = {
    outdoors: { name: "explore Haleakalā or nearby beaches", location: "just minutes from campus" },
    gaming: { name: "join a gaming tournament", location: "the Student Center Game Room" },
    culture: { name: "attend a Hawaiian cultural event", location: "the Pā'ina Building Courtyard" },
    sports: { name: "play intramural sports", location: "the campus athletic field" }
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
      <section id="uh-start" className="section uhmaui-splash">
        <div className="uhmaui-splash-overlay">
          <h1 className="uhmaui-splash-title">UNIVERSITY OF HAWAIʻI</h1>
          <h2 className="uhmaui-splash-subtitle">MAUI COLLEGE</h2>
        </div>
        <div className="uhmaui-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

      {/* SECTION 2: Welcome & Image Grid */}
      <section id="uh-welcome" className="section uhmaui-welcome">
        <div className="uhmaui-welcome-content">
          <h2 className="uhmaui-welcome-title">E Komo Mai to Maui College</h2>
          <div className="uhmaui-welcome-text">
            <p>
              Welcome to the University of Hawaiʻi Maui College, where hands-on learning meets authentic Hawaiian hospitality. 
              Located in beautiful Kahului, our college has been serving the Maui community since 1931, offering career-focused 
              programs that prepare you for immediate success in the workforce.
            </p>
            <p>
              Whether you're interested in culinary arts, sustainable science, engineering technology, or applied business, 
              you'll find state-of-the-art facilities and experienced faculty dedicated to your success. Our small class sizes 
              ensure personalized attention and real-world learning opportunities.
            </p>
            <p className="uhmaui-signature">-From the Office of Admissions</p>
          </div>

          <div className="uhmaui-image-grid">
            <div className="uhmaui-image-card">
              <img 
                src="https://www.hawaii.edu/news/wp-content/uploads/2023/08/maui-wildfires-fema-3.jpg" 
                alt="Pāʻina Building"
              />
            </div>
            <div className="uhmaui-image-card">
              <img 
                src="https://www.hawaii.edu/news/wp-content/uploads/2025/06/maui-mural-2025-2.jpg" 
                alt="Kaʻaʻike Building"
              />
            </div>
            <div className="uhmaui-image-card">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdQ13mQMRjM6jsFouyWIbEJobu3BaauoexSQ&s" 
                alt="Automotive Technology Center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Personalize Your Journey */}
      <section id="uh-personalize" className="section uhmaui-personalize">
        <div className="uhmaui-personalize-content">
          <h2 className="uhmaui-personalize-title">LET'S PLAN YOUR PATH</h2>
          <p className="uhmaui-personalize-subtitle">
            Tell me a bit about your interests, and we'll create a personalized schedule just for you.
          </p>

          <div className="uhmaui-input-grid">
            <div className="uhmaui-input-group">
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

          <button className="uhmaui-generate-btn" onClick={handleGenerate}>
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
            name: "UH Maui College",
            summary: "Located in Central Maui, UH Maui College offers hands-on, career-focused programs in a supportive community setting with strong connections to local industry.",
            highlights: [
              "Small class sizes and personalized attention",
              "Hands-on learning in state-of-the-art facilities",
              "Direct pathways to employment and university transfer",
              "Strong ties to Maui's business and hospitality industries",
              "Affordable tuition with excellent career outcomes",
            ],
          }}
        />
      </section>

      {/* SECTION 4: Next Steps & Footer */}
      <section id="uh-next-steps" className="section uhmaui-next-steps">
        <div className="uhmaui-next-content">
          <h3 className="uhmaui-next-title">READY FOR THE REAL THING?</h3>
          <p className="uhmaui-next-text">
            This is just one of countless days you can have at UH Maui College. We can't wait to see you here.
          </p>
          <p className="uhmaui-next-farewell">A hui hou (Until we meet again),</p>
          <p className="uhmaui-next-signature">- The UH Maui College Admissions Team</p>

          <div className="uhmaui-next-actions">
            <a 
              href="https://maui.hawaii.edu/admissions/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="uhmaui-apply-btn"
            >
              Apply to UH Maui College
            </a>
            {simData && (
              <a 
                href={simData.links.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uhmaui-program-link"
              >
                Learn about {simData.links.title}
              </a>
            )}
          </div>

          <footer className="uhmaui-footer">
            <p>&copy; 2024 University of Hawaiʻi Maui College. All rights reserved.</p>
            <div className="uhmaui-footer-links">
              <a href="https://maui.hawaii.edu/" target="_blank" rel="noopener noreferrer">Main Campus</a>
              <a href="https://maui.hawaii.edu/admissions/contact/" target="_blank" rel="noopener noreferrer">Contact</a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">Privacy</a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}