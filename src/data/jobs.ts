export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  model: 'Remote' | 'Hybrid' | 'On-site';
  type: string;
  summary: string;
}

export const JOBS: Job[] = [
  {
    id: 'mg-01',
    title: 'Lead Solar PV CAD & 3D Shading Engineer',
    department: 'Engineering',
    location: 'Bengaluru, India',
    model: 'Hybrid',
    type: 'Full-time',
    summary: 'Architect our automated 3D rooftop modeling, ray-tracing shadow simulations, and CAD export engine.',
  },
  {
    id: 'mg-02',
    title: 'Senior Full-Stack Engineer (Solar OS)',
    department: 'Engineering',
    location: 'Remote (India)',
    model: 'Remote',
    type: 'Full-time',
    summary: 'Build scalable clean energy microservices, real-time inverter websocket brokers, and EPC CRM workflows.',
  },
  {
    id: 'mg-03',
    title: 'IoT Embedded Firmware Engineer (Inverter Cloud)',
    department: 'Engineering',
    location: 'Hyderabad, India',
    model: 'Hybrid',
    type: 'Full-time',
    summary: 'Develop hardware abstraction layers, Modbus RS-485 interfaces, and edge telemetry gateways for central & string inverters.',
  },
  {
    id: 'mg-04',
    title: 'Solar DISCOM & PM-Surya Ghar Regulatory Specialist',
    department: 'Operations',
    location: 'New Delhi, India',
    model: 'On-site',
    type: 'Full-time',
    summary: 'Lead national portal compliance, state DISCOM net-metering integration, and subsidy disbursement automation.',
  },
  {
    id: 'mg-05',
    title: 'Product Designer (CleanTech & Industrial UX)',
    department: 'Design',
    location: 'Bengaluru, India',
    model: 'Hybrid',
    type: 'Full-time',
    summary: 'Craft high-efficiency, intuitive interfaces for solar survey engineers, procurement managers, and C&I asset owners.',
  },
  {
    id: 'mg-06',
    title: 'Enterprise EPC Account Executive',
    department: 'Go-to-Market',
    location: 'Mumbai, India',
    model: 'Hybrid',
    type: 'Full-time',
    summary: 'Drive strategic partnerships with tier-1 solar developers, renewable IPPs, and commercial EPC contractors.',
  },
  {
    id: 'mg-07',
    title: 'Field Operations & Site Survey Lead',
    department: 'Operations',
    location: 'Ahmedabad, India',
    model: 'On-site',
    type: 'Full-time',
    summary: 'Manage national field survey teams, drone mapping protocols, and geotagged rooftop feasibility audits.',
  },
  {
    id: 'mg-08',
    title: 'Solar Supply Chain & BOM Procurement Specialist',
    department: 'Operations',
    location: 'Chennai, India',
    model: 'Hybrid',
    type: 'Full-time',
    summary: 'Optimize component price books, module allocation algorithms, and warehouse stock synchronizations.',
  },
];

export const DEPARTMENTS = ['All', 'Engineering', 'Design', 'Operations', 'Go-to-Market'] as const;

export const PERKS = [
  'Competitive salary + stock options in MetaGreen Foundation',
  'Remote-first flexibility with quarterly clean energy retreats',
  'Annual continuous learning & conference budget of ₹1,50,000',
  'Comprehensive health insurance for you and your dependents',
  'Home office setup allowance and top-tier M-series hardware',
  'Direct positive environmental impact reducing gigatons of CO2',
];
