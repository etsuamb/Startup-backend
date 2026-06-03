"use client";

import Image from "next/image";
import { useState } from "react";

export default function TeamMemberPhoto({ src, name, initials }) {
  const [imageUnavailable, setImageUnavailable] = useState(false);

  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[#e8f3ef] shadow-sm ring-1 ring-[#d2e5df]">
      <div className="absolute inset-0 flex items-center justify-center bg-[#e8f3ef] text-xl font-black text-[#0f5b4c]">
        {initials}
      </div>
      {!imageUnavailable ? (
        <Image
          src={src}
          alt={`${name} profile`}
          fill
          sizes="112px"
          className="object-cover"
          onError={() => setImageUnavailable(true)}
        />
      ) : null}
    </div>
  );
}
