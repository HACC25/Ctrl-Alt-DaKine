// @ts-nocheck
import { useState } from 'react';
import './UHInfoSection.css';

export default function UHManoa() {
  const [major, setMajor] = useState('computerscience');
  const [hobby, setHobby] = useState('outdoors');
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

  const handleGenerate = () => {
    const majorConfig = config[major];
    const activity = hobbyConfigs[hobby];
    const club = majorConfig.clubs[Math.floor(Math.random() * majorConfig.clubs.length)];

    setSimData({
      majorName: majorConfig.majorName,
      class1: majorConfig.classList[0],
      class2: majorConfig.classList[1],
      club,
      activity,
      links: majorConfig.links
    });

    setShowSimulation(true);

    setTimeout(() => {
      document.getElementById('uh-next-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <>
      {/* SECTION 1: Splash Screen */}
      <section id="uh-splash" className="section uh-splash">
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
              <select id="major" value={major} onChange={(e) => setMajor(e.target.value)}>
                <option value="computerscience">Computer Science</option>
                <option value="marinebiology">Marine Biology</option>
                <option value="hawaiianstudies">Hawaiian Studies</option>
                <option value="business">Business Administration</option>
              </select>
            </div>

            <div className="uh-input-group">
              <label htmlFor="hobby">What are your interests or hobbies?</label>
              <select id="hobby" value={hobby} onChange={(e) => setHobby(e.target.value)}>
                <option value="outdoors">Hiking & Outdoors</option>
                <option value="gaming">Gaming & Tech</option>
                <option value="culture">Arts & Culture</option>
                <option value="sports">Fitness & Sports</option>
              </select>
            </div>
          </div>

          <button className="uh-generate-btn" onClick={handleGenerate}>
            Show Me My Day
          </button>

          {showSimulation && simData && (
            <div className="uh-timeline">
              <h3 className="uh-timeline-title">
                A GLIMPSE: {simData.majorName.toUpperCase()}
              </h3>

              <div className="uh-timeline-item">
                <div className="uh-timeline-dot" />
                <div className="uh-timeline-time">8:00 AM</div>
                <div className="uh-timeline-content">
                  <h4>Wake Up & Commute</h4>
                  <p>Start your day in beautiful Mānoa. Grab a coffee and prepare for your first class.</p>
                </div>
              </div>

              <div className="uh-timeline-item">
                <div className="uh-timeline-dot" />
                <div className="uh-timeline-time">9:00 AM</div>
                <div className="uh-timeline-content">
                  <h4>{simData.class1.name}</h4>
                  <p>Your first lecture is in {simData.class1.building}. Get there early to say hi!</p>
                </div>
              </div>

              <div className="uh-timeline-item">
                <div className="uh-timeline-dot" />
                <div className="uh-timeline-time">10:30 AM</div>
                <div className="uh-timeline-content">
                  <h4>{simData.class2.name}</h4>
                  <p>Head across campus to {simData.class2.building} for your next lecture.</p>
                </div>
              </div>

              <div className="uh-timeline-item">
                <div className="uh-timeline-dot" />
                <div className="uh-timeline-time">12:00 PM</div>
                <div className="uh-timeline-content">
                  <h4>Lunch & {simData.club.name}</h4>
                  <p>Grab a bite at Paradise Palms Cafe, then head to {simData.club.location}.</p>
                </div>
              </div>

              <div className="uh-timeline-item">
                <div className="uh-timeline-dot" />
                <div className="uh-timeline-time">2:00 PM</div>
                <div className="uh-timeline-content">
                  <h4>{simData.activity.name}</h4>
                  <p>Time to {simData.activity.name}, located {simData.activity.location}.</p>
                </div>
              </div>

              <div className="uh-timeline-item">
                <div className="uh-timeline-dot" />
                <div className="uh-timeline-time">5:00 PM</div>
                <div className="uh-timeline-content">
                  <h4>End of the Day</h4>
                  <p>Grab dinner, study at Sinclair Library, or head home after a full day.</p>
                </div>
              </div>
            </div>
          )}
        </div>
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