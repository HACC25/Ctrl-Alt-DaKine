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
};

function shapeCourse(course: any, fallbackId: string): CourseCard {
  const match = course?.name?.match?.(/([A-Z]{2,4})\s*(\d{3}[A-Z]?)/);
  const catalogKey = match
    ? `${match[1]} ${match[2]}`.toLowerCase()
    : (course?.name || '').toLowerCase();
  const catalogEntry = courseLookup[catalogKey];
  return {
    id: String(course?.id || catalogKey || fallbackId),
    code: match?.[0] || course?.course_code || course?.code || fallbackId,
    name:
      course?.title ||
      (course?.name && course?.name.replace(match?.[0] || '', '').trim()) ||
      course?.name ||
      `Course ${fallbackId}`,
    credits:
      course?.credits ||
      Number(catalogEntry?.num_units) ||
      course?.credit ||
      3,
    location: course?.location || catalogEntry?.dept_name || 'UH Mānoa',
    description:
      course?.description ||
      course?.course_desc ||
      catalogEntry?.course_desc ||
      'Course details coming soon.',
  };
}

export default function PathwaySection({
  nodes = [],
  selectedMajorKey,
  selectedMajorName,
  campusInfo,
}: PathwaySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCourse, setActiveCourse] = useState<CourseCard | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

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
              animated: true,
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

    nodes.forEach((node, index) => {
      const course = shapeCourse(node, `ai-${index}`);
      const nodeId = course.id || `ai-${index}`;
      const label = `${course.code} ${course.name}`.trim();
      const matchesSearch = highlightTerm
        ? label.toLowerCase().includes(highlightTerm)
        : true;

      rfNodes.push({
        id: nodeId,
        position: {
          x: (index % 4) * horizontalSpacing,
          y: Math.floor(index / 4) * verticalSpacing,
        },
        data: {
          label: (
            <div
              title={`${label} • ${course.credits} credits • ${course.location}`}
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              <strong style={{ fontSize: '0.95rem', color: '#312e81' }}>
                {course.code}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#4338ca' }}>
                {course.name}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#6366f1' }}>
                {course.credits} credits • {course.location}
              </span>
            </div>
          ),
          course,
          matchesSearch,
        },
        style: {
          borderRadius: 16,
          border: `2px solid ${matchesSearch ? '#6366f1' : '#c7d2fe'}`,
          padding: 12,
          width: 220,
          background: matchesSearch ? '#ffffff' : '#f5f3ff',
          opacity: highlightTerm && !matchesSearch ? 0.35 : 1,
          transition: 'border 0.2s ease, opacity 0.2s ease',
          cursor: 'pointer',
        },
      });

      if (index > 0) {
        const prev = shapeCourse(nodes[index - 1], `ai-${index - 1}`).id || `ai-${index - 1}`;
        rfEdges.push({
          id: `${prev}-${nodeId}`,
          source: prev,
          target: nodeId,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
        });
      }
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [nodes, highlightTerm]);

  const graph = nodes.length ? aiGraph : datasetGraph;
  const hasData = graph.nodes.length > 0;
  const title = selectedMajorName || selectedMajorKey || 'Your Program';

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
              onNodeClick={(_, node) => setActiveCourse(node.data?.course || null)}
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
