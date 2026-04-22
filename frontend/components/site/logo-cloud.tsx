const logos = ['ACME Corp', 'Globex', 'Initech', 'Umbrella', 'Stark Ind.', 'Wayne Ent.']

export function LogoCloud() {
  return (
    <div className="bg-muted/20 border-y py-12">
      <div className="container-prose">
        <p className="text-muted-foreground mb-8 text-center text-xs uppercase tracking-widest">
          受到 500+ 企业的信赖
        </p>
        <div className="grid grid-cols-2 items-center justify-items-center gap-y-8 opacity-70 sm:grid-cols-3 lg:grid-cols-6">
          {logos.map((name) => (
            <div
              key={name}
              className="text-muted-foreground hover:text-foreground text-lg font-semibold tracking-tight transition-colors"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
