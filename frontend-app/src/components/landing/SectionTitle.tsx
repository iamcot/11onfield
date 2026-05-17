interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 md:mb-12">
      {/* Left triangle */}
      <div className="w-6 md:w-8 lg:w-12 h-1 bg-gold-600 transform -skew-x-12"></div>

      {/* Title */}
      <h2 className="text-lg md:text-2xl lg:text-4xl font-bold text-green-700 uppercase text-center whitespace-nowrap">
        {title}
      </h2>

      {/* Right triangle */}
      <div className="w-6 md:w-8 lg:w-12 h-1 bg-gold-600 transform skew-x-12"></div>
    </div>
  );
}
