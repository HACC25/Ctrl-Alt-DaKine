/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import degreePathways from '../../UH-courses/manoa_degree_pathways.json';
import courseCatalog from '../../UH-courses/json_format/manoa_courses.json';
import './PathwaySection.css';

const horizontalSpacing = 260;
const verticalSpacing = 110;
const yearSpacing = 280;

const normalize = (value?: string | null) =>
  value ? value.toString().toLowerCase().replace(/[^a-z0-9]+/g, '') : '';

const courseLookup = (courseCatalog as Array<Record<string, any>>).reduce(
  (acc, course) => {
    const key = `${course.course_prefix || ''} ${course.course_number || ''}`
      .trim()
      .toLowerCase();
    if (key) acc[key] = course;
    return acc;
  },
  {} as Record<string, any>
);

type CourseCard = {
  id: string;
  code: string;
  name: string;
  credits: number;
  location: string;
  description: string;
};

type RawProgram = {
  program_name: string;
  years?: Array<{
    year_number?: number;
    semesters?: Array<{
      semester_name?: string;
      courses?: Array<{
        name?: string;
        credits?: number;
      }>;
    }>;
  }>;
};

type PathwaySectionProps = {
  nodes?: Array<Record<string, any>>;
  selectedMajorKey?: string;
  selectedMajorName?: string;
  campusInfo?: {
    name?: string;
    summary?: string;
    highlights?: string[];
  };
  onPlanDay?: (courses: CourseCard[]) => void;
};

function shapeCourse(course: any, fallbackId: string): CourseCard {
  // Extract course code and name from the course.name field (e.g., "ICS 111" or "MATH 215 or 241")
  const rawName = course?.name || '';
  const match = rawName.match?.(/([A-Z]{2,4})\s*(\d{3}[A-Z]?)/);
  
  const catalogKey = match
    ? `${match[1]} ${match[2]}`.toLowerCase()
    : rawName.toLowerCase();
  const catalogEntry = courseLookup[catalogKey];
  
  // Course code is the matched part (e.g., "ICS 111")
  const courseCode = match?.[0] || course?.course_code || course?.code || rawName || fallbackId;
  
  // Course name is either:
  // 1. Explicit title field from course
  // 2. The part after the code in the name field
  // 3. Lookup from catalog
  // 4. The raw name itself (if it doesn't start with a code)
  let courseName = '';
  if (course?.title) {
    courseName = course.title;
  } else if (match && rawName) {
    // Remove the code part and clean up
    courseName = rawName.replace(match[0], '').replace(/^[\s\-:]+/, '').trim();
    // If nothing left after removing code, use catalog or raw name
    if (!courseName) {
      courseName = catalogEntry?.course_title || rawName;
    }
  } else {
    courseName = catalogEntry?.course_title || rawName || `Course ${fallbackId}`;
  }
  
  // If courseName ended up empty or is just the code again, try catalog
  if (!courseName || courseName === courseCode) {
    courseName = catalogEntry?.course_title || 'Course';
  }
  
  return {
    id: String(course?.id || catalogKey || fallbackId),
    code: courseCode,
    name: courseName,
    credits: course?.credits || Number(catalogEntry?.num_units) || course?.credit || 3,
    location: course?.location || catalogEntry?.dept_name || 'UH Mānoa',
    description: course?.description || course?.course_desc || catalogEntry?.course_desc || 'Course details coming soon.',
  };
}

export default function PathwaySection({
  nodes = [],
  selectedMajorKey,
  selectedMajorName,
  campusInfo,
  onPlanDay,
}: PathwaySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState<CourseCard | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  console.log('[PathwaySection] Received nodes:', nodes?.length || 0, 'nodes');
  console.log('[PathwaySection] Selected major:', selectedMajorKey, selectedMajorName);

  useEffect(() => {
    const handler = () => setPulseKey((prev) => prev + 1);
    window.addEventListener('pathway:play', handler);
    return () => window.removeEventListener('pathway:play', handler);
  }, []);

  const highlightTerm = searchQuery.trim().toLowerCase();
  const normalizedMajor = useMemo(
    () => normalize(selectedMajorKey) || normalize(selectedMajorName),
    [selectedMajorKey, selectedMajorName]
  );

  const targetProgram = useMemo(() => {
    if (!normalizedMajor) return null;
    return (degreePathways as RawProgram[]).find((program) =>
      normalize(program.program_name).includes(normalizedMajor)
    );
  }, [normalizedMajor]);

  const programCourses = useMemo(() => {
    if (!targetProgram) return [];
    const flattened: CourseCard[] = [];
    targetProgram.years?.forEach((year, yearIdx) => {
      year.semesters?.forEach((semester, semIdx) => {
        semester.courses?.forEach((course, courseIdx) => {
          flattened.push(
            shapeCourse(course, `program-${yearIdx}-${semIdx}-${courseIdx}`)
          );
        });
      });
    });
    return flattened;
  }, [targetProgram]);

  const datasetGraph = useMemo(() => {
    if (!programCourses.length) return { nodes: [], edges: [] };
    const rfNodes: any[] = [];
    const rfEdges: any[] = [];

    let previousId: string | null = null;
    let index = 0;
    targetProgram?.years?.forEach((year, yearIdx) => {
      year.semesters?.forEach((semester, semIdx) => {
        semester.courses?.forEach((course, courseIdx) => {
          const courseCard = shapeCourse(course, `program-${yearIdx}-${semIdx}-${courseIdx}`);
          const nodeId = courseCard.id || `program-${index}`;
          const label = `${courseCard.code} ${courseCard.name}`.trim();
          const matchesSearch = highlightTerm
            ? label.toLowerCase().includes(highlightTerm)
            : true;

          rfNodes.push({
            id: nodeId,
            position: {
              x: semIdx * horizontalSpacing,
              y: yearIdx * yearSpacing + courseIdx * verticalSpacing,
            },
            data: {
              label: (
                <div
                  title={`${label} • ${courseCard.credits} credits • ${courseCard.location}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                    {courseCard.code}
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {courseCard.name}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {courseCard.credits} credits • {courseCard.location}
                  </span>
                </div>
              ),
              course: courseCard,
              matchesSearch,
            },
            selectable: true,
            style: {
              borderRadius: 16,
              border: `2px solid ${matchesSearch ? '#0d9488' : '#cbd5f5'}`,
              padding: 12,
              width: 220,
              background: matchesSearch ? '#ffffff' : '#f8fafc',
              boxShadow:
                matchesSearch && pulseKey % 2 === 0
                  ? '0 0 0 4px rgba(13,148,136,0.15)'
                  : '0 3px 12px rgba(15,23,42,0.08)',
              opacity: highlightTerm && !matchesSearch ? 0.35 : 1,
              transition: 'border 0.2s ease, opacity 0.2s ease',
              cursor: 'pointer',
            },
          });

          if (previousId) {
            rfEdges.push({
              id: `${previousId}-${nodeId}`,
              source: previousId,
              target: nodeId,
              animated: false,
              style: { stroke: '#0d9488', strokeWidth: 2 },
            });
          }

          previousId = nodeId;
          index += 1;
        });
      });
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [programCourses, targetProgram, highlightTerm, pulseKey]);

  const aiGraph = useMemo(() => {
    if (!nodes.length) return { nodes: [], edges: [] };
    const rfNodes: any[] = [];
    const rfEdges: any[] = [];

    // Group nodes by year and semester for better layout
    const nodesByYear: Record<number, Record<string, any[]>> = {};
    
    nodes.forEach((node, index) => {
      const year = node.year || 1;
      const semester = node.semester || 'fall_semester';
      
      if (!nodesByYear[year]) nodesByYear[year] = {};
      if (!nodesByYear[year][semester]) nodesByYear[year][semester] = [];
      
      nodesByYear[year][semester].push({ ...node, originalIndex: index });
    });

    // LAYOUT: Clean horizontal layout with rainbow road in the middle
    // Fall semester: TOP row
    // Spring semester: BOTTOM row
    // Rainbow road: HORIZONTAL line in the middle
    
    const semesterOrder = ['fall_semester', 'spring_semester', 'summer_semester'];
    const yearSpacing = 500; // horizontal space between years
    const fallYPosition = -300; // Fall courses ABOVE the rainbow
    const springYPosition = 400; // Spring courses BELOW the rainbow
    
    const years = Object.keys(nodesByYear).sort((a, b) => Number(a) - Number(b));
    
    // Rainbow colors for each year
    const yearColors = [
      { border: '#ef4444', bg: '#fef2f2', text: '#991b1b' }, // Year 1: Red
      { border: '#f59e0b', bg: '#fffbeb', text: '#92400e' }, // Year 2: Orange
      { border: '#10b981', bg: '#f0fdf4', text: '#065f46' }, // Year 3: Green
      { border: '#8b5cf6', bg: '#faf5ff', text: '#5b21b6' }, // Year 4: Purple
    ];
    
    years.forEach((yearStr, yearIndex) => {
      const year = Number(yearStr);
      const semestersInYear = nodesByYear[year];
      const colorScheme = yearColors[yearIndex % yearColors.length];
      
      const yearX = yearIndex * yearSpacing; // Years go LEFT to RIGHT
      
      semesterOrder.forEach((semester) => {
        const coursesInSemester = semestersInYear[semester] || [];
        
        coursesInSemester.forEach((node, courseIndex) => {
          const course = shapeCourse(node, `ai-${node.originalIndex}`);
          const nodeId = node.id || course.id || `ai-${node.originalIndex}`;
          const label = `${course.code} ${course.name}`.trim();
          const matchesSearch = highlightTerm
            ? label.toLowerCase().includes(highlightTerm)
            : true;

          // Position calculation: VERTICAL STACKING within each semester
          // Fall: TOP (stacked vertically), Spring: BOTTOM (stacked vertically)
          let posX = yearX;
          let posY = 0;
          
          if (semester === 'fall_semester') {
            posY = fallYPosition - (courseIndex * 120); // Stack Fall courses upward
          } else if (semester === 'spring_semester') {
            posY = springYPosition + (courseIndex * 120); // Stack Spring courses downward
          } else if (semester === 'summer_semester') {
            posY = springYPosition + 400 + (courseIndex * 120); // Summer even further below
          }
          
          const semesterLabel = semester.replace('_semester', '').toUpperCase();

          rfNodes.push({
            id: nodeId,
            position: { x: posX, y: posY },
            data: {
              label: (
                <div
                  title={`Year ${year} • ${semesterLabel} • ${course.credits} credits`}
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    color: colorScheme.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Year {year} • {semesterLabel}
                  </div>
                  <strong style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
                    {course.code}
                  </strong>
                  <span style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.3 }}>
                    {course.name}
                  </span>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b',
                    marginTop: 2,
                    fontWeight: 600
                  }}>
                    ✨ {course.credits} credits
                  </div>
                </div>
              ),
              course,
              matchesSearch,
              year,
              semester,
            },
            style: {
              borderRadius: 16,
              border: `3px solid ${matchesSearch ? colorScheme.border : '#e2e8f0'}`,
              padding: 14,
              width: 260,
              background: matchesSearch ? '#ffffff' : colorScheme.bg,
              opacity: highlightTerm && !matchesSearch ? 0.4 : 1,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              boxShadow: matchesSearch 
                ? `0 8px 24px -4px ${colorScheme.border}40, 0 0 0 3px ${colorScheme.border}20`
                : '0 4px 12px rgba(15,23,42,0.08)',
            },
          });
        });
      });
    });

    // Create the horizontal rainbow road
    const rainbowPathNodes: any[] = [];
    const rainbowY = 0; 
    
    years.forEach((yearStr, yearIndex) => {
      const year = Number(yearStr);
      const yearX = yearIndex * yearSpacing;
      const colorScheme = yearColors[yearIndex % yearColors.length];
      const waypointId = `path-segment-year-${year}`;
      
      const isFirst = yearIndex === 0;
      
      // Dimensions
      const width = 550;
      const height = 100;
      
      // Position
      // Center the segment relative to the course column
      const posX = yearX - 120;
      
      // Clip Path
      const arrowHeadStart = '90%';
      const arrowHeadTip = '100%';
      const arrowTailDepth = '10%';
      
      let clipPath = '';
      if (isFirst) {
        clipPath = `polygon(0% 0%, ${arrowHeadStart} 0%, ${arrowHeadTip} 50%, ${arrowHeadStart} 100%, 0% 100%)`;
      } else {
        clipPath = `polygon(0% 0%, ${arrowHeadStart} 0%, ${arrowHeadTip} 50%, ${arrowHeadStart} 100%, 0% 100%, ${arrowTailDepth} 50%)`;
      }

      rainbowPathNodes.push({
        id: waypointId,
        position: { x: posX, y: rainbowY },
        data: { 
            year,
            label: (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    gap: '12px',
                    paddingRight: isFirst ? '20px' : '0',
                    paddingLeft: isFirst ? '0' : '20px'
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)',
                        color: colorScheme.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        border: `3px solid ${colorScheme.text}`
                    }}>
                        {year}
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center'
                    }}>
                        <span style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 800,
                            fontSize: '1.4rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            lineHeight: 1
                        }}>
                            Year {year}
                        </span>
                        <div style={{
                            marginTop: '6px',
                            position: 'relative',
                            display: 'inline-block'
                        }}>
                            <select 
                                style={{
                                    appearance: 'none',
                                    padding: '8px 32px 8px 16px',
                                    background: '#ffffff',
                                    borderRadius: '999px',
                                    fontSize: '0.85rem',
                                    fontFamily: 'inherit',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    border: '2px solid #cbd5f5',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '160px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    const selectedTerm = e.target.value; // "Fall" or "Spring"
                                    if (onPlanDay && selectedTerm !== 'default') {
                                        const semesterKey = selectedTerm.toLowerCase() + '_semester';
                                        // Find courses for this year and semester
                                        const relevantNodes = nodes.filter(n => 
                                            n.year === year && n.semester === semesterKey
                                        );
                                        
                                        if (relevantNodes.length > 0) {
                                            // Pick 3 random courses
                                            const shuffled = [...relevantNodes].sort(() => 0.5 - Math.random());
                                            const selected = shuffled.slice(0, 3);
                                            
                                            const courseCards = selected.map((n, idx) => 
                                                shapeCourse(n, `plan-${year}-${semesterKey}-${idx}`)
                                            );
                                            
                                            onPlanDay(courseCards);
                                            
                                            // Scroll to map section
                                            const mapSection = document.getElementById('uh-map');
                                            if (mapSection) {
                                                mapSection.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        } else {
                                            alert(`No courses found for Year ${year} ${selectedTerm}. Try another semester!`);
                                        }
                                    }
                                    e.target.value = 'default'; // Reset to default
                                }}
                                defaultValue="default"
                            >
                                <option value="default" disabled style={{ color: '#94a3b8' }}>Plan this Out</option>
                                <option value="Fall" style={{ color: '#1e293b' }}>Fall</option>
                                <option value="Spring" style={{ color: '#1e293b' }}>Spring</option>
                            </select>
                            <div style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#64748b',
                                fontSize: '0.6rem'
                            }}>
                                ▼
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        style: {
          width: width,
          height: height,
          background: `linear-gradient(135deg, ${colorScheme.border}, ${colorScheme.text})`,
          clipPath: clipPath,
          border: 'none',
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          zIndex: -1,
          pointerEvents: 'all',
          cursor: 'pointer',
        },
        draggable: false,
        selectable: true,
      });
    });
    
    // Add waypoint nodes to the graph
    rfNodes.push(...rainbowPathNodes);
    
    // Connect courses sequentially (course to course in chronological order)
    let previousNodeId: string | null = null;
    
    years.forEach((yearStr) => {
      const year = Number(yearStr);
      const semestersInYear = nodesByYear[year];
      
      semesterOrder.forEach((semester) => {
        const coursesInSemester = semestersInYear[semester] || [];
        
        coursesInSemester.forEach((node) => {
          const nodeId = node.id || shapeCourse(node, `ai-${node.originalIndex}`).id || `ai-${node.originalIndex}`;
          
          // Connect to previous course in sequence
          if (previousNodeId) {
            rfEdges.push({
              id: `${previousNodeId}-to-${nodeId}`,
              source: previousNodeId,
              target: nodeId,
              animated: false,
              type: 'smoothstep',
              style: { 
                stroke: '#94a3b8',
                strokeWidth: 2,
                opacity: 0.4,
              },
            });
          }
          
          previousNodeId = nodeId;
        });
      });
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [nodes, highlightTerm]);

  const graph = nodes.length ? aiGraph : datasetGraph;
  const hasData = graph.nodes.length > 0;
  const title = selectedMajorName || selectedMajorKey || 'Your Program';

  console.log('[PathwaySection] Using graph type:', nodes.length ? 'AI' : 'Dataset');
  console.log('[PathwaySection] Graph has', graph.nodes.length, 'nodes and', graph.edges.length, 'edges');
  console.log('[PathwaySection] hasData:', hasData);

  return (
    <div className="pathway-container">
      <h2 className="pathway-title">Pathway: {title}</h2>
      <p className="pathway-subtitle">Tap a course to see credits, location, and tips</p>

      <div
        className="pathway-search"
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search or highlight a course (e.g., ICS 111)"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 999,
            border: '2px solid #cbd5f5',
            minWidth: '260px',
            maxWidth: '420px',
            color: '#1e293b',
            background: '#ffffff',
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="map-pill"
            style={{ padding: '0.55rem 1.25rem' }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="pathway-layout">
        {/* Campus Rundown Box */}
        {campusInfo && (
          <div className="campus-rundown-box">
            <h3 className="campus-rundown-title">🏝️ Campus Highlights</h3>
            {campusInfo.name && <h4 className="campus-name">{campusInfo.name}</h4>}
            {campusInfo.summary && <p className="campus-summary">{campusInfo.summary}</p>}
            {campusInfo.highlights && campusInfo.highlights.length > 0 && (
              <ul className="campus-highlights">
                {campusInfo.highlights.map((highlight, idx) => (
                  <li key={idx}>{highlight}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Pathway Flow */}
        {hasData ? (
          <div
            className="flow-wrapper"
            style={{
              height: '70vh',
              minHeight: 360,
              borderRadius: 20,
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 10px 40px rgba(15,23,42,0.08)',
            }}
          >
            <ReactFlow
              nodes={graph.nodes}
              edges={graph.edges}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              onNodeClick={(_, node) => {
                if (node.id.startsWith('path-segment-year-')) {
                  return;
                }
                setActiveCourse(node.data?.course || null);
              }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              zoomOnDoubleClick={false}
              panOnDrag
            >
              <MiniMap pannable zoomable style={{ background: '#f8fafc' }} />
              <Controls showInteractive={false} />
              <Background gap={24} color="#e2e8f0" />
            </ReactFlow>
          </div>
        ) : (
          <div className="path-placeholder">
            <h3 className="path-placeholder-title">Pick a major to see its pathway</h3>
            <p className="path-placeholder-desc">
              Once a major is selected, we load the UH Mānoa four-year sequence and display it here.
            </p>
          </div>
        )}
      </div>

      {activeCourse && (
        <div className="pathway-popup-backdrop visible">
          <div className="pathway-popup visible">
            <button className="popup-close" onClick={() => setActiveCourse(null)}>
              ×
            </button>
            <div className="popup-content">
              <h3 className="popup-title">{activeCourse.code}</h3>
              <div className="popup-meta">
                <div className="popup-meta-item">
                  <span className="meta-label">Course</span>
                  <span className="meta-value">{activeCourse.name}</span>
                </div>
                <div className="popup-meta-item">
                  <span className="meta-label">Credits</span>
                  <span className="meta-value">{activeCourse.credits}</span>
                </div>
                <div className="popup-meta-item">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">{activeCourse.location}</span>
                </div>
              </div>
              <div className="popup-description">
                <h4>What to expect</h4>
                <p>{activeCourse.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
