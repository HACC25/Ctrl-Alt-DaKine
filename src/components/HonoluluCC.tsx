// @ts-nocheck
import { useEffect, useState } from 'react';
import './HonoluluCC.css';
import PathwaySection from '../sections/PathwaySection';

export default function HonoluluCC({ insights, answers, onSaveMajor, onGeneratePath, generatedPath }) {
  const [major, setMajor] = useState('automotive');
  const hobby = 'outdoors';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    automotive: {
      majorName: "Automotive Technology",
      classList: [
        { name: "AUT 101 (Basic Automotive Maintenance Lab)", building: "A-Building Shop" },
        { name: "ENG 100 (Composition I)", building: "Main Building" }
      ],
      clubs: [
        { name: "Auto Repair Club", location: "Automotive Shop" },
        { name: "SkillsUSA Chapter", location: "Pacific Technology Center" }
      ],
      links: { title: "Automotive Technology Program", url: "https://www.honolulu.hawaii.edu/tech/" }
    },
    culinary: {
      majorName: "Culinary Arts",
      classList: [
        { name: "CULA 101 (Introduction to Culinary Arts Workshop)", building: "HCC Culinary Institute" },
        { name: "HOST 101 (Introduction to Hospitality)", building: "Main Building, Kokea St" }
      ],
      clubs: [
        { name: "HCC Chefs Association", location: "The Bistro (HCC Restaurant)" },
        { name: "Baking and Pastry Guild", location: "The Bake Shop" }
      ],
      links: { title: "Culinary Institute of the Pacific (CIP)", url: "https://www.honolulu.hawaii.edu/culinary/" }
    },
    welding: {
      majorName: "Welding Technology",
      classList: [
        { name: "WELD 100 (Safety and Shielded Metal Arc Welding Lab)", building: "Welding Shop/Lab" },
        { name: "ENG 100 (Composition I)", building: "Main Building" }
      ],
      clubs: [
        { name: "Welding Competitors Group", location: "Building 12 Fabrication Lab" },
        { name: "Industrial Tech Society", location: "HCC Courtyard" }
      ],
      links: { title: "Welding Technology Program", url: "https://www.honolulu.hawaii.edu/tech/" }
    },
    fire: {
      majorName: "Fire & Environmental Emergency Mgmt",
      classList: [
        { name: "FEEM 101 (Introduction to Emergency Management)", building: "Main Building" },
        { name: "FS 100 (Fire Service Orientation)", building: "Lecture Hall" }
      ],
      clubs: [
        { name: "Disaster Preparedness Club", location: "HCC Library Meeting Room" },
        { name: "Student Firefighters Association", location: "Gymnasium Meeting Room" }
      ],
      links: { title: "FEEM Program", url: "https://www.honolulu.hawaii.edu/fire/" }
    }
  };

  const hobbyConfigs = {
    outdoors: { name: "go over construction blueprints", location: "the HCC Library" },
    gaming: { name: "join a technical design group meeting", location: "the Pacific Technology Center" },
    culture: { name: "practice plating techniques in the training kitchen", location: "Building 2, Culinary Wing" },
    sports: { name: "join the intramural basketball game", location: "the HCC Gym" }
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
      const resp = await fetch('/api/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: answers?.experiencesandinterests || [], skills: answers?.skills || [], summary: answers?.whyuh || '' })
      });
      const json = await resp.json();
      const p = json?.path ?? json?.data?.path ?? null;
      if (Array.isArray(p) && p.length) {
        setSimData((s) => ({ ...(s || {}), path: p }));
        if (typeof onGeneratePath === 'function') onGeneratePath(p);
      } else {
        const fallback = [
          { course_code: 'AUT 101', title: 'Basic Automotive Maintenance Lab', building_location: 'A-Building Shop' },
          { course_code: 'ENG 100', title: 'Composition I', building_location: 'Main Building' },
          { course_code: 'ENG 100', title: 'Composition I', building_location: 'HCC Library' }
        ];
        setSimData((s) => ({ ...(s || {}), path: fallback }));
        if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
      }
    } catch (e) {
      console.warn('generate-path request failed', e);
      const fallback = [
        { course_code: 'AUT 101', title: 'Basic Automotive Maintenance Lab', building_location: 'A-Building Shop' },
        { course_code: 'ENG 100', title: 'Composition I', building_location: 'Main Building' },
      ];
      setSimData((s) => ({ ...(s || {}), path: fallback }));
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
          <h1 className="uh-splash-title">HONOLULU</h1>
          <h2 className="uh-splash-subtitle">COMMUNITY COLLEGE</h2>
        </div>
        <div className="uh-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

      {/* SECTION 2: Welcome & Image Grid */}
      <section id="uh-welcome" className="section uh-welcome">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">E KIPA MAI! WELCOME TO HONOLULU</h2>
          <div className="uh-welcome-text">
            <p>
              Welcome to the home of hands-on learning in Hawaiʻi! Honolulu Community College is your pathway to a high-demand career, offering top-tier technical training and workforce development right here on Dillingham Boulevard.
            </p>
            <p>
              We specialize in trades, technology, and applied sciences, linking you directly to industry leaders. Forget lecture halls—at HCC, you'll be in the shop, the kitchen, or the field, learning skills that pay off immediately.
            </p>
            <p className="uh-signature">-HCC Admissions & Career Services</p>
          </div>

          <div className="uh-image-grid">
            <div className="uh-image-card">
              <img 
                src="https://www.honolulu.hawaii.edu/wp-content/uploads/2022/07/map_your_future-1.jpg" 
                alt="Campus Tour"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://www.honolulu.hawaii.edu/wp-content/uploads/2022/01/map_your_future-2.jpg" 
                alt="Auto Shop"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://www.honolulu.hawaii.edu/wp-content/uploads/2022/01/map_your_future-3.jpg" 
                alt="Beauty Shop"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Personalize Your Journey */}
      <section id="uh-personalize" className="section uh-personalize">
        <div className="uh-personalize-content">
          <h2 className="uh-personalize-title">WHAT DOES YOUR DAY LOOK LIKE?</h2>
          <p className="uh-personalize-subtitle">
            Tell us about the hands-on program you're interested in, and we'll map out a personalized day schedule to give you a feel for life here.
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
            name: "Honolulu CC",
            summary: "Located on Dillingham Boulevard, HCC is your pathway to a high-demand career with top-tier technical training and workforce development.",
            highlights: [
              "Specializes in trades, technology, and applied sciences",
              "Hands-on learning in shops, kitchens, and field environments",
              "Direct links to industry leaders",
              "Skills that pay off immediately",
              "Strong focus on workforce development",
            ],
          }}
        />
      </section>

      {/* SECTION 4: Next Steps & Footer */}
      <section id="uh-next-steps" className="section uh-next-steps">
        <div className="uh-next-content">
          <h3 className="uh-next-title">READY TO START BUILDING?</h3>
          <p className="uh-next-text">
            Your future career starts with hands-on training at HCC. Take the next step toward a meaningful, high-demand career.
          </p>
          <p className="uh-next-farewell">A hui hou! (Until we meet again),</p>
          <p className="uh-next-signature">- The Honolulu Community College Team</p>

          <div className="uh-next-actions">
            <a 
              href="https://www.honolulu.hawaii.edu/admissions/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="uh-apply-btn"
            >
              Apply to HCC Today
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
            <p>&copy; 2024 Honolulu Community College. All rights reserved.</p>
            <div className="uh-footer-links">
              <a href="https://www.honolulu.hawaii.edu/" target="_blank" rel="noopener noreferrer">Main Campus</a>
              <a href="https://www.honolulu.hawaii.edu/admissions/contact/" target="_blank" rel="noopener noreferrer">Contact Us</a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
