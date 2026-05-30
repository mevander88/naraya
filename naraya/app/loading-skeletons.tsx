function Lines({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`skeleton h-4 ${index === 0 ? 'w-full' : index === count - 1 ? 'w-2/3' : 'w-5/6'}`} />
      ))}
    </div>
  );
}

function PosterGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-x-6 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <div className="skeleton aspect-[2/3] rounded-xl" />
          <div className="skeleton mt-3 h-5 w-4/5" />
          <div className="skeleton mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function ListRows({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-surface-container-low/80 p-4 ring-1 ring-white/6">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton mt-3 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function HomeLoadingSkeleton() {
  return (
    <>
      <section className="relative h-[560px] overflow-hidden md:h-[660px]">
        <div className="skeleton absolute inset-0 rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="relative flex h-full max-w-5xl flex-col justify-end px-container-mobile pb-24 md:px-container-desktop md:pb-32">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton mt-5 h-12 w-full max-w-3xl md:h-16" />
          <div className="skeleton mt-4 h-5 w-full max-w-2xl" />
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="skeleton h-12 w-44" />
            <div className="skeleton h-12 w-36" />
          </div>
        </div>
      </section>
      <section className="relative z-10 -mt-10 px-container-mobile md:-mt-12 md:px-container-desktop">
        <div className="rounded-[2rem] border border-white/10 bg-background/78 p-4 shadow-2xl shadow-black/25">
          <div className="grid gap-4 md:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.7fr)]">
            <div className="p-2">
              <div className="skeleton h-5 w-36" />
              <div className="skeleton mt-4 h-8 w-4/5" />
              <div className="skeleton mt-3 h-4 w-2/3" />
            </div>
            <div className="hide-scrollbar flex gap-3 overflow-hidden py-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-44 min-w-[170px] rounded-2xl md:min-w-[200px]" />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-14 px-container-mobile md:px-container-desktop">
        <PosterGrid count={8} />
      </section>
    </>
  );
}

export function CatalogLoadingSkeleton() {
  return (
    <section className="px-container-mobile pb-24 pt-28 md:px-container-desktop">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="skeleton h-8 w-56" />
          <div className="skeleton mt-3 h-4 w-72 max-w-full" />
        </div>
        <div className="skeleton h-11 w-40" />
      </div>
      <div className="mt-8 flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton h-10 min-w-20 rounded-full" />
        ))}
      </div>
      <div className="mt-8">
        <PosterGrid />
      </div>
    </section>
  );
}

export function ExploreLoadingSkeleton() {
  return (
    <section className="px-container-mobile pb-24 pt-28 md:px-container-desktop">
      <div className="skeleton h-12 w-full max-w-xl" />
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-12 rounded-2xl" />
        ))}
      </div>
      <div className="mt-8">
        <PosterGrid />
      </div>
    </section>
  );
}

export function DetailLoadingSkeleton({ media = 'poster' }: { media?: 'poster' | 'reader' | 'player' }) {
  if (media === 'reader') {
    return (
      <section className="pb-20 pt-24">
        <div className="px-container-mobile md:px-container-desktop">
          <div className="skeleton h-4 w-44" />
          <div className="skeleton mt-4 h-10 w-full max-w-3xl" />
          <div className="skeleton mt-3 h-4 w-48" />
        </div>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 px-container-mobile md:px-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (media === 'player') {
    return (
      <section className="px-container-mobile pb-20 pt-24 md:px-container-desktop md:pt-28">
        <div className="skeleton h-10 w-40 rounded-full" />
        <div className="mt-5 rounded-[2.4rem] bg-surface-container-low/72 p-4 shadow-2xl shadow-black/28 md:p-6">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton mt-4 h-12 w-full max-w-4xl" />
          <div className="skeleton mt-6 aspect-video rounded-[1.6rem]" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="skeleton h-28 rounded-[2rem]" />
          <div className="skeleton h-28 rounded-[2rem]" />
        </div>
      </section>
    );
  }

  return (
    <section className="px-container-mobile pb-20 pt-28 md:px-container-desktop">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="skeleton aspect-[2/3] w-full rounded-2xl" />
        <div className="min-w-0">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton mt-4 h-12 w-full max-w-3xl md:h-16" />
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="skeleton h-12 w-48" />
            <div className="skeleton h-12 w-36" />
          </div>
        </div>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ListRows />
        <div className="rounded-[2rem] bg-surface-container-low/72 p-5">
          <Lines count={5} />
        </div>
      </div>
    </section>
  );
}

export function AccountLoadingSkeleton() {
  return (
    <section className="px-container-mobile pb-24 pt-28 md:px-container-desktop">
      <div className="skeleton h-10 w-64" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
