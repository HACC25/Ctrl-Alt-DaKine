import React from 'react';
import PathwaySection from './PathwaySection';
import type { PathwayNodeData } from './PathwaySection';

/**
 * Example usage of the Pathway Visualization component
 * 
 * To integrate into your app:
 * 1. Import PathwaySection
 * 2. Pass an array of PathwayNodeData with your courses
 * 3. Each node needs: id, courseName, credits, location, description, position (0-1)
 */
const PathwayExample: React.FC = () => {
  // Sample pathway data - replace with your actual course data
  const samplePathway: PathwayNodeData[] = [
    {
      id: '1',
      courseName: 'ICS 111',
      credits: 4,
      location: 'Mānoa Campus',
      description: 'Introduction to Computer Science I. Fundamental problem solving techniques using programming. Emphasizes algorithm development, debugging, and program design.',
      position: 0.0,
    },
    {
      id: '2',
      courseName: 'ICS 211',
      credits: 4,
      location: 'Mānoa Campus',
      description: 'Introduction to Computer Science II. Continuation of ICS 111. Advanced programming techniques using object-oriented design, data structures, and algorithms.',
      position: 0.15,
    },
    {
      id: '3',
      courseName: 'ICS 241',
      credits: 3,
      location: 'Mānoa Campus',
      description: 'Discrete Mathematics for Computer Science I. Logic, sets, functions, matrices, algorithmic concepts, mathematical reasoning, recursion, counting techniques.',
      position: 0.30,
    },
    {
      id: '4',
      courseName: 'ICS 311',
      credits: 3,
      location: 'Mānoa Campus',
      description: 'Algorithms. Design and analysis of algorithms: graph, geometry, NP-completeness, divide-and-conquer, dynamic programming, greedy algorithms.',
      position: 0.45,
    },
    {
      id: '5',
      courseName: 'ICS 314',
      credits: 3,
      location: 'Mānoa Campus',
      description: 'Software Engineering I. System specification, design, implementation, testing, and maintenance. Project management, team programming, agile methods.',
      position: 0.60,
    },
    {
      id: '6',
      courseName: 'ICS 414',
      credits: 3,
      location: 'Mānoa Campus',
      description: 'Software Engineering II. Advanced software engineering topics. Large-scale software development with modern frameworks and deployment practices.',
      position: 0.75,
    },
    {
      id: '7',
      courseName: 'ICS Elective',
      credits: 3,
      location: 'Mānoa Campus',
      description: 'Choose from advanced topics: AI, cybersecurity, data science, mobile development, or specialized areas aligned with your career goals.',
      position: 1.0,
    },
  ];

  return (
    <div className="pathway-example-container">
      <PathwaySection nodes={samplePathway} />
    </div>
  );
};

export default PathwayExample;
