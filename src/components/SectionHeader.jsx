import Reveal from './Reveal.jsx'

export default function SectionHeader({ eyebrow, title, subtitle, light = false, center = false }) {
  return (
    <Reveal className={center ? 'text-center' : ''}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${
          light ? 'text-white' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 max-w-2xl text-base sm:text-lg leading-relaxed ${
            center ? 'mx-auto' : ''
          } ${light ? 'text-orange-100' : 'text-ink-soft'}`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}
