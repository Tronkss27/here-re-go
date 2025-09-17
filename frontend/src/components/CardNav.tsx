import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';

type CardNavLink = {
  label: string;
  href?: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor?: string; // backward compat
  bgDesktop?: string;
  bgMobile?: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo: string;
  logoAlt?: string;
  logoText?: string;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  mode?: 'floating' | 'header';
  headerTheme?: 'light' | 'dark';
  user?: { name?: string; avatarUrl?: string; isVenueOwner?: boolean } | null;
  onLogin?: () => void;
  onBusiness?: () => void;
  onLogout?: () => void;
  onProfile?: () => void;
  onAdmin?: () => void;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor,
  menuColor = 'hsl(var(--primary-foreground))',
  buttonBgColor = 'hsl(var(--primary-dark))',
  buttonTextColor = '#fff',
  ctaLabel = 'Login',
  onCtaClick,
  mode = 'floating',
  logoText = "It's a Match",
  headerTheme = 'dark',
  user,
  onLogin,
  onBusiness,
  onLogout,
  onProfile,
  onAdmin
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Resolve base background color for navbar
  const resolvedBaseColor = baseColor || (mode === 'header' ? '#BFFF00' : 'hsl(var(--primary))');

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.rbnav-content') as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        contentEl.offsetHeight;
        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;
        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;
        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.4, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, items]);

  // Track viewport to switch gradients mobile/desktop
  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) tlRef.current = newTl;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  // Position the user dropdown outside the clipped nav (fixed overlay)
  const toggleUserMenu = () => {
    setShowUserMenu((prev) => {
      const next = !prev;
      if (!next) return next;
      const btn = profileBtnRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const menuWidth = 160;
        const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
        const top = Math.max(8, rect.bottom + 8);
        setMenuPos({ top, left });
      }
      return next;
    });
  };

  // Close on outside click or ESC
  useLayoutEffect(() => {
    if (!showUserMenu) return;
    const onClick = (e: MouseEvent) => {
      const btn = profileBtnRef.current;
      const menuEl = menuRef.current;
      if (btn && (e.target instanceof Node) && (btn === e.target || btn.contains(e.target))) return;
      if (menuEl && (e.target instanceof Node) && menuEl.contains(e.target)) return;
      setShowUserMenu(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowUserMenu(false); };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onKey); };
  }, [showUserMenu]);

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const containerClass =
    mode === 'header'
      ? (isMobile
          ? 'relative w-full max-w-none px-0 overflow-x-hidden z-[50]'
          : 'relative w-full max-w-none px-0 z-[50]')
      : 'absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[99] top-[1.2em] md:top-[2em]';

  return (
    <div className={`rbnav-container ${containerClass} ${className}`}>
      <nav
        ref={navRef}
        className={`rbnav ${isExpanded ? 'open' : ''} block h-[60px] p-0 ${mode === 'header' ? 'rounded-none shadow-none' : 'rounded-xl shadow-md'} relative will-change-[height]`}
        style={{ background: resolvedBaseColor as string }}
      >
        <div className="rbnav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
          <div
            className={`rbnav-hamburger ${isHamburgerOpen ? 'open' : ''} group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            tabIndex={0}
            style={{ color: menuColor || (headerTheme === 'light' ? '#111' : '#fff') }}
          >
            <div className={`rbnav-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''} group-hover:opacity-75`} />
            <div className={`rbnav-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''} group-hover:opacity-75`} />
          </div>

          <div className="rbnav-logo flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
            {logo ? (
              <img src={logo} alt={logoAlt} className="logo h-[28px]" />
            ) : (
              <span className={`text-base md:text-lg font-extrabold tracking-wide select-none ${headerTheme === 'light' ? 'text-black' : 'text-white'}`}>{logoText}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={onLogin || onCtaClick}
                  className={`rbnav-cta rbnav-pill-login inline-flex items-center rounded-full px-4 py-1.5 text-sm md:text-base font-semibold cursor-pointer transition-colors duration-300 ${
                    headerTheme === 'light'
                      ? 'border border-black/50 text-black bg-white/90 hover:bg-white'
                      : 'border border-white/70 text-white bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {ctaLabel || 'Login'}
                </button>
                <button
                  type="button"
                  onClick={onBusiness}
                  className={`rbnav-pill-business inline-flex items-center rounded-full px-4 py-1.5 text-sm md:text-base font-extrabold cursor-pointer transition-colors duration-300 ${
                    headerTheme === 'light'
                      ? 'bg-black text-white hover:bg-black/90'
                      : 'bg-[hsl(var(--primary-dark))] text-white hover:brightness-95'
                  }`}
                >
                  Business
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  ref={profileBtnRef}
                  onClick={toggleUserMenu}
                  aria-label="User menu"
                  className={`inline-flex items-center justify-center rounded-full w-9 h-9 md:w-10 md:h-10 font-bold ${
                    headerTheme === 'light' ? 'bg-black/10 text-black' : 'bg-white/20 text-white'
                  }`}
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </button>
                {showUserMenu && (
                  <div ref={menuRef} className="fixed w-44 rounded-lg bg-white shadow-xl ring-1 ring-black/5 z-[1000] overflow-hidden" style={{ top: menuPos.top, left: menuPos.left }}>
                    <ul className="py-1 text-sm text-gray-700">
                      {user?.isVenueOwner && (
                        <li>
                          <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setShowUserMenu(false); onAdmin?.(); }}>Admin</button>
                        </li>
                      )}
                      <li>
                        <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setShowUserMenu(false); onProfile?.(); }}>Profilo</button>
                      </li>
                      <li>
                        <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setShowUserMenu(false); onLogout?.(); }}>Logout</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`rbnav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'} md:flex-row md:items-end md:gap-[12px] ${mode === 'header' ? 'bg-white rounded-xl shadow-md border border-[hsl(var(--border))]' : ''}`}
          aria-hidden={!isExpanded}
        >
          {(items || []).slice(0, 3).map((item, idx) => {
            const background = isMobile
              ? (item.bgMobile || item.bgColor || 'transparent')
              : (item.bgDesktop || item.bgColor || 'transparent');
            const textColor = item.textColor || '#111';
            return (
            <div
              key={`${item.label}-${idx}`}
              className="rbnav-item select-none relative flex flex-col gap-2 p-[12px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%]"
              ref={setCardRef(idx)}
              style={{ background, color: textColor }}
            >
              <div className="rbnav-item-label font-semibold tracking-[-0.5px] text-[18px] md:text-[20px]">
                {item.label}
              </div>
              <div className="rbnav-links mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="rbnav-link inline-flex items-center gap-[6px] no-underline cursor-pointer transition-opacity duration-300 hover:opacity-80 text-[15px] md:text-[16px]"
                    href={lnk.href || '#'}
                    aria-label={lnk.ariaLabel}
                  >
                    <GoArrowUpRight className="rbnav-link-icon shrink-0" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;


