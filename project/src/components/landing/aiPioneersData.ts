export interface AiPioneer {
  id: string;
  name: string;
  years: string;
  role: string;
  passedAway: boolean;
  contribution: string;
  institution: string;
  quote: string;
  keyWork: string;
  badge: string;
}

export const AI_PIONEERS_COUNT = 10;
export const AI_PIONEERS_PASSED = 9;

export const AI_PIONEERS: AiPioneer[] = [
  {
    id: 'mccarthy',
    name: 'John McCarthy',
    years: '1927 – 2011',
    role: 'Father of Artificial Intelligence',
    passedAway: true,
    contribution: 'Coined the term "Artificial Intelligence" in 1955, organized the historic 1956 Dartmouth Summer Research Project, and invented the LISP programming language.',
    institution: 'Dartmouth College & Stanford University',
    quote: 'As soon as it works, no one calls it AI anymore.',
    keyWork: '1956 Dartmouth AI Proposal & LISP Programming Language',
    badge: 'Organized Dartmouth 1956',
  },
  {
    id: 'minsky',
    name: 'Marvin Minsky',
    years: '1927 – 2016',
    role: 'Co-Founder of MIT AI Lab',
    passedAway: true,
    contribution: 'Pioneered artificial neural networks, author of "Perceptrons", created the first head-mounted graphical display, and formulated the "Society of Mind" theory of intelligence.',
    institution: 'Massachusetts Institute of Technology (MIT)',
    quote: 'You don\'t understand anything until you learn it more than one way.',
    keyWork: 'Perceptrons (1969) & Society of Mind (1986)',
    badge: 'MIT AI Lab Founder',
  },
  {
    id: 'shannon',
    name: 'Claude Shannon',
    years: '1916 – 2001',
    role: 'Father of Information Theory',
    passedAway: true,
    contribution: 'Founded digital circuit design theory in 1937, established mathematical Information Theory in 1948, and built "Theseus", the world\'s first electromechanical learning mouse.',
    institution: 'Bell Labs & MIT',
    quote: 'Information is the resolution of uncertainty.',
    keyWork: 'A Mathematical Theory of Communication (1948)',
    badge: 'Information Theory Architect',
  },
  {
    id: 'rochester',
    name: 'Nathaniel Rochester',
    years: '1919 – 2001',
    role: 'Architect of the IBM 701',
    passedAway: true,
    contribution: 'Chief architect of IBM\'s first commercial scientific computer (IBM 701), wrote the first symbolic assembler, and co-authored the 1956 Dartmouth AI proposal.',
    institution: 'IBM Corporation',
    quote: 'We propose that a 2-month, 10-man study of artificial intelligence be carried out.',
    keyWork: 'IBM 701 Architecture & First Symbolic Assembler',
    badge: 'IBM Chief Computer Architect',
  },
  {
    id: 'samuel',
    name: 'Arthur Samuel',
    years: '1901 – 1990',
    role: 'Pioneer of Machine Learning',
    passedAway: true,
    contribution: 'Coined the phrase "Machine Learning" in 1959. Built the world\'s first self-learning checkers engine running on the IBM 701 using alpha-beta pruning and heuristic evaluation.',
    institution: 'IBM & Stanford University',
    quote: 'Machine learning: field of study that gives computers the ability to learn without being explicitly programmed.',
    keyWork: 'Self-Learning Checkers Program (1956–1959)',
    badge: 'Coined "Machine Learning"',
  },
  {
    id: 'simon',
    name: 'Herbert A. Simon',
    years: '1916 – 2001',
    role: 'Nobel Laureate & Turing Award Winner',
    passedAway: true,
    contribution: 'Co-created the Logic Theory Machine (the first true artificial intelligence program) in 1956 and the General Problem Solver (GPS). Nobel Prize in Economics (1978).',
    institution: 'Carnegie Mellon University',
    quote: 'A wealth of information creates a poverty of attention.',
    keyWork: 'Logic Theory Machine (1956) & Bounded Rationality',
    badge: 'Nobel & Turing Laureate',
  },
  {
    id: 'newell',
    name: 'Allen Newell',
    years: '1927 – 1992',
    role: 'Pioneer of Cognitive Architecture',
    passedAway: true,
    contribution: 'Co-authored the Logic Theorist and General Problem Solver with Simon. Created Information Processing Language (IPL) and the SOAR cognitive architecture. Turing Award (1975).',
    institution: 'Carnegie Mellon & RAND Corporation',
    quote: 'The mind is a physical symbol system that realizes universal computation.',
    keyWork: 'General Problem Solver (GPS) & SOAR Architecture',
    badge: 'Turing Award Winner',
  },
  {
    id: 'solomonoff',
    name: 'Ray Solomonoff',
    years: '1926 – 2009',
    role: 'Inventor of Algorithmic Probability',
    passedAway: true,
    contribution: 'Formulated Algorithmic Probability and Solomonoff Induction in 1960, providing the rigorous mathematical foundation for machine learning, compression, and universal induction.',
    institution: 'Dartmouth 1956 & Zator Company',
    quote: 'Induction is the search for the shortest computational hypothesis.',
    keyWork: 'Algorithmic Probability & Universal Induction (1960)',
    badge: 'Algorithmic Probability Founder',
  },
  {
    id: 'selfridge',
    name: 'Oliver Selfridge',
    years: '1926 – 2008',
    role: 'Father of Machine Perception',
    passedAway: true,
    contribution: 'Created the "Pandemonium" architecture in 1959, an early multi-layer model of feature demons that directly anticipated convolutional networks and deep learning.',
    institution: 'Lincoln Laboratory & MIT',
    quote: 'Computation allows hierarchies of perception to emerge from chaotic demons.',
    keyWork: 'Pandemonium: A Paradigm for Learning (1959)',
    badge: 'Machine Perception Pioneer',
  },
  {
    id: 'more',
    name: 'Trenchard More',
    years: '1930 – 2019',
    role: 'Inventor of Array Theory',
    passedAway: true,
    contribution: 'Participated in the historic 1956 Dartmouth conference. Invented Array Theory and developed models for deductive nested logic used in database systems and computational logic.',
    institution: 'Dartmouth College & IBM Research',
    quote: 'Mathematical structures provide the nested lattice upon which thinking runs.',
    keyWork: 'Array Theory & Formal Logic (1956–1979)',
    badge: 'Array Theory Inventor',
  },
];

export const FATHER_DAUGHTER_LEGACY = {
  title: 'From Pioneers to Posterity: Father & Daughter Continuity',
  tagline: 'Passing the Torch of Safe, Sovereign AI to Future Generations',
  narrative:
    'The foundational 10 pioneers solved the mathematical mystery of artificial thought. Today, as 9 of the 10 have passed into history, our sacred responsibility is to ensure AI serves human flourishing. The father and daughter motif represents generational trust: a parent guiding their child through a digital world safeguarded by sovereign, transparent, and private intelligence.',
  principles: [
    {
      title: 'Zero Exploitation of Young Minds',
      desc: 'Our children must grow up with AI that educates and protects, never tracking, profiling, or monetizing their curiosity.',
    },
    {
      title: 'Humanity at the Center',
      desc: 'Machines compute, but fathers, mothers, and families provide love, ethics, and wisdom. SG16 AI Engine keeps human values sovereign.',
    },
    {
      title: 'The Unbroken Mathematical Chain',
      desc: 'From Dartmouth 1956 to your living room in 2026 — seventy years of computer science preserved in clean, transparent sovereign code.',
    },
  ],
};
