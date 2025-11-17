// @ts-nocheck
import { useEffect, useState } from 'react';
import './KapiolaniCC.css';
import PathwaySection from '../sections/PathwaySection';

export default function KapiolaniCC({ insights, answers, onSaveMajor, onGeneratePath, generatedPath }) {
  const [major, setMajor] = useState('nursing');
  const hobby = 'outdoors';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    nursing: {
      majorName: "Nursing",
      classList: [
        { name: "NURS 100 (Intro to Professional Nursing)", building: "Kōpiko Building Sim Lab" },
        { name: "BIOL 130 (Human Physiology)", building: "Kānewai Building" }
      ],
      clubs: [
        { name: "Nursing Student Association", location: "Kōpiko Building" },
        { name: "Health Career Club", location: "Lama Library Study Room" }
      ],
      links: { title: "Nursing Program", url: "https://www.kapiolani.hawaii.edu/academics/programs-of-study/nursing-program/" }
    },
    culinary: {
      majorName: "Culinary Arts",
      classList: [
        { name: "CULA 110 (Culinary Fundamentals Lab)", building: "D-Building Kitchens" },
        { name: "BUS 100 (Introduction to Business)", building: "Mōkapu Building" }
      ],
      clubs: [
        { name: "Culinary Federation Student Chapter", location: "Ka 'Ikena Dining Room" },
        { name: "Baking and Pastry Club", location: "The KCC Bake Shop" }
      ],
      links: { title: "Culinary Arts Program", url: "https://www.kapiolani.hawaii.edu/academics/programs-of-study/culinary-arts/" }
    },
    liberalarts: {
      majorName: "Liberal Arts (UH Transfer)",
      classList: [
        { name: "ENG 100 (Composition I)", building: "Ilima Building" },
        { name: "MATH 100 (Survey of Mathematics)", building: "Kauila Building" }
      ],
      clubs: [
        { name: "Phi Theta Kappa Honor Society", location: "Lama Library Meeting Room" },
        { name: "Student Government (ASUH-KCC)", location: "Kōpiko Building" }
      ],
      links: { title: "Liberal Arts Program", url: "https://www.kapiolani.hawaii.edu/academics/programs-of-study/liberal-arts/" }
    },
    tourism: {
      majorName: "Travel & Tourism",
      classList: [
        { name: "HOST 101 (Introduction to Hospitality)", building: "Mōkapu Building" },
        { name: "TRSM 150 (Tourism in Hawaiʻi)", building: "Ilima Building" }
      ],
      clubs: [
        { name: "Hospitality and Tourism Club", location: "The KCC Cafeteria" },
        { name: "Student Ambassadors", location: "The Chancellor's Office" }
      ],
      links: { title: "Hospitality & Tourism Program", url: "https://www.kapiolani.hawaii.edu/academics/programs-of-study/hospitality-tourism/" }
    }
  };

  const hobbyConfigs = {
    outdoors: { name: "take a study break with a panoramic view of Waikīkī", location: "the top floor of the Kōpiko Building" },
    gaming: { name: "join a study group for your toughest class", location: "Lama Library's second floor" },
    culture: { name: "eat lunch at the Ka 'Ikena Dining Room", location: "KCC's student-run restaurant" },
    sports: { name: "walk the KCC track for a quick workout", location: "the campus sports field" }
  };

  const handleGenerate = async () => {
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
      path: []
    });

    setShowSimulation(true);

    setTimeout(() => {
      document.getElementById('path')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    try {
      const majorLabel = recommendedMap[major] || config[major]?.majorName || major;
      const resp = await fetch('/api/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ major: majorLabel, campus: 'kapiolani' })
      });
      const json = await resp.json();
      
      if (json?.path && Array.isArray(json.path) && json.path.length > 0) {
        if (typeof onGeneratePath === 'function') onGeneratePath(json.path);
      } else {
        const fallback = [
          { id: 'f1', name: 'NURS 100 - Intro to Professional Nursing', credits: 3, position: { x: 0, y: 0 } },
          { id: 'f2', name: 'BIOL 130 - Human Physiology', credits: 3, position: { x: 260, y: 0 } },
          { id: 'f3', name: 'ENG 100 - Composition I', credits: 3, position: { x: 520, y: 0 } }
        ];
        if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
      }
    } catch (e) {
      console.warn('generate-path request failed', e);
      const fallback = [
        { id: 'f1', name: 'NURS 100 - Intro to Professional Nursing', credits: 3, position: { x: 0, y: 0 } },
        { id: 'f2', name: 'BIOL 130 - Human Physiology', credits: 3, position: { x: 260, y: 0 } }
      ];
      if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
    }
  };

  function normalizeMajorKey(name) {
    if (!name) return null;
    return name
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .replace(/^-+|-+$/g, '');
  }

  const recommendedMajors: string[] = (insights?.majors || []).map((m) => m?.name || '');
  const recommendedMap: Record<string, string> = recommendedMajors.reduce((acc: Record<string, string>, name: string) => {
    const key = normalizeMajorKey(name) || '';
    if (key) acc[key] = name;
    return acc;
  }, {});

  useEffect(() => {
    if (answers?.uhMajorKey) {
      setMajor(answers.uhMajorKey);
      return;
    }

    const recommendedMajor = insights?.majors?.[0]?.name || null;
    const norm = normalizeMajorKey(recommendedMajor);
    if (norm) {
      setMajor(norm);
      if (typeof onSaveMajor === 'function') onSaveMajor(norm, recommendedMajors[0]);
    }
  }, [insights, answers]);

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
      <section id="uh-splash" className="section uh-splash">
        <div className="uh-splash-overlay">
          <h1 className="uh-splash-title">KAPIOLANI</h1>
          <h2 className="uh-splash-subtitle">COMMUNITY COLLEGE</h2>
        </div>
        <div className="uh-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

      {/* SECTION 2: Welcome & Image Grid */}
      <section id="uh-welcome" className="section uh-welcome">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">E KIPA MAI! WELCOME TO KAPIOLANI</h2>
          <div className="uh-welcome-text">
            <p>
              Welcome to Kapiolani Community College! Located at the foot of Diamond Head, our campus offers breathtaking views and is a premier transfer institution and workforce training center. We blend academic excellence with professional training in fields like **Health Sciences** and **Culinary Arts**.
            </p>
            <p>
              Whether you're planning to transfer to a four-year university or jumpstart your career, KCC provides a supportive and inspiring environment. Let's see what life on this beautiful campus feels like!
            </p>
            <p className="uh-signature">-Kapiolani CC Admissions</p>
          </div>

          <div className="uh-image-grid">
            <div className="uh-image-card">
              <img 
                src="https://www.kapiolani.hawaii.edu/wp-content/uploads/2021/03/students_1920x1080.jpg" 
                alt="Students"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://www.honolulumagazine.com/wp-content/uploads/data-import/a7a9ad8c/calabash-kapiolani-community-college-culinary-institute.jpg" 
                alt="Culinary Building"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/a/a2/KCC_Cactus_Garden.jpg" 
                alt="Cactus Garden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Personalize Your Journey */}
      <section id="uh-personalize" className="section uh-personalize">
        <div className="uh-personalize-content">
          <h2 className="uh-personalize-title">DESIGN YOUR KCC DAY</h2>
          <p className="uh-personalize-subtitle">
            Tell us your academic path and a personal interest, and we'll create a simulated schedule on our beautiful campus.
          </p>

          <div className="uh-input-grid">
            <div className="uh-input-group">
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
          </div>

          <button className="uh-generate-btn" onClick={handleGenerate}>
            Show Me My Path
          </button>
        </div>
      </section>

      {/* SECTION: Path */}
      <section id="path" className="section section-path">
        <PathwaySection
          nodes={generatedPath || []}
          selectedMajorKey={major}
          selectedMajorName={recommendedMap[major] || config[major]?.majorName || major}
          campusInfo={{
            name: "Kapiolani CC",
            summary: "Located at the foot of Diamond Head with breathtaking views, KCC is a premier transfer institution and workforce training center.",
            highlights: [
              "Blend of academic excellence with professional training",
              "Strong Health Sciences and Nursing programs",
              "Renowned Culinary Arts program",
              "Beautiful campus with Diamond Head views",
              "Supportive and inspiring environment",
            ],
          }}
        />
      </section>

      {/* SECTION 4: Next Steps & Footer */}
      <section id="uh-next-steps" className="section uh-next-steps">
        <div className="uh-next-content">
          <h3 className="uh-next-title">BEGIN YOUR ISLAND ADVENTURE</h3>
          <p className="uh-next-text">
            You're one step closer to studying with a view of Diamond Head. We can't wait to welcome you to the KCC family!
          </p>
          <p className="uh-next-farewell">A hui hou! (Until we meet again),</p>
          <p className="uh-next-signature">- The Kapiolani CC Team</p>

          <div className="uh-next-actions">
            <a 
              href="https://www.kapiolani.hawaii.edu/apply/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="uh-apply-btn"
            >
              Apply to KCC Today
            </a>
            {simData && (
              <a 
                href={simData.links.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uh-program-link"
              >
                Learn about {simData.links.title}
              </a>
            )}
          </div>

          <footer className="uh-footer">
            <p>&copy; 2024 Kapiolani Community College. All rights reserved.</p>
            <div className="uh-footer-links">
              <a href="https://www.kapiolani.hawaii.edu/" target="_blank" rel="noopener noreferrer">Main Campus</a>
              <a href="https://www.kapiolani.hawaii.edu/admissions/contact/" target="_blank" rel="noopener noreferrer">Contact Us</a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
