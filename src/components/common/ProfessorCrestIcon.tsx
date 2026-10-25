import React, { useState } from 'react';

interface ProfessorCrestIconProps {
  className?: string;
  size?: number;
}

export const ProfessorCrestIcon: React.FC<ProfessorCrestIconProps> = ({
  className = "w-9 h-9 sm:w-10 sm:h-10",
  size = 40
}) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-claret text-parchment-warm flex items-center justify-center font-serif font-bold text-sm border-2 border-[#D4AF37] shadow-xs shrink-0 ${className}`}
      >
        RD
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden border-2 border-[#D4AF37] ring-1 ring-claret/30 shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-105 bg-parchment-warm ${className}`}
    >
      <img
        src="/dr-rajnikant-dodiya.jpg"
        alt="Dr. Rajnikant S. Dodiya"
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover object-[center_18%]"
      />
    </div>
  );
};
