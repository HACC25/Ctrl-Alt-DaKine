// @ts-nocheck
import { useEffect, useState } from 'react';
import './KauaiCC.css';
import PathwaySection from '../sections/PathwaySection';

export default function KauaiCC({ insights, answers, onSaveMajor, onGeneratePath, generatedPath }) {
  const [major, setMajor] = useState('sustainable');
  const hobby = 'outdoors';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    sustainable: {
      majorName: "Sustainable Technology (Agriculture)",
      classList: [
        { name: "SUST 101 (Intro to Sustainability)", building: "Agricultural & Industrial Technology (AIT) Building" },
        { name: "BIOL 171 (Ecology and Environmental Science)", building: "Science and Technology (ST) Building" }
      ],
      clubs: [
        { name: "KCC Farm Team", location: "The Sustainable Technology Farm" },
        { name: "Environmental Club", location: "Campus Center Courtyard" }
      ],
      links: { title: "Sustainable Science and Technology Program", url: "https://kauai.hawaii.edu/sst" }
    },
    hospitality: {
      majorName: "Hospitality & Tourism",
      classList: [
        { name: "HOST 100 (Intro to Hospitality)", building: "Fine Arts (FA) Building, Room 201" },
        { name: "ACC 124 (Applied Accounting)", building: "Business Education (BE) Building" }
      ],
      clubs: [
        { name: "Kauaʻi Hospitality Student Association", location: "Campus Center Conference Room" },
        { name: "Travel & Tourism Club", location: "BE Building Classroom" }
      ],
      links: { title: "Hospitality and Tourism Program", url: "https://kauai.hawaii.edu/programs" }
    },
    liberalarts: {
      majorName: "Liberal Arts (AA)",
      classList: [
        { name: "ENG 100 (Composition I)", building: "Creative Arts (CA) Building" },
        { name: "HWST 107 (Hawaiian Culture)", building: "Puhi Building" }
      ],
      clubs: [
        { name: "KCC Literary Magazine Staff", location: "CA Building Writing Center" },
        { name: "Board Games Club", location: "Campus Center Game Room" }
      ],
      links: { title: "Liberal Arts Program", url: "https://kauai.hawaii.edu/programs" }
    },
    nursing: {
      majorName: "Practical Nursing",
      classList: [
        { name: "NURS 101 (Introduction to Nursing)", building: "Health Education (HE) Building" },
        { name: "ZOOL 103 (Human Anatomy and Physiology)", building: "Science and Technology (ST) Building" }
      ],
      clubs: [
        { name: "Student Nursing Organization", location: "HE Building Lounge" },
        { name: "First Aid & Emergency Response Group", location: "Campus Center, 2nd Floor" }
      ],
      links: { title: "Health Education Programs", url: "https://kauai.hawaii.edu/health-programs" }
    }
  };

  const hobbyConfigs = {
    outdoors: { name: "take a short hike at Puʻu ʻŌpae State Park", location: "a short drive from campus" },
    gaming: { name: "join a LAN party for a quick match", location: "the Campus Center Game Room" },
    culture: { name: "visit the KCC Art Gallery and look for student work", location: "the Performing Arts Center" },
    sports: { name: "throw a football around on the main lawn", location: "the Great Lawn near the Library" }
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
          { course_code: 'SUST 101', title: 'Intro to Sustainability', building_location: 'AIT Building' },
          { course_code: 'BIOL 171', title: 'Ecology and Environmental Science', building_location: 'ST Building' },
          { course_code: 'ENG 100', title: 'Composition I', building_location: 'CA Building' }
        ];
        setSimData((s) => ({ ...(s || {}), path: fallback }));
        if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
      }
    } catch (e) {
      console.warn('generate-path request failed', e);
      const fallback = [
        { course_code: 'SUST 101', title: 'Intro to Sustainability', building_location: 'AIT Building' },
        { course_code: 'BIOL 171', title: 'Ecology and Environmental Science', building_location: 'ST Building' },
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
          <h1 className="uh-splash-title">KAUA'I</h1>
          <h2 className="uh-splash-subtitle">COMMUNITY COLLEGE</h2>
        </div>
        <div className="uh-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

      {/* SECTION 2: Welcome & Image Grid */}
      <section id="uh-welcome" className="section uh-welcome">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">E KIPA MAI! WELCOME TO KAUA'I CC</h2>
          <div className="uh-welcome-text">
            <p>
              I'm thrilled that you're exploring what life is like here at Kauaʻi Community College! Located in beautiful Līhuʻe, Kauaʻi, KCC has been the foundation for success on the Garden Isle since 1965. We're known for our strong Hospitality and Sustainable Technology programs and our seamless transfer paths to the UH four-year campuses.
            </p>
            <p>
              From the welcoming atmosphere of the Campus Center to our specialized labs for Culinary Arts and Tropical Agriculture, you'll join a diverse community dedicated to learning and innovation. To give you a better feel for our home, here are a few snapshots of campus life.
            </p>
            <p className="uh-signature">-From the Office of Admissions</p>
          </div>

          <div className="uh-image-grid">
            <div className="uh-image-card">
              <img 
                src="https://www.hawaii.edu/student-basic-needs/wp-content/uploads/sites/33/2021/02/kauai-cc-students-lawn.png" 
                alt="KCC Library"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://www.hawaii.edu/news/wp-content/uploads/2024/04/Kauai-Performing-Arts-Center-exterior.jpg" 
                alt="KCC Culinary Institute"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://royalcoconutcoast.com/wp-content/uploads/2020/02/KCC-Breakfast-Extravaganza.jpeg" 
                alt="KCC Sustainable Tech Farm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Personalize Your Journey */}
      <section id="uh-personalize" className="section uh-personalize">
        <div className="uh-personalize-content">
          <h2 className="uh-personalize-title">LET'S PLAN YOUR FIRST DAY</h2>
          <p className="uh-personalize-subtitle">
            As your guide, I'd love to show you what a typical day could look like. Just tell me a bit about your interests, and we'll create a personalized schedule just for you.
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
            name: "Kauaʻi CC",
            summary: "Located in beautiful Līhuʻe, Kauaʻi, KCC has been the foundation for success on the Garden Isle since 1965.",
            highlights: [
              "Strong Hospitality and Sustainable Technology programs",
              "Specialized labs for Culinary Arts and Tropical Agriculture",
              "Seamless transfer paths to UH four-year campuses",
              "Beautiful Garden Isle location",
              "Diverse community dedicated to learning and innovation",
            ],
          }}
        />
      </section>

      {/* SECTION 4: Next Steps & Footer */}
      <section id="uh-next-steps" className="section uh-next-steps">
        <div className="uh-next-content">
          <h3 className="uh-next-title">READY FOR THE REAL THING?</h3>
          <p className="uh-next-text">
            This is just one of countless days you can have at Kauaʻi CC. We can't wait to see you here.
          </p>
          <p className="uh-next-farewell">A hui hou! (Until we meet again),</p>
          <p className="uh-next-signature">- The KCC Admissions Team</p>

          <div className="uh-next-actions">
            <a 
              href="https://kauai.hawaii.edu/admissions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="uh-apply-btn"
            >
              Apply to KCC
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
            <p>&copy; 2024 Kauaʻi Community College. All rights reserved.</p>
            <div className="uh-footer-links">
              <a href="https://kauai.hawaii.edu/" target="_blank" rel="noopener noreferrer">Main Campus</a>
              <a href="https://kauai.hawaii.edu/contact-us" target="_blank" rel="noopener noreferrer">Contact Us</a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
