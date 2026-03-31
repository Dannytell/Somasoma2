export interface Topic {
  id: string;
  name: string;
  form: 1 | 2 | 3 | 4;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  topics: Topic[];
}

export const KENYAN_CURRICULUM: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    icon: 'Calculator',
    topics: [
      { id: 'm1-1', name: 'Natural Numbers', form: 1 },
      { id: 'm1-2', name: 'Factors', form: 1 },
      { id: 'm1-3', name: 'Divisibility Tests', form: 1 },
      { id: 'm1-4', name: 'GCD & LCM', form: 1 },
      { id: 'm1-5', name: 'Integers', form: 1 },
      { id: 'm1-6', name: 'Fractions & Decimals', form: 1 },
      { id: 'm1-7', name: 'Squares & Square Roots', form: 1 },
      { id: 'm1-8', name: 'Algebraic Expressions', form: 1 },
      { id: 'm2-1', name: 'Cubes & Cube Roots', form: 2 },
      { id: 'm2-2', name: 'Reciprocals', form: 2 },
      { id: 'm2-3', name: 'Indices & Logarithms', form: 2 },
      { id: 'm2-4', name: 'Equations of Straight Lines', form: 2 },
      { id: 'm3-1', name: 'Quadratic Expressions', form: 3 },
      { id: 'm3-2', name: 'Approximation & Errors', form: 3 },
      { id: 'm3-3', name: 'Trigonometry II', form: 3 },
      { id: 'm3-4', name: 'Surds', form: 3 },
      { id: 'm4-1', name: 'Matrices & Transformations', form: 4 },
      { id: 'm4-2', name: 'Statistics II', form: 4 },
      { id: 'm4-3', name: 'Loci', form: 4 },
      { id: 'm4-4', name: 'Calculus', form: 4 },
    ]
  },
  {
    id: 'bio',
    name: 'Biology',
    icon: 'Dna',
    topics: [
      { id: 'b1-1', name: 'Introduction to Biology', form: 1 },
      { id: 'b1-2', name: 'Classification I', form: 1 },
      { id: 'b1-3', name: 'The Cell', form: 1 },
      { id: 'b1-4', name: 'Cell Physiology', form: 1 },
      { id: 'b2-1', name: 'Nutrition in Plants & Animals', form: 2 },
      { id: 'b2-2', name: 'Transport in Plants & Animals', form: 2 },
      { id: 'b2-3', name: 'Gaseous Exchange', form: 2 },
      { id: 'b3-1', name: 'Classification II', form: 3 },
      { id: 'b3-2', name: 'Ecology', form: 3 },
      { id: 'b3-3', name: 'Reproduction', form: 3 },
      { id: 'b4-1', name: 'Genetics', form: 4 },
      { id: 'b4-2', name: 'Evolution', form: 4 },
      { id: 'b4-3', name: 'Reception & Response', form: 4 },
    ]
  },
  {
    id: 'phy',
    name: 'Physics',
    icon: 'Zap',
    topics: [
      { id: 'p1-1', name: 'Introduction to Physics', form: 1 },
      { id: 'p1-2', name: 'Measurement I', form: 1 },
      { id: 'p1-3', name: 'Force', form: 1 },
      { id: 'p1-4', name: 'Pressure', form: 1 },
      { id: 'p2-1', name: 'Magnetism', form: 2 },
      { id: 'p2-2', name: 'Measurement II', form: 2 },
      { id: 'p2-3', name: 'Turning Effect of a Force', form: 2 },
      { id: 'p3-1', name: 'Linear Motion', form: 3 },
      { id: 'p3-2', name: 'Refraction of Light', form: 3 },
      { id: 'p3-3', name: 'Newton\'s Laws of Motion', form: 3 },
      { id: 'p4-1', name: 'Thin Lenses', form: 4 },
      { id: 'p4-2', name: 'Uniform Circular Motion', form: 4 },
      { id: 'p4-3', name: 'Floating & Sinking', form: 4 },
    ]
  },
  {
    id: 'chem',
    name: 'Chemistry',
    icon: 'FlaskConical',
    topics: [
      { id: 'c1-1', name: 'Introduction to Chemistry', form: 1 },
      { id: 'c1-2', name: 'Simple Classification of Substances', form: 1 },
      { id: 'c1-3', name: 'Acids, Bases & Indicators', form: 1 },
      { id: 'c2-1', name: 'Structure of the Atom', form: 2 },
      { id: 'c2-2', name: 'Chemical Families', form: 2 },
      { id: 'c2-3', name: 'Structure & Bonding', form: 2 },
      { id: 'c3-1', name: 'Gas Laws', form: 3 },
      { id: 'c3-2', name: 'The Mole', form: 3 },
      { id: 'c3-3', name: 'Organic Chemistry I', form: 3 },
      { id: 'c4-1', name: 'Acids, Bases & Salts II', form: 4 },
      { id: 'c4-2', name: 'Energy Changes', form: 4 },
      { id: 'c4-3', name: 'Reaction Rates', form: 4 },
    ]
  }
];
