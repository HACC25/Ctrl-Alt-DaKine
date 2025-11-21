// @ts-nocheck
import { useEffect, useState } from 'react';
import './UHManoa.css';
import PathwaySection from '../sections/PathwaySection';
import { buildApiUrl } from '../config';

export default function UHManoa({ insights, answers, onSaveMajor, onGeneratePath, generatedPath, isPathAiGenerated }) {
  const [major, setMajor] = useState('computerscience');
  // Hobby selection removed from UI; default used for simulation
  const hobby = 'outdoors';
  const [showSimulation, setShowSimulation] = useState(false);
  const [simData, setSimData] = useState<any>(null);

  const config = {
    computerscience: {
      majorName: "Computer Science",
      classList: [
        { name: "ICS 111 (Introduction to Computer Science)", building: "Keller Hall" },
        { name: "MATH 215 (Applied Calculus)", building: "Bilger Hall" }
      ],
      clubs: [
        { name: "Hacker's Club", location: "POST Building Lab" },
        { name: "Game Developers Club", location: "Campus Center, 3rd Floor" }
      ],
      links: { title: "College of Engineering", url: "https://www.eng.hawaii.edu/" }
    },
    marinebiology: {
      majorName: "Marine Biology",
      classList: [
        { name: "BIOL 171 (Ecology and Evolutionary Biology)", building: "Snyder Hall" },
        { name: "OCN 201 (Science of the Sea)", building: "Marine Science Building" }
      ],
      clubs: [
        { name: "Ocean Research Club", location: "C-More Hale" },
        { name: "Kūʻula Conservation Group", location: "Campus Center, Ewa Wing" }
      ],
      links: { title: "School of Ocean and Earth Science and Technology (SOEST)", url: "https://www.soest.hawaii.edu/" }
    },
    hawaiianstudies: {
      majorName: "Hawaiian Studies",
      classList: [
        { name: "HWST 107 (Hawaiian Culture in Perspective)", building: "KamakakÅ«okalani Center" },
        { name: "HIST 291 (Hawaiʻi and the Pacific)", building: "Sakamaki Hall" }
      ],
      clubs: [
        { name: "Hula Hālau", location: "Andrews Outdoor Theatre" },
        { name: "Hawaiian Language Immersion Group", location: "KamakakÅ«okalani Center" }
      ],
      links: { title: "Hawaiian and Pacific Studies", url: "https://hawaiian.manoa.hawaii.edu/" }
    },
    business: {
      majorName: "Business Administration",
      classList: [
        { name: "BUS 310 (Business Finance)", building: "Shidler College of Business" },
        { name: "ECON 130 (Principles of Microeconomics)", building: "Webster Hall" }
      ],
      clubs: [
        { name: "Shidler Student Council", location: "Shidler Courtyard" },
        { name: "Investment Club", location: "Shidler Hall, Executive Classroom" }
      ],
      links: { title: "Shidler College of Business", url: "https://shidler.hawaii.edu/" }
    }
  };

  const hobbyConfigs = {
    outdoors: { name: "go on a light hike toward Mānoa Falls", location: "just behind campus" },
    gaming: { name: "join an eSports practice session", location: "the Campus Center Game Room" },
    culture: { name: "visit the East-West Center Art Gallery", location: "a short walk from Hamilton Library" },
    sports: { name: "get a workout in at the Warrior Recreation Center", location: "the main gym facility" }
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
      console.log('[UHManoa] Requesting path for:', majorLabel, 'campus: manoa');
      const resp = await fetch(buildApiUrl('/api/generate-path'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ major: majorLabel, campus: 'manoa' })
      });
      const json = await resp.json();
      console.log('[UHManoa] API response:', json);
      console.log('[UHManoa] json.path exists?', !!json?.path);
      console.log('[UHManoa] json.path is array?', Array.isArray(json?.path));
      console.log('[UHManoa] json.path.length:', json?.path?.length);
      
      if (json?.path && Array.isArray(json.path) && json.path.length > 0) {
        console.log('[UHManoa] Got path with', json.path.length, 'nodes');
        if (typeof onGeneratePath === 'function') onGeneratePath(json.path);
      } else {
        console.warn('[UHManoa] No path returned, using fallback');
        const fallback = [
          { id: 'f1', name: 'COMP 101 - Intro to CS', credits: 3, position: { x: 0, y: 0 } },
          { id: 'f2', name: 'MATH 110 - Calculus I', credits: 3, position: { x: 260, y: 0 } },
          { id: 'f3', name: 'WRTG 150 - College Writing', credits: 3, position: { x: 520, y: 0 } }
        ];
        if (typeof onGeneratePath === 'function') onGeneratePath(fallback);
      }
    } catch (e) {
      console.error('[UHManoa] generate-path request failed:', e);
      const fallback = [
        { id: 'f1', name: 'COMP 101 - Intro to CS', credits: 3, position: { x: 0, y: 0 } },
        { id: 'f2', name: 'MATH 110 - Calculus I', credits: 3, position: { x: 260, y: 0 } }
      ];
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
      <section id="uh-start" className="section uh-splash">
        <div className="uh-splash-overlay">
          <h1 className="uh-splash-title">UNIVERSITY OF HAWAIʻI</h1>
          <h2 className="uh-splash-subtitle">AT MĀNOA</h2>
        </div>
        <div className="uh-scroll-prompt">EXPLORE YOUR DAY ↓</div>
      </section>

      {/* SECTION 2: Welcome & Image Grid */}
      <section id="uh-welcome" className="section uh-welcome">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">A Personal Welcome to Mānoa</h2>
          <div className="uh-welcome-text">
            <p>
              I'm thrilled that you're exploring what life is like here at the University of Hawaiʻi at Mānoa. 
              We aren't just a university; we're an ʻohana (family) and a world-class research institution set 
              in the lush Mānoa Valley. Founded in 1907, our campus offers a unique blend of rigorous academics 
              and unparalleled natural beauty.
            </p>
            <p>
              From the historic trees of McCarthy Mall to our state-of-the-art labs, you'll be joining a diverse 
              community of scholars, leaders, and innovators.
            </p>
            <p className="uh-signature">-From the Office of Admissions</p>
          </div>

          <div className="uh-image-grid">
            <div className="uh-image-card">
              <img 
                src="https://www.usnews.com/dims4/USNEWS/e91bb32/17177859217/resize/800x540%3E/quality/85/?url=https%3A%2F%2Fwww.usnews.com%2Fcmsmedia%2Ff9%2F1a980f168271a41b9f43a932298607%2FHawaii_Hall_4MB.jpg" 
                alt="Hawaii Hall"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://manoa.hawaii.edu/campus-environments/wp-content/uploads/2024/09/George-Hall1.jpg" 
                alt="George Hall"
              />
            </div>
            <div className="uh-image-card">
              <img 
                src="https://manoa.hawaii.edu/news/attachments/img13222_15325l.jpg" 
                alt="POST Building"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION A: Campus Beauty & Scenery */}
      <section className="section uh-welcome uh-pamphlet uh-scenery">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">DISCOVER THE MĀNOA VALLEY</h2>
          <div className="uh-welcome-text">
            <p>
              Nestled within a lush valley framed by the Koʻolau mountains, UH Mānoa greets every visitor with
              waterfalls in the distance, morning rainbows arcing above campus, and the soft mist that rolls
              down from the ridgelines. Walking across McCarthy Mall feels like a stroll through a botanical
              garden where towering palm trees sway beside century-old banyans.
            </p>
            <p>
              Students study outdoors beneath jacaranda blossoms, hammocks line the Sinclair Courtyard, and the
              air carries a blend of plumeria and ocean breeze. This is a place where the natural world is as much
              a classroom as our lecture halls, inspiring reflection, creativity, and calm.
            </p>
            <p>
              Evening sunsets paint the valley in gold, and the soft glow from Hawaii Hall lights the way home. It’s
              a daily reminder that Mānoa is more than a campus—it’s a sanctuary.
            </p>
          </div>

          <div className="uh-image-grid uh-image-grid--four">
            <div className="uh-image-card">
              <img src="https://assets.site-static.com/userFiles/2109/image/things_to_do_in_manoa/TantlusLookout.png" alt="Tantalus Lookout" />
            </div>
            <div className="uh-image-card">
              <img src="https://media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/07/34/03/51.jpg" alt="Manoa waterfall hike" />
            </div>
            <div className="uh-image-card">
              <img src="https://www.hawaiimagazine.com/wp-content/uploads/2020/12/Manoa-Heritage-David-Croxford-1024x683.jpg" alt="Manoa heritage trees" />
            </div>
            <div className="uh-image-card">
              <img src="https://cdn2.veltra.com/ptr/20240627224434_580381759_2031_0.jpg?imwidth=550&impolicy=custom" alt="Rainforest trail" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Campus Life & Culture */}
      <section className="section uh-welcome uh-pamphlet uh-life">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">LIFE AT MĀNOA</h2>
          <div className="uh-welcome-text">
            <p>
              Mānoa is one of the most diverse campuses in the nation. More than 50 countries are represented in
              our student body, bringing together languages, traditions, and perspectives that immediately feel like
              family. Campus Center is the heartbeat of daily life with open-mic nights, career fairs, and the hum of
              conversation spilling from Ba-Le and other student-run eateries.
            </p>
            <p>
              From intramural paddling teams to cultural festivals hosted by clubs such as Ka Papa Loʻi o Kānewai,
              there is always a place to plug in. Grab a malasada from Wednesday food-truck row, cheer at Stan Sheriff
              Center, or unwind with friends at Mānoa Gardens’ live music nights.
            </p>
          </div>

          <div className="uh-image-grid">
            <div className="uh-image-card">
              <img src="https://manoa.hawaii.edu/wp/wp-content/uploads/2017/10/warriors.jpg" alt="Warrior spirit rally" />
            </div>
            <div className="uh-image-card">
              <img src="https://www.hawaii.edu/news/wp-content/uploads/2023/02/manoa-oleleo-hawaii-event-2.jpg" alt="ʻŌlelo Hawaiʻi celebration" />
            </div>
            <div className="uh-image-card">
              <img src="https://manoa.hawaii.edu/undergrad/is/wp-content/uploads/2021/07/Screen-Shot-2021-07-03-at-3.23.23-PM-1024x576.png" alt="Students collaborating outdoors" />
            </div>
            <div className="uh-image-card">
              <img src="https://media.licdn.com/dms/image/v2/C561BAQHCG8kA6G3rOQ/company-background_10000/company-background_10000/0/1585483301383/university_of_hawaii_at_manoa_cover?e=2147483647&amp;v=beta&amp;t=79SdQjo1dfO4P_ddca1ybQ6Ett6eYxmvAxHJpZZ2U5g" alt="Campus skyline" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: Academics & Opportunities */}
      <section className="section uh-welcome uh-pamphlet uh-academics">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">ACADEMICS THAT INSPIRE</h2>
          <div className="uh-welcome-text">
            <p>
              UH Mānoa is a Carnegie R1 research university with labs perched above the valley, marine stations along
              the coast, and telescopes that look across the galaxy. Marine Biology, Astronomy, Engineering, and Hawaiian
              Studies are just a few of the globally recognized programs that draw scholars from every oceanic region.
            </p>
            <p>
              Students collaborate with faculty at the Hawaiʻi Institute of Marine Biology, conduct research at the Institute
              for Astronomy, and prototype sustainable tech inside the College of Engineering makerspaces. Learning here
              means applying knowledge directly to the planet, the people, and the Pacific.
            </p>
          </div>

          <div className="uh-image-grid uh-image-grid--four">
            <div className="uh-image-card">
              <img src="https://uhmscore.github.io/images/hope1.jpg" alt="Engineering research" />
            </div>
            <div className="uh-image-card">
              <img src="https://www.deeperblue.com/wp-content/uploads/2024/09/manoa-arl-munitions-4.webp" alt="Applied research lab" />
            </div>
            <div className="uh-image-card">
              <img src="https://weare100.org/wp-content/uploads/2021/09/Image-from-iOS-10-1-1024x683.jpg" alt="Innovation hub" />
            </div>
            <div className="uh-image-card">
              <img src="https://manoa.hawaii.edu/miro/wp-content/uploads/2014/06/bio-sensor-lab-300x229.jpg" alt="Bio sensor lab" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: Why Students Love Mānoa */}
      <section className="section uh-welcome uh-pamphlet uh-why">
        <div className="uh-welcome-content">
          <h2 className="uh-welcome-title">WHY CHOOSE UH MĀNOA?</h2>
          <div className="uh-welcome-text">
            <ul className="uh-bullet-list">
              <li>Year-round access to beaches, hiking trails, and botanical gardens.</li>
              <li>Deep cultural immersion with ʻŌlelo Hawaiʻi courses and community partnerships.</li>
              <li>Hands-on research starting as early as freshman year.</li>
              <li>Supportive faculty mentors who know your story and goals.</li>
              <li>A campus designed for wellness with the Warrior Recreation Center and quiet outdoor study lanai.</li>
              <li>Global internships and study abroad pathways across the Asia-Pacific.</li>
              <li>An alumni network rooted in aloha and ready to open doors.</li>
            </ul>
          </div>

          <div className="uh-duo-image-grid">
            <div className="uh-image-card">
              <img src="https://manoa.hawaii.edu/studentlife/wp-content/uploads/DSC01449-scaled.jpg" alt="Student life event" />
            </div>
            <div className="uh-image-card">
              <img src="https://manoa.hawaii.edu/studentsuccess/images/thumbs/manoa-74.jpg" alt="Sunset over campus" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: Final Pamphlet Closing */}
      <section className="section uh-final-hero">
        <div className="uh-final-overlay">
          <h2>Your Journey Starts Here</h2>
          <p>
            Mānoa is where you discover your purpose, connect with mentors, and launch the dreams you’ve been
            sketching in notebooks. Let the valley welcome you, let the community support you, and let your future
            unfold beneath every rainbow.
          </p>
        </div>
      </section>

      {/* SECTION 3: Personalize Your Journey */}
      <section id="uh-personalize" className="section uh-personalize">
        <div className="uh-personalize-content">
          <h2 className="uh-personalize-title">LET'S PLAN YOUR FIRST DAY</h2>
          <p className="uh-personalize-subtitle">
            Tell me a bit about your interests, and we'll create a personalized schedule just for you.
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

            {/* Hobby selection removed - simulation uses a default activity */}
          </div>

          <button className="uh-generate-btn" onClick={handleGenerate}>
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
            name: "UH Mānoa",
            summary: "Located in beautiful Honolulu, UH Mānoa is the flagship campus of the University of Hawaiʻi System, offering world-class programs in a vibrant Pacific setting.",
            highlights: [
              "Top-ranked research university",
              "Diverse student body from 50+ countries",
              "150+ undergraduate degree programs",
              "Steps away from beaches & hiking trails",
              "Strong programs in marine biology, astronomy, Hawaiian studies, and computer science",
            ],
          }}
        />
      </section>

      {/* SECTION 4: Next Steps & Footer */}
      <section id="uh-next-steps" className="section uh-next-steps">
        <div className="uh-next-content">
          <h3 className="uh-next-title">READY FOR THE REAL THING?</h3>
          <p className="uh-next-text">
            This is just one of countless days you can have at Mānoa. We can't wait to see you here.
          </p>
          <p className="uh-next-farewell">A hui hou (Until we meet again),</p>
          <p className="uh-next-signature">- The UH Mānoa Admissions Team</p>

          <div className="uh-next-actions">
            <a 
              href="https://manoa.hawaii.edu/admissions/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="uh-apply-btn"
            >
              Apply to UH Mānoa
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
            <p>&copy; 2024 University of Hawaiʻi at Mānoa. All rights reserved.</p>
            <div className="uh-footer-links">
              <a href="https://manoa.hawaii.edu/" target="_blank" rel="noopener noreferrer">Main Campus</a>
              <a href="https://manoa.hawaii.edu/admissions/contact/" target="_blank" rel="noopener noreferrer">Contact</a>
              <a href="https://www.hawaii.edu/privacy/" target="_blank" rel="noopener noreferrer">Privacy</a>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}