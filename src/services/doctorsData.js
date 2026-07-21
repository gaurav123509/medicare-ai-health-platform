const createDoctorImage = (name, colors) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="560" height="420" viewBox="0 0 560 420">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${colors[0]}" />
          <stop offset="100%" stop-color="${colors[1]}" />
        </linearGradient>
      </defs>
      <rect width="560" height="420" rx="44" fill="url(#bg)" />
      <circle cx="280" cy="136" r="74" fill="rgba(255,255,255,0.22)" />
      <path d="M180 318c18-61 60-96 100-96s82 35 100 96" fill="rgba(255,255,255,0.2)" />
      <rect x="46" y="44" width="122" height="34" rx="17" fill="rgba(255,255,255,0.18)" />
      <text x="107" y="66" text-anchor="middle" fill="white" font-size="22" font-family="IBM Plex Sans, Arial, sans-serif" font-weight="700">MediCare AI</text>
      <text x="280" y="155" text-anchor="middle" fill="white" font-size="54" font-family="Manrope, Arial, sans-serif" font-weight="800">${initials}</text>
      <text x="280" y="368" text-anchor="middle" fill="white" font-size="32" font-family="IBM Plex Sans, Arial, sans-serif" font-weight="600">${name}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const doctors = [
  {
    id: 1,
    name: 'Dr. Amit Sharma',
    specialization: 'Cardiologist',
    experience: 10,
    consultationFee: 500,
    mode: 'online',
    rating: 4.7,
    image: createDoctorImage('Dr. Amit Sharma', ['#0ea5e9', '#2563eb']),
  },
  {
    id: 2,
    name: 'Dr. Neha Mehta',
    specialization: 'Dermatologist',
    experience: 8,
    consultationFee: 400,
    mode: 'both',
    rating: 4.5,
    image: createDoctorImage('Dr. Neha Mehta', ['#38bdf8', '#0284c7']),
  },
  {
    id: 3,
    name: 'Dr. Rahul Verma',
    specialization: 'Neurologist',
    experience: 12,
    consultationFee: 700,
    mode: 'online',
    rating: 4.8,
    image: createDoctorImage('Dr. Rahul Verma', ['#0891b2', '#164e63']),
  },
  {
    id: 4,
    name: 'Dr. Pooja Singh',
    specialization: 'Gynecologist',
    experience: 9,
    consultationFee: 450,
    mode: 'both',
    rating: 4.6,
    image: createDoctorImage('Dr. Pooja Singh', ['#14b8a6', '#0f766e']),
  },
  {
    id: 5,
    name: 'Dr. Vikram Patel',
    specialization: 'Orthopedic',
    experience: 11,
    consultationFee: 600,
    mode: 'offline',
    rating: 4.7,
    image: createDoctorImage('Dr. Vikram Patel', ['#3b82f6', '#1d4ed8']),
  },
  {
    id: 6,
    name: 'Dr. Anjali Gupta',
    specialization: 'Pediatrician',
    experience: 7,
    consultationFee: 350,
    mode: 'both',
    rating: 4.4,
    image: createDoctorImage('Dr. Anjali Gupta', ['#0ea5e9', '#0369a1']),
  },
  {
    id: 7,
    name: 'Dr. Karan Malhotra',
    specialization: 'Psychiatrist',
    experience: 10,
    consultationFee: 550,
    mode: 'online',
    rating: 4.6,
    image: createDoctorImage('Dr. Karan Malhotra', ['#2563eb', '#1e3a8a']),
  },
  {
    id: 8,
    name: 'Dr. Sneha Kapoor',
    specialization: 'ENT Specialist',
    experience: 6,
    consultationFee: 300,
    mode: 'both',
    rating: 4.3,
    image: createDoctorImage('Dr. Sneha Kapoor', ['#0f766e', '#06b6d4']),
  },
  {
    id: 9,
    name: 'Dr. Arjun Reddy',
    specialization: 'General Physician',
    experience: 15,
    consultationFee: 400,
    mode: 'online',
    rating: 4.9,
    image: createDoctorImage('Dr. Arjun Reddy', ['#0284c7', '#1d4ed8']),
  },
  {
    id: 10,
    name: 'Dr. Meera Iyer',
    specialization: 'Endocrinologist',
    experience: 13,
    consultationFee: 650,
    mode: 'both',
    rating: 4.8,
    image: createDoctorImage('Dr. Meera Iyer', ['#0ea5e9', '#0f766e']),
  },
];

export default doctors;
