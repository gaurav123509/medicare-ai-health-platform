const Card = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => {
  return (
    <section
      className={`glass-card rounded-[28px] border border-white/70 p-6 shadow-soft ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h2 className="font-heading text-xl font-extrabold text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
};

export default Card;
