export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Navy Background */}
      <rect width="100" height="100" rx="24" fill="#123C46"/>
      
      {/* Document Shape */}
      <path d="M28 22 H60 L72 34 V78 H28 V22 Z" fill="#0F766E" opacity="0.3"/>
      <path d="M28 22 H60 L72 34 V78 H28 V22 Z" stroke="#2DD4BF" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M60 22 V34 H72" stroke="#2DD4BF" strokeWidth="5" strokeLinejoin="round"/>
      
      {/* Inner G / Circle */}
      <circle cx="50" cy="55" r="11" stroke="#FFFFFF" strokeWidth="5"/>
      <path d="M50 55 H57" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round"/>
      <path d="M50 55 V48" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round"/>
      
      {/* Checkmark */}
      <path d="M42 62 L47 67 L58 55" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}