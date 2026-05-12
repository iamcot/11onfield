interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      {/* Left triangle */}
      <div className="w-8 md:w-12 h-1 bg-yellow-400 transform -skew-x-12"></div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-700 uppercase text-center">
        {title}
      </h2>

      {/* Right triangle */}
      <div className="w-8 md:w-12 h-1 bg-yellow-400 transform skew-x-12"></div>
    </div>
  );
}
