export interface SkillCategory {
  category: string
  icon: string
  skills: string[]
}

export const DOMAIN_OPTIONS: string[] = [
  'AI / ML',
  'AR / VR',
  'Automation',
  'Blockchain',
  'Civil Engineering',
  'Cloud Computing',
  'Computer Vision',
  'Cyber Security',
  'Data Science',
  'DevOps',
  'Electrical Engineering',
  'Electronics',
  'Embedded Systems',
  'Game Development',
  'IoT',
  'Manufacturing',
  'Mechanical Design',
  'Mechatronics',
  'Mobile Development',
  'Renewable Energy',
  'Robotics',
  'Web Development',
]

export const SKILL_LIBRARY: SkillCategory[] = [
  {
    category: 'Programming',
    icon: 'Code',
    skills: ['C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'MATLAB', 'VHDL', 'Verilog'],
  },
  {
    category: 'Frontend',
    icon: 'Layout',
    skills: ['React', 'Angular', 'Vue', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Redux', 'Svelte', 'Bootstrap'],
  },
  {
    category: 'Backend',
    icon: 'Server',
    skills: ['Spring Boot', 'Node.js', 'Express', 'Django', 'Flask', 'ASP.NET', 'FastAPI', 'NestJS', 'Ruby on Rails'],
  },
  {
    category: 'Database',
    icon: 'Database',
    skills: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Firebase', 'Cassandra', 'Oracle'],
  },
  {
    category: 'Embedded Systems',
    icon: 'Cpu',
    skills: ['Embedded C', 'Arduino', 'ESP32', 'STM32', 'Raspberry Pi', 'FreeRTOS', 'Microcontrollers', 'Assembly', 'FPGA'],
  },
  {
    category: 'Robotics & Control',
    icon: 'Bot',
    skills: ['ROS', 'ROS2', 'Gazebo', 'OpenCV', 'MoveIt', 'SLAM', 'Kinematics', 'Control Systems', 'LiDAR'],
  },
  {
    category: 'Mechanical Design',
    icon: 'Cog',
    skills: ['SolidWorks', 'Fusion 360', 'AutoCAD', 'CATIA', 'ANSYS', 'FEA', 'CFD', '3D Printing', 'GD&T'],
  },
  {
    category: 'PCB & Electronics',
    icon: 'Zap',
    skills: ['EasyEDA', 'KiCad', 'Altium', 'PCB Design', 'Circuit Design', 'Signal Processing', 'Power Electronics', 'Oscilloscopes'],
  },
  {
    category: 'Electrical & Automation',
    icon: 'Activity',
    skills: ['PLC', 'SCADA', 'Motor Control', 'Industrial Automation', 'High Voltage Systems', 'Power Systems', 'MATLAB Simulink'],
  },
  {
    category: 'Cloud & DevOps',
    icon: 'Cloud',
    skills: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux', 'Terraform'],
  },
  {
    category: 'AI & Data Science',
    icon: 'Brain',
    skills: ['TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Scikit-learn', 'Data Analysis', 'Pandas'],
  },
  {
    category: 'Civil & Structural',
    icon: 'Building',
    skills: ['ETABS', 'STAAD Pro', 'Revit', 'GIS', 'Surveying', 'Structural Analysis', 'BIM'],
  },
  {
    category: 'Other Engineering',
    icon: 'Globe',
    skills: ['Game Development', 'AR / VR', 'Cyber Security', 'Blockchain', 'Renewable Energy', 'Manufacturing', 'IoT', 'Mechatronics'],
  },
]

// Flattened list of all valid skills for quick lookup & verification
export const ALL_SKILLS: string[] = Array.from(
  new Set(SKILL_LIBRARY.flatMap(cat => cat.skills))
).sort()
