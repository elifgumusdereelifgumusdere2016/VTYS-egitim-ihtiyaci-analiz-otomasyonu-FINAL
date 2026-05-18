import Image from "next/image";

export default function PencilBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-16 -right-16 h-96 w-96 rounded-full bg-yellow-200/40 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-pink-200/25 blur-3xl" />
      <div className="absolute left-[35%] top-[15%] h-72 w-72 rounded-full bg-white/60 blur-3xl" />

      <Image
        src="/pencil.png"
        alt="Dekoratif kalem"
        width={150}
        height={150}
        priority
        className="absolute right-16 top-24 rotate-12 opacity-25 drop-shadow-xl"
      />

      <Image
        src="/pencil.png"
        alt="Dekoratif kalem"
        width={105}
        height={105}
        className="absolute left-10 top-40 -rotate-45 opacity-20 drop-shadow-xl"
      />

      <Image
        src="/pencil.png"
        alt="Dekoratif kalem"
        width={125}
        height={125}
        className="absolute bottom-20 right-32 -rotate-12 opacity-20 drop-shadow-xl"
      />

      <Image
        src="/pencil.png"
        alt="Dekoratif kalem"
        width={90}
        height={90}
        className="absolute bottom-40 left-[42%] rotate-45 opacity-15 drop-shadow-xl"
      />

      <Image
        src="/pencil.png"
        alt="Dekoratif kalem"
        width={120}
        height={120}
        className="absolute right-[38%] top-10 rotate-[28deg] opacity-15 drop-shadow-xl"
      />
    </div>
  );
}
