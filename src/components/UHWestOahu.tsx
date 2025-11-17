// @ts-nocheck
import { useEffect, useState } from 'react';
import './UHWestOahu.css';
import PathwaySection from '../sections/PathwaySection';
import { buildApiUrl } from '../config';

export default function UHWestOahu({ insights, answers, onSaveMajor, onGeneratePath, generatedPath }) {
  const [major, setMajor] = useState('creativemedia');
  const hobby = 'beach';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    creativemedia: {
      majorName: 'Creative Media',
      classList: [
        { name: 'CM 120 (Intro to Creative Media)', building: 'Creative Media Facility' },
        { name: 'ART 101 (Design Principles)', building: 'Library Classroom' },
      ],
      clubs: [
        { name: 'Photography & Filmmaking Guild', location: 'Creative Media Post Lab' },
        { name: 'Student Creative Collective', location: 'Campus Center Lanai' },
      ],
      links: { title: 'Academy for Creative Media', url: 'https://westoahu.hawaii.edu/creativemedia/' },
    },
    cybersecurity: {
      majorName: 'Cybersecurity',
      classList: [
        { name: 'ITS 125 (Introduction to Networks)', building: 'Lab CC 230' },
        { name: 'CTEC 200 (Intro to Programming)', building: 'Computer Center' },
      ],
      clubs: [
        { name: 'Cybersecurity Club', location: 'Campus Center Multi-Purpose Room' },
        { name: 'IT Management Group', location: 'Administration Building' },
      ],
      links: { title: 'Cybersecurity Program', url: 'https://westoahu.hawaii.edu/cybersecurity/' },
    },
    justice: {
      majorName: 'Justice Administration',
      classList: [
        { name: 'JUST 100 (Intro to Justice Studies)', building: 'Administration Building' },
        { name: 'PUBA 200 (Public Service Ethics)', building: 'Library Classroom' },
      ],
      clubs: [
        { name: 'Alpha Phi Sigma – Criminal Justice Honor Society', location: 'Campus Center' },
        { name: 'Public Administration Network', location: 'Administration Building' },
      ],
      links: { title: 'Public Administration', url: 'https://westoahu.hawaii.edu/publicadmin/' },
    },
    sustainability: {
      majorName: 'Sustainable Community Food Systems',
      classList: [
        { name: 'SCFS 300 (Food Systems Theory)', building: 'Library Classroom' },
        { name: 'SCFS 310 (Agroecology Lab)', building: 'Campus Garden' },
      ],
      clubs: [
        { name: 'Sustainability Hui', location: 'Learning Commons Lanai' },
        { name: 'Food Systems Fellows', location: 'Campus Garden Pavilion' },
      ],
      links: { title: 'SCFS Program', url: 'https://westoahu.hawaii.edu/foodsystems/' },
    },
  };

  const hobbyConfigs = {
    beach: { name: 'head out to the lagoons at Ko Olina for a sunset swim', location: 'West Oʻahu shoreline' },
    hiking: { name: 'take a quick hike up the Makakilo ridgeline to see campus from above', location: 'Kapolei foothills' },
    culture: { name: 'attend a lei-making workshop hosted by Nā Hōkū', location: 'Campus Center Lanai' },
    gaming: { name: 'drop into an esports scrimmage with the campus gaming club', location: 'Creative Media Facility lounge' },
  };

  const handleGenerate = async () => {
    const majorConfig = config[major] || {
      majorName: insights?.majors?.find((m) => normalizeMajorKey(m.name) === major)?.name || major,
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
      path: [],
    });

    setShowSimulation(true);

    setTimeout(() => {
      document.getElementById('path')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const majorLabel = recommendedMap[major] || config[major]?.majorName || major;
      const resp = await fetch(buildApiUrl('/api/generate-path'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ major: majorLabel, campus: 'westoahu' }),
      });
      const json = await resp.json();
      
      if (json?.path && Array.isArray(json.path) && json.path.length > 0) {
        if (typeof onGeneratePath === 'function') onGeneratePath(json.path);
      } else {
        const fallback = [
          { id: 'f1', name: 'CM 101 - Foundations of Creative Media', credits: 3, position: { x: 0, y: 0 } },
          { id: 'f2', name: 'ENG 200 - Composition II', credits: 3, position: { x: 260, y: 0 } },
          { id: 'f3', name: 'CTEC 120 - Cyber Foundations', credits: 3, position: { x: 520, y: 0 } }
        ];
        if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
      }
    } catch (e) {
      console.warn('generate-path request failed', e);
      const fallback = [
        { id: 'f1', name: 'CM 101 - Foundations of Creative Media', credits: 3, position: { x: 0, y: 0 } },
        { id: 'f2', name: 'ENG 200 - Composition II', credits: 3, position: { x: 260, y: 0 } }
      ];
      if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
    }
  };

  function normalizeMajorKey(name) {
    if (!name) return null;
    return name.toString().toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^-+|-+$/g, '');
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
  <section id="uh-start" className="section uhwo-splash">
        <div className="uhwo-splash-overlay">
          <h1 className="uhwo-splash-title">UNIVERSITY OF HAWAIʻI</h1>
          <h2 className="uhwo-splash-subtitle">WEST OʻAHU</h2>
        </div>
        <div className="uhwo-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

  <section id="uh-welcome" className="section uhwo-welcome">
        <div className="uhwo-welcome-content">
          <h2 className="uhwo-welcome-title">E LALAU PŪ! WELCOME TO KAPOLEI</h2>
          <div className="uhwo-welcome-text">
            <p>
              UH West Oʻahu is built for innovators, storytellers, public servants, and problem-solvers. Set in Kapolei, the
              island’s fast-growing Second City, our campus blends state-of-the-art facilities with the welcoming energy of the
              Leeward Coast.
            </p>
            <p>
              From our Creative Media building to the cyber labs and campus garden, you’ll find hands-on learning spaces tailored
              to Hawaiʻi’s future workforce.
            </p>
            <p className="uhwo-signature">- From the UH West Oʻahu Admissions Team</p>
          </div>

          <div className="uhwo-image-grid">
            <div className="uhwo-image-card">
              <img
                src="https://www.hawaii.edu/news/wp-content/uploads/2020/07/west-oahu-campus-gnrc.jpg"
                alt="UH West Oʻahu campus aerial"
              />
            </div>
            <div className="uhwo-image-card">
              <img
                src="https://www.usgbc.org/sites/default/files/2022-08/KDB_UH_Exterior_West_02_0.jpg"
                alt="Creative Media Facility"
              />
            </div>
            <div className="uhwo-image-card">
              <img
                src="https://i.ytimg.com/vi/ks9qRgmj80I/maxresdefault.jpg"
                alt="Learning Commons"
              />
            </div>
          </div>
        </div>
      </section>

  <section id="uh-personalize" className="section uhwo-personalize">
        <div className="uhwo-personalize-content">
          <h2 className="uhwo-personalize-title">PLAN YOUR FIRST DAY IN KAPOLEI</h2>
          <p className="uhwo-personalize-subtitle">
            Share your interests so we can build a West Oʻahu schedule that feels true to you.
          </p>

          <div className="uhwo-input-grid">
            <div className="uhwo-input-group">
              <label htmlFor="major">What program are you eyeing?</label>
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

          <button className="uhwo-generate-btn" onClick={handleGenerate}>
            Show Me My Path
          </button>
        </div>
      </section>

  <section id="path" className="section section-path">
        <PathwaySection
          nodes={generatedPath || []}
          selectedMajorKey={major}
          selectedMajorName={recommendedMap[major] || config[major]?.majorName || major}
          campusInfo={{
            name: 'UH West Oʻahu',
            summary:
              'In Kapolei, UH West Oʻahu focuses on hands-on professional programs—from Cybersecurity to Creative Media—all on a modern campus with easy access to beaches, trails, and community partners.',
            highlights: [
              'Intimate class sizes and supportive faculty',
              'High-demand degrees in creative media, cyber, justice, and sustainability',
              'Brand-new Creative Media Facility and cyber labs',
              'Close-knit West Side community partnerships',
              'Quick drive to Ko Olina, Kapolei Commons, and seaside sunsets',
            ],
          }}
        />
      </section>

  <section id="uh-next-steps" className="section uhwo-next-steps">
        <div className="uhwo-next-content">
          <h3 className="uhwo-next-title">READY TO JOIN THE WEST SIDE ʻOHANA?</h3>
          <p className="uhwo-next-text">
            Your journey at UH West Oʻahu puts you at the center of opportunity, innovation, and community impact.
          </p>
          <p className="uhwo-next-farewell">I mua! (Move forward!)</p>
          <p className="uhwo-next-signature">- The UH West Oʻahu Admissions Team</p>

          <div className="uhwo-next-actions">
            <a
              href="https://westoahu.hawaii.edu/admissions/"
              target="_blank"
              rel="noopener noreferrer"
              className="uhwo-apply-btn"
            >
              Apply to UH West Oʻahu
            </a>
            {simData && simData.links?.url && (
              <a
                href={simData.links.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uhwo-program-link"
              >
                Learn about {simData.links.title}
              </a>
            )}
          </div>

          <footer className="uhwo-footer">
            <p>&copy; 2024 University of Hawaiʻi – West Oʻahu. All rights reserved.</p>
            <div className="uhwo-footer-links">
              <a href="https://westoahu.hawaii.edu/" target="_blank" rel="noopener noreferrer">
                Main Campus
              </a>
              <a href="https://westoahu.hawaii.edu/contact/" target="_blank" rel="noopener noreferrer">
                Contact
              </a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">
                Privacy
              </a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
