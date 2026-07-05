import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

type ItineraryItem = {
  time: string;
  label: string;
};

type SectionDirection = {
  position: 'top' | 'bottom';
  align: 'left' | 'right';
};

type GuestEntry = {
  to: string;
  url: string;
  validity?: string | null;
};

type GuestEntryInput = {
  to: string;
  url: string;
  validity?: string | null;
};

type GuestsPayload = {
  from: string;
  guests: GuestEntry[];
};

const defaultEnvelopeFrom = 'Jess y Carlos';

type InvitationContent = {
  meta: {
    eventDateTime: string;
  };
  envelope: {
    title: string;
    stampText: string;
    cta: string;
  };
  header: {
    eyebrow: string;
    names: string;
    subtitle: string;
  };
  countdown: {
    title: string;
    expiredMessage: string;
    direction?: SectionDirection;
  };
  quote: {
    title: string;
    text: string;
    author: string;
    direction?: SectionDirection;
  };
  reception: {
    title: string;
    place: string;
    address: string;
    city: string;
    buttonLabel: string;
    mapUrl: string;
    direction?: SectionDirection;
  };
  dressCode: {
    title: string;
    description: string;
    note: string;
    direction?: SectionDirection;
  };
  itinerary: {
    title: string;
    items: ItineraryItem[];
    direction?: SectionDirection;
  };
  closing: {
    message: string;
    note: string;
    direction?: SectionDirection;
  };
};

const fallbackContent: InvitationContent = {
  meta: {
    eventDateTime: '2026-10-02T13:00:00',
  },
  envelope: {
    title: 'Invitacion',
    stampText: 'J & C',
    cta: '',
  },
  header: {
    eyebrow: 'Nuestra Boda',
    names: 'Jess y Carlos',
    subtitle: 'Nos encantaria compartir este dia contigo',
  },
  countdown: {
    title: 'Cuenta regresiva en vivo',
    expiredMessage: 'Ya llego el gran dia',
  },
  quote: {
    title: 'Quote',
    text: 'Con el mundo entero desmoronandose, nosotros seguimos eligiendonos.',
    author: 'Jess y Carlos',
  },
  reception: {
    title: 'Recepcion',
    place: 'Salon Magnolia',
    address: 'Av. Siempre Viva 742',
    city: 'Guadalajara, Jalisco',
    buttonLabel: 'Ver ubicacion en Google Maps',
    mapUrl: 'https://maps.google.com',
  },
  dressCode: {
    title: 'Codigo de vestimenta',
    description: 'Formal elegante en tonos neutros y tierra.',
    note: 'Evitar blanco total y colores neon.',
  },
  itinerary: {
    title: 'Itinerario',
    items: [
      { time: '13:00', label: 'Recepcion de invitados' },
      { time: '14:00', label: 'Ceremonia' },
      { time: '16:00', label: 'Comida' },
      { time: '19:00', label: 'Celebracion' },
    ],
  },
  closing: {
    message: 'Con amor Jess y Carlos los esperamos',
    note: 'Gracias por acompanarnos en este dia tan especial.',
  },
};

type PartialInvitation = Partial<InvitationContent>;

function normalizeGuestSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function getGuestSlugFromPath(pathname: string, baseUrl: string): string | null {
  const baseSegments = baseUrl.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  let candidateSegments = pathSegments;
  if (baseSegments.length > 0 && pathSegments.length >= baseSegments.length) {
    const startsWithBase = baseSegments.every(
      (segment, index) => segment.toLowerCase() === pathSegments[index]?.toLowerCase(),
    );
    if (startsWithBase) {
      candidateSegments = pathSegments.slice(baseSegments.length);
    }
  }

  const slugSegment = candidateSegments[0];
  if (!slugSegment) {
    return null;
  }

  try {
    return normalizeGuestSlug(decodeURIComponent(slugSegment));
  } catch {
    return normalizeGuestSlug(slugSegment);
  }
}

function isGuestEntry(value: unknown): value is GuestEntryInput {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as { to?: unknown; url?: unknown; validity?: unknown };
  const hasValidValidity =
    candidate.validity === undefined ||
    candidate.validity === null ||
    (typeof candidate.validity === 'string' && Boolean(candidate.validity.trim()));

  return Boolean(
    typeof candidate.to === 'string' &&
      candidate.to.trim() &&
      typeof candidate.url === 'string' &&
      candidate.url.trim() &&
      hasValidValidity,
  );
}

function parseGuestsData(incoming: unknown): GuestsPayload {
  const parsedFrom =
    incoming && typeof incoming === 'object' && typeof (incoming as { from?: unknown }).from === 'string'
      ? (incoming as { from: string }).from.trim()
      : '';

  const rawGuests = Array.isArray(incoming)
    ? incoming
    : incoming && typeof incoming === 'object' && Array.isArray((incoming as { guests?: unknown[] }).guests)
      ? (incoming as { guests: unknown[] }).guests
      : [];

  return {
    from: parsedFrom || defaultEnvelopeFrom,
    guests: rawGuests.filter(isGuestEntry).map((guest) => ({
      to: guest.to.trim(),
      url: guest.url.trim(),
      validity: guest.validity,
    })),
  };
}

function parseDirection(incomingDirection: Partial<SectionDirection> | undefined): SectionDirection | undefined {
  const position = incomingDirection?.position;
  const align = incomingDirection?.align;

  if ((position !== 'top' && position !== 'bottom') || (align !== 'left' && align !== 'right')) {
    return undefined;
  }

  return {
    position,
    align,
  };
}

function mergeInvitationContent(incoming: PartialInvitation): InvitationContent {
  const itineraryItems = incoming.itinerary?.items?.filter(
    (item): item is ItineraryItem => Boolean(item?.time && item?.label),
  );

  return {
    meta: {
      eventDateTime: incoming.meta?.eventDateTime ?? fallbackContent.meta.eventDateTime,
    },
    envelope: {
      title: incoming.envelope?.title ?? fallbackContent.envelope.title,
      stampText: incoming.envelope?.stampText ?? fallbackContent.envelope.stampText,
      cta: incoming.envelope?.cta ?? fallbackContent.envelope.cta,
    },
    header: {
      eyebrow: incoming.header?.eyebrow ?? fallbackContent.header.eyebrow,
      names: incoming.header?.names ?? fallbackContent.header.names,
      subtitle: incoming.header?.subtitle ?? fallbackContent.header.subtitle,
    },
    countdown: {
      title: incoming.countdown?.title ?? fallbackContent.countdown.title,
      expiredMessage: incoming.countdown?.expiredMessage ?? fallbackContent.countdown.expiredMessage,
      direction: parseDirection(incoming.countdown?.direction),
    },
    quote: {
      title: incoming.quote?.title ?? fallbackContent.quote.title,
      text: incoming.quote?.text ?? fallbackContent.quote.text,
      author: incoming.quote?.author ?? fallbackContent.quote.author,
      direction: parseDirection(incoming.quote?.direction),
    },
    reception: {
      title: incoming.reception?.title ?? fallbackContent.reception.title,
      place: incoming.reception?.place ?? fallbackContent.reception.place,
      address: incoming.reception?.address ?? fallbackContent.reception.address,
      city: incoming.reception?.city ?? fallbackContent.reception.city,
      buttonLabel: incoming.reception?.buttonLabel ?? fallbackContent.reception.buttonLabel,
      mapUrl: incoming.reception?.mapUrl ?? fallbackContent.reception.mapUrl,
      direction: parseDirection(incoming.reception?.direction),
    },
    dressCode: {
      title: incoming.dressCode?.title ?? fallbackContent.dressCode.title,
      description: incoming.dressCode?.description ?? fallbackContent.dressCode.description,
      note: incoming.dressCode?.note ?? fallbackContent.dressCode.note,
      direction: parseDirection(incoming.dressCode?.direction),
    },
    itinerary: {
      title: incoming.itinerary?.title ?? fallbackContent.itinerary.title,
      items: itineraryItems?.length ? itineraryItems : fallbackContent.itinerary.items,
      direction: parseDirection(incoming.itinerary?.direction),
    },
    closing: {
      message: incoming.closing?.message ?? fallbackContent.closing.message,
      note: incoming.closing?.note ?? fallbackContent.closing.note,
      direction: parseDirection(incoming.closing?.direction),
    },
  };
}

function formatUnit(value: number) {
  return value.toString().padStart(2, '0');
}

export function App() {
  const [content, setContent] = useState<InvitationContent>(fallbackContent);
  const [isContentReady, setIsContentReady] = useState(false);
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [envelopeFrom, setEnvelopeFrom] = useState(defaultEnvelopeFrom);
  const [areGuestsReady, setAreGuestsReady] = useState(false);
  const [isEnvelopeOpening, setIsEnvelopeOpening] = useState(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [now, setNow] = useState(() => Date.now());
  const openTimeoutRef = useRef<number | null>(null);
  const invitationPageRef = useRef<HTMLElement | null>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    const lockScroll = !isEnvelopeOpen;
    document.body.classList.toggle('envelope-visible', lockScroll);

    return () => {
      document.body.classList.remove('envelope-visible');
    };
  }, [isEnvelopeOpen]);

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}content/invitation.json`);
        if (!response.ok) {
          throw new Error(`Failed to load content file: ${response.status}`);
        }
        const data = (await response.json()) as PartialInvitation;
        if (isMounted) {
          setContent(mergeInvitationContent(data));
        }
      } catch {
        if (isMounted) {
          setContent(fallbackContent);
        }
      } finally {
        if (isMounted) {
          setIsContentReady(true);
        }
      }
    }

    void loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGuests() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}content/guests.json`);
        if (!response.ok) {
          throw new Error(`Failed to load guests file: ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        const parsedGuestsData = parseGuestsData(data);
        if (isMounted) {
          setGuests(parsedGuestsData.guests);
          setEnvelopeFrom(parsedGuestsData.from);
        }
      } catch {
        if (isMounted) {
          setGuests([]);
          setEnvelopeFrom(defaultEnvelopeFrom);
        }
      } finally {
        if (isMounted) {
          setAreGuestsReady(true);
        }
      }
    }

    void loadGuests();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        window.clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEnvelopeOpen) {
      return;
    }

    lastScrollYRef.current = window.scrollY;
    const minDelta = 6;

    function handleScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (Math.abs(delta) < minDelta) {
        return;
      }

      setScrollDirection(delta > 0 ? 'down' : 'up');
      lastScrollYRef.current = currentY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isEnvelopeOpen]);

  useEffect(() => {
    if (!isEnvelopeOpen || !invitationPageRef.current) {
      return;
    }

    const sections = Array.from(invitationPageRef.current.querySelectorAll<HTMLElement>('.section-animated'));
    sections.forEach((section) => section.classList.remove('in-view'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('in-view', entry.isIntersecting);
        });
      },
      {
        threshold: 0.22,
        rootMargin: '0px 0px -12% 0px',
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [isEnvelopeOpen]);

  const countdown = useMemo(() => {
    const targetMs = new Date(content.meta.eventDateTime).getTime();
    if (Number.isNaN(targetMs)) {
      return { days: '00', hours: '00', minutes: '00', seconds: '00', isExpired: true };
    }

    const remaining = Math.max(0, targetMs - now);
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);

    return {
      days: formatUnit(days),
      hours: formatUnit(hours),
      minutes: formatUnit(minutes),
      seconds: formatUnit(seconds),
      isExpired: remaining <= 0,
    };
  }, [content.meta.eventDateTime, now]);

  const countdownItems = [
    { label: 'Dias', value: countdown.days },
    { label: 'Horas', value: countdown.hours },
    { label: 'Minutos', value: countdown.minutes },
    { label: 'Segundos', value: countdown.seconds },
  ];

  const eyebrowLines = useMemo(() => {
    const segments = content.header.eyebrow
      .split('-')
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length < 2) {
      return null;
    }

    return segments;
  }, [content.header.eyebrow]);

  const guestSlug = useMemo(
    () => getGuestSlugFromPath(window.location.pathname, import.meta.env.BASE_URL),
    [],
  );

  const matchedGuest = useMemo(() => {
    if (!guestSlug) {
      return null;
    }

    return guests.find((guest) => normalizeGuestSlug(guest.url) === guestSlug) ?? null;
  }, [guestSlug, guests]);

  const hasValidGuestAccess = Boolean(matchedGuest);
  const canOpenEnvelope = areGuestsReady && hasValidGuestAccess;
  const envelopeTitle = areGuestsReady
    ? matchedGuest?.to ?? 'Invitacion no valida'
    : 'Validando invitacion';
  const envelopeFromValue = envelopeFrom;
  const envelopeToValue = matchedGuest?.to ?? '';
  const guestValidity = matchedGuest?.validity ?? null;
  const hasGuestValidity = Boolean(canOpenEnvelope && guestValidity);

  function openEnvelope() {
    if (isEnvelopeOpening || isEnvelopeOpen || !canOpenEnvelope) {
      return;
    }

    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
    }

    setIsEnvelopeOpening(true);
    openTimeoutRef.current = window.setTimeout(() => {
      setIsEnvelopeOpen(true);
      setIsEnvelopeOpening(false);
      openTimeoutRef.current = null;
    }, 900);
  }

  function closeEnvelope() {
    if (!isEnvelopeOpen) {
      return;
    }

    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    setIsEnvelopeOpening(false);
    setIsEnvelopeOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function renderSectionBranch(direction: SectionDirection | undefined) {
    if (!direction) {
      return null;
    }

    return (
      <img
        className={`section-branch section-branch-${direction.position} section-branch-${direction.align}`}
        src={`${import.meta.env.BASE_URL}icons/branch.png`}
        alt=""
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="invitation-shell">
      {!isEnvelopeOpen ? (
        <section className={`envelope-stage${isEnvelopeOpening ? ' opening' : ''}`} aria-label="Abrir invitacion">
          <button
            type="button"
            className={`envelope${canOpenEnvelope ? '' : ' envelope-disabled'}`}
            onClick={openEnvelope}
            disabled={!canOpenEnvelope}
          >
            <span className="envelope-paper" aria-hidden="true" />
            <span className="envelope-interior" aria-hidden="true" />
            <span className="envelope-flap" aria-hidden="true" />
            <span className="envelope-stamp" aria-hidden="true">
              <img
                className="envelope-seal-image"
                src={`${import.meta.env.BASE_URL}icons/envelope-seal.png`}
                alt=""
              />
            </span>
            <span className={`envelope-copy${hasGuestValidity ? ' envelope-copy-has-validity' : ''}`}>
              {canOpenEnvelope ? (
                <>
                  <strong className="envelope-party">
                    <span className="envelope-party-label">De:</span> {envelopeFromValue}
                  </strong>
                  <strong className="envelope-party">
                    <span className="envelope-party-label">Para:</span> {envelopeToValue}
                  </strong>
                </>
              ) : (
                <strong>{envelopeTitle}</strong>
              )}
              {!isContentReady || !areGuestsReady ? <span className="envelope-loading">Cargando...</span> : null}
              {areGuestsReady && !hasValidGuestAccess ? (
                <span className="envelope-invalid-message">Este enlace no tiene una invitacion activa.</span>
              ) : null}
            </span>
          </button>
          {hasGuestValidity ? <p className="envelope-validity">{guestValidity}</p> : null}
        </section>
      ) : null}

      {isEnvelopeOpen ? (
        <button type="button" className="envelope-toggle" onClick={closeEnvelope} aria-label="Cerrar invitacion">
          <span className="envelope-toggle-icon" aria-hidden="true">
            <img
              className="envelope-toggle-image envelope-toggle-image-open"
              src={`${import.meta.env.BASE_URL}icons/envelope-open.png`}
              alt=""
            />
            <img
              className="envelope-toggle-image envelope-toggle-image-closed"
              src={`${import.meta.env.BASE_URL}icons/envelope-closed.png`}
              alt=""
            />
          </span>
        </button>
      ) : null}

      <main
        ref={invitationPageRef}
        className={`invitation-page${isEnvelopeOpen ? ' visible' : ''} scroll-${scrollDirection}`}
      >
        <section className="section section-header">
          <span className="header-rings" aria-hidden="true">
            <img className="header-rings-image" src={`${import.meta.env.BASE_URL}icons/rings.svg`} alt="" />
          </span>
          <p className="section-eyebrow" aria-label={content.header.eyebrow}>
            {eyebrowLines ? (
              <>
                {eyebrowLines.map((line, index) => (
                  <Fragment key={`${line}-${index}`}>
                    <span>{line}</span>
                    {index < eyebrowLines.length - 1 ? (
                      <span className="section-eyebrow-dot" aria-hidden="true">
                        •
                      </span>
                    ) : null}
                  </Fragment>
                ))}
              </>
            ) : (
              <span>{content.header.eyebrow}</span>
            )}
          </p>
          <h1>{content.header.names}</h1>
          <p className="section-subtitle">{content.header.subtitle}</p>
        </section>

        <section className="section section-countdown section-animated">
          {renderSectionBranch(content.countdown.direction)}
          <h2>{content.countdown.title}</h2>
          <span className="material-symbols-rounded section-icon" aria-hidden="true">
            hourglass_top
          </span>
          <div className="countdown-grid" role="timer" aria-live="polite">
            {countdownItems.map((item) => (
              <article key={item.label} className="countdown-card">
                <p className="countdown-value">{item.value}</p>
                <p className="countdown-label">{item.label}</p>
              </article>
            ))}
          </div>
          {countdown.isExpired ? <p className="countdown-expired">{content.countdown.expiredMessage}</p> : null}
        </section>

        <section className="section section-quote section-animated">
          {renderSectionBranch(content.quote.direction)}
          <h2>{content.quote.title}</h2>
          <blockquote>
            <p>"{content.quote.text}"</p>
            <cite>{content.quote.author}</cite>
          </blockquote>
        </section>

        <section className="section section-reception section-animated">
          {renderSectionBranch(content.reception.direction)}
          <h2>{content.reception.title}</h2>
          <span className="material-symbols-rounded section-icon" aria-hidden="true">
            groups
          </span>
          <p className="reception-place">{content.reception.place}</p>
          <p>{content.reception.address}</p>
          <p>{content.reception.city}</p>
          <a className="cta-button" href={content.reception.mapUrl} target="_blank" rel="noreferrer">
            {content.reception.buttonLabel}
          </a>
        </section>

        <section className="section section-dress-code section-animated">
          {renderSectionBranch(content.dressCode.direction)}
          <h2>{content.dressCode.title}</h2>
          <span className="material-symbols-rounded section-icon" aria-hidden="true">
            apparel
          </span>
          <p>{content.dressCode.description}</p>
          <p className="dress-note">{content.dressCode.note}</p>
        </section>

        <section className="section section-itinerary section-animated">
          {renderSectionBranch(content.itinerary.direction)}
          <h2>{content.itinerary.title}</h2>
          <ul className="itinerary-list">
            {content.itinerary.items.map((item) => (
              <li key={`${item.time}-${item.label}`}>
                <span className="itinerary-time">{item.time}</span>
                <span className="itinerary-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section section-closing section-animated">
          {renderSectionBranch(content.closing.direction)}
          <span className="material-symbols-rounded section-icon section-icon-small" aria-hidden="true">
            favorite
          </span>
          <p className="closing-message">{content.closing.message}</p>
          <p className="dress-note closing-note">{content.closing.note}</p>
        </section>
      </main>
    </div>
  );
}
