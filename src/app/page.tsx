"use client";

import { useState, memo, useCallback, useMemo, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import JsonLd from "./components/JsonLd";
import Input from "./components/Input";
import MusicPlayer from "./components/MusicPlayer";

const TitleBar = memo(({ title, onClose }: { title: string; onClose?: () => void }) => {
  return (
    <div className="titlebar">
      <span>{title}</span>
      {onClose && (
        <div className="titlebar-buttons">
          <div
            className="titlebar-btn"
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
              }
            }}
          >
            ×
          </div>
        </div>
      )}
    </div>
  );
});


export default function Home() {
  const [twitter, setTwitter] = useState("");
  const [wallet, setWallet] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [checkerWallet, setCheckerWallet] = useState("");
  const [checkResult, setCheckResult] = useState<any>(null);
  const [showCheckerModal, setShowCheckerModal] = useState(false);
  const [checkerError, setCheckerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const blurActiveElement = useCallback(() => {
    if (typeof document !== "undefined") {
      const active = document.activeElement as HTMLElement | null;
      active?.blur();
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError("");
    
    if (!twitter && !wallet) {
      setError("please enter your twitter handle and wallet address");
      return;
    }

    if (!twitter) {
      setError("please enter your twitter handle");
      return;
    }

    if (!wallet) {
      setError("please enter your wallet address");
      return;
    }

    if (!turnstileToken) {
      setError("please complete the captcha verification");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          twitter: twitter.trim(),
          wallet: wallet.trim(),
          code: code.trim() || undefined,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        blurActiveElement();
        setShowModal(true);
        setCheckerError("");
      } else {
        setError(data.error || 'submission failed');
      }
    } catch (error) {
      setError('network error - please try again');
    } finally {
      setIsSubmitting(false);
    }
  }, [twitter, wallet, code, turnstileToken, blurActiveElement]);

  const handleCheckWhitelist = useCallback(async () => {
    if (!checkerWallet) {
      setCheckerError("please enter your twitter handle and wallet address");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(checkerWallet.trim())) {
      setCheckerError("invalid ethereum address");
      return;
    }
    setIsChecking(true);
    setCheckerError(""); // Clear previous error

    try {
      const response = await fetch('/api/check-whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: checkerWallet.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.found) {
          setCheckResult(data);
          blurActiveElement();
          setShowCheckerModal(true);
          setCheckerError("");
        } else {
          setCheckResult(null);
          setShowCheckerModal(false);
          setCheckerError(data.message || 'not found on whitelist');
        }
      } else {
        setCheckResult(null);
        setShowCheckerModal(false);
        setCheckerError(data.error || 'check failed');
      }
    } catch (error) {
      setCheckResult({ found: false, error: 'network error - please try again' });
    } finally {
      setIsChecking(false);
    }
  }, [checkerWallet]);

  // Optimized input handlers
  const handleTwitterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTwitter(e.target.value);
  }, []);

  const handleWalletChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWallet(e.target.value);
  }, []);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  }, []);

  const handleCheckerWalletChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckerWallet(e.target.value);
  }, []);

  // Memoized modal close handlers
  const handleCloseModal = useCallback(() => {
    blurActiveElement();
    setShowModal(false);
    setTwitter("");
    setWallet("");
    setCode("");
  }, [blurActiveElement]);

  const handleCloseCheckerModal = useCallback(() => {
    blurActiveElement();
    setShowCheckerModal(false);
    setCheckResult(null);
    setCheckerWallet("");
  }, [blurActiveElement]);

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowLinkModal(true);
  }, []);

  const handleCloseLinkModal = useCallback(() => {
    setShowLinkModal(false);
  }, []);

  useEffect(() => {
    const anyModalOpen = showModal || showCheckerModal || showLinkModal;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        if (showModal) {
          handleCloseModal();
        } else if (showCheckerModal) {
          handleCloseCheckerModal();
        } else if (showLinkModal) {
          handleCloseLinkModal();
        }
      }
    };

    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [showModal, showCheckerModal, showLinkModal, handleCloseModal, handleCloseCheckerModal, handleCloseLinkModal]);

  // Memoize modal content to prevent unnecessary re-renders
  const successModalContent = useMemo(() => (
    <div className="text-center">
      <p className="success-title mb-4">
        {code ? "phase 2 submission successful" : "phase 3 submission successful"}
      </p>
      <button 
        className="button mt-4"
        onClick={handleCloseModal}
      >
        close
      </button>
    </div>
  ), [code, handleCloseModal]);

  const checkerModalContent = useMemo(() => (
    <div className="text-center space-y-3">
      <div className="text-center space-y-2 pt-1 text-black">
        <p><strong>username:</strong> {checkResult?.submission?.twitter}</p>
        <p><strong>ethereum address:</strong> {checkResult?.submission?.wallet?.slice(0, 6)}...{checkResult?.submission?.wallet?.slice(-4)}</p>
        <p><strong>phase 2:</strong> {checkResult?.submission?.phase2 ? 'yes' : 'no'}</p>
        <p><strong>phase 3:</strong> {checkResult?.submission?.phase3 ? 'yes' : 'no'}</p>
      </div>
      <button 
        className="button mt-4"
        onClick={handleCloseCheckerModal}
      >
        close
      </button>
    </div>
  ), [checkResult, handleCloseCheckerModal]);

  const linkModalContent = useMemo(() => (
    <div className="text-center space-y-3">
      <p className="text-black">
        check back soon.&lt;3
      </p>
      <button 
        className="button mt-4"
        onClick={handleCloseLinkModal}
      >
        close
      </button>
    </div>
  ), [handleCloseLinkModal]);

  return (
    <>
    <JsonLd />
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[960px] flex flex-col gap-4">

        {/* Banner Window */}
        <div className="window banner-window">
          <TitleBar title="schizostimmys" />
          <div className="body p-2">
            <div className="inset">
              <div className="banner-container">
                <img 
                  src="/schizostimmys-logo.png" 
                  alt="Schizostimmys logo - announcement banner"
                  className="banner-img"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top row: Details window (left) + Image window (right) */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* LEFT — Details Window (tall) */}
          <div className="window flex-1 min-w-0 md:max-w-[420px] flex flex-col order-2 md:order-1">
            <TitleBar title="henlo" />
            <div className="body flex flex-col gap-3 flex-1">

              {/* Combined content area */}
              <div className="inset p-3 flex-1">
                <div className="space-y-2">
                  
                  {/* Header area */}
                  <div className="text-left">
                    <h1
                      className="font-bold tracking-wider main-title font-pixel"
                    >
                      schizostimmys⋆⭒˚.⋆
                    </h1>
                    <p className="subtitle font-pixel">
                      "the network is powered by love."✧˚
                    </p>
                  </div>
                  
                  <div>
                    <p className="section-header mb-0.5">
                      <span
                        className="green-arrow"
                      >
                        &gt;
                      </span> about
                    </p>
                    <p className="about-text">
                      sorry no text, waaaah (for now) ur just extremely early!
                    </p>
                  </div>

                  <div className="project-details">
                    <div>
                      <span className="detail-label">
                        <span className="green-arrow">&gt;</span> supply:
                      </span>
                      <br />
                      <span className="detail-value">
                        tba
                      </span>
                    </div>
                    <div>
                      <span className="detail-label">
                        <span className="green-arrow">&gt;</span> wen:
                      </span>
                      <br />
                      <span className="detail-value">
                        6/--/26
                      </span>
                    </div>
                    <div>
                      <span className="detail-label">
                        <span className="green-arrow">&gt;</span> chain:
                      </span>
                      <br />
                      <span className="detail-value">
                        $eth
                      </span>
                    </div>
                    <div>
                      <span className="detail-label">
                        <span className="green-arrow">&gt;</span> launchpad:
                      </span>
                      <br />
                      <a
                        href="https://www.scatter.art/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="launchpad-link"
                      >
                        scatter.art
                      </a>
                    </div>
                  </div>

                  
                  {/* Mint Phases */}
                  <div>
                    <p className="section-header mb-2">
                      <span
                        className="green-arrow"
                      >
                        &gt;
                      </span> mint phases
                    </p>
                    <div className="space-y-1 phases-container">
                      <div className="flex items-start gap-2 phase-item-container">
                        <span className="phase-bullet">•</span>
                        <div>
                          <span className="phase-name">phase 1: treasury</span>
                          <br />
                          <span className="phase-description">
                            treasury (250-300 mints)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 phase-item-container">
                        <span className="phase-bullet">•</span>
                        <div>
                          <span className="phase-name">phase 2: frens</span>
                          <br />
                          <span className="phase-description">
                            friends & contributors
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 phase-item-container">
                        <span className="phase-bullet">•</span>
                        <div>
                          <span className="phase-name">phase 3: whitelist</span>
                          <br />
                          <span className="phase-description">
                            limited - sign up below!
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 phase-item-container">
                        <span className="phase-bullet">•</span>
                        <div>
                          <span className="phase-name">phase 4: public</span>
                          <br />
                          <span className="phase-description">
                            open for everyone
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — NFT Image Window */}
          <div className="window video-window min-w-0 flex flex-col order-1 md:order-2">
            <TitleBar title="preview - [stimmys.gif]" />
            <div className="body flex-1 flex flex-col">
              <div className="inset flex-1 flex items-center justify-center min-h-[300px] md:min-h-[400px] p-0">
                <video
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                >
                  <source src="/schizostimmys-preview-low.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

        {/* Middle row: Whitelist Form + Spotify Player */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          {/* WL Form - order-1 mobile, order-1 desktop */}
          <div className="window wl-window basis-full md:basis-1/2 flex flex-col self-start order-2">
            <TitleBar title="phase 3 - whitelist form [live]" />
            <div className="body flex-1 flex">
              <div className="inset p-4 flex-1 flex flex-col">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className="green-arrow"
                    >
                      &gt;
                    </span>
                    <p className="form-description">
                      enter your details below to claim your phase 3 whitelist spot.
                      limited.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Input
                      label="twitter username"
                      id="twitter-username"
                      value={twitter}
                      onChange={handleTwitterChange}
                      onFocus={() => setError("")}
                      placeholder="@"
                    />
                    
                    <Input
                      label="wallet address"
                      id="wallet-address"
                      value={wallet}
                      onChange={handleWalletChange}
                      onFocus={() => setError("")}
                      placeholder="0x..."
                    />
                    
                    <div className="flex flex-col gap-3">
                      <Input
                        label="phase 2 code (optional)"
                        id="phase-2-code"
                        value={code}
                        onChange={handleCodeChange}
                        onFocus={() => setError("")}
                        placeholder="enter code"
                      />
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                        onSuccess={(token) => {
                          setTurnstileToken(token);
                          setError("");
                        }}
                        onExpire={() => setTurnstileToken("")}
                        onError={() => setTurnstileToken("")}
                        options={{
                          theme: "light",
                          size: "normal",
                          refreshExpired: "auto",
                        }}
                      />
                      <div>
                        <button type="submit" className="button w-full" disabled={isSubmitting}>
                          {isSubmitting ? 'submitting...' : 'submit'}
                        </button>
                        <div className="error-container">
                          {error && (
                            <div className="error-text">
                              {error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>

          {/* Music Player - order-3 mobile (after checker), order-2 desktop (right of form) */}
          <div className="window music-player-window basis-full md:basis-1/2 flex flex-col order-1 md:order-2 self-start">
            <TitleBar title="music player - [its_psychotherapy] playlist" />
            <div className="body flex-1 flex">
              <div className="inset p-0 flex-1 flex flex-col">
                <MusicPlayer />
              </div>
            </div>
          </div>

          {/* WL Checker - order-2 mobile (after form), hidden on desktop (shown in next container) */}
          <div className="window wl-window basis-full md:hidden flex flex-col self-start order-3">
            <TitleBar title="whitelist checker" />
            <div className="body flex-1 flex">
              <div className="inset p-4 flex-1 flex flex-col">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className="green-arrow"
                    >
                      &gt;
                    </span>
                    <p className="form-description">
                      check if you're on the whitelist.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Input
                      label="wallet address"
                      id="checker-wallet-address"
                      value={checkerWallet}
                      onChange={handleCheckerWalletChange}
                      onFocus={() => setCheckerError("")}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCheckWhitelist();
                        }
                      }}
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <button 
                      type="button" 
                      className="button w-full"
                      onClick={handleCheckWhitelist}
                      disabled={isChecking}
                    >
                      {isChecking ? 'submitting...' : 'submit'}
                    </button>
                    <div className="error-container">
                      {checkerError && (
                        <div className="error-text">
                          {checkerError}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: WL Checker (desktop only) */}
        <div className="hidden md:flex flex-col md:flex-row gap-4 items-stretch">
          {/* WL Checker - desktop only */}
          <div className="window wl-window basis-full md:basis-1/2 flex flex-col self-start">
            <TitleBar title="whitelist checker" />
            <div className="body flex-1 flex">
              <div className="inset p-4 flex-1 flex flex-col">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className="green-arrow"
                    >
                      &gt;
                    </span>
                    <p className="form-description">
                      check if you're on the whitelist.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Input
                      label="wallet address"
                      id="checker-wallet-address-desktop"
                      value={checkerWallet}
                      onChange={handleCheckerWalletChange}
                      onFocus={() => setCheckerError("")}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCheckWhitelist();
                        }
                      }}
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <button 
                      type="button" 
                      className="button w-full"
                      onClick={handleCheckWhitelist}
                      disabled={isChecking}
                    >
                      {isChecking ? 'submitting...' : 'submit'}
                    </button>
                    <div className="error-container">
                      {checkerError && (
                        <div className="error-text">
                          {checkerError}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Empty placeholder for alignment */}
          <div className="basis-full md:basis-1/2"></div>
        </div>

        {/* Footer Window */}
        <div className="window mt-16">
          <div className="body py-2">
            <div className="footer">
              <a
                href="https://x.com/schizostimmys"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-black"
              >
                twitter
              </a>
              <span>|</span>
              <a
                href="#"
                onClick={handleLinkClick}
                className="hover:underline text-black"
              >
                discord
              </a>
              <span>|</span>
              <a
                href="#"
                onClick={handleLinkClick}
                className="hover:underline text-black"
              >
                telegram
              </a>
              <span>|</span>
              <a
                href="https://www.instagram.com/schizostimmys/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-black"
              >
                instagram
              </a>
              <span>|</span>
              <a
                href="https://www.scatter.art/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-black"
              >
                scatter.art
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <img 
              src="/favicon.png" 
              alt="Schizostimmys favicon"
              className="w-12 h-12"
            />
          <p className="text-sm" style={{ color: '#ff7fdf' }}>
            &copy; 2026 schizostimmys. made with love!
          </p>
        </div>

      </div>
    </div>

      {/* Success Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="window"
            style={{ minWidth: '280px', maxWidth: '90vw', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <TitleBarWithButtons
              title={code ? "phase 2 - whitelist form [live]" : "phase 3 - whitelist form [live]"}
              onClose={handleCloseModal}
            />
            <div className="body p-4">
              {successModalContent}
            </div>
          </div>
        </div>
      )}

      {/* Whitelist Checker Modal */}
      {showCheckerModal && (
        <div className="modal-overlay" onClick={handleCloseCheckerModal}>
          <div
            className="window"
            style={{ minWidth: '280px', maxWidth: '90vw', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <TitleBar title="whitelist checker" onClose={handleCloseCheckerModal} />
            <div className="body p-4">
              {checkerModalContent}
            </div>
          </div>
        </div>
      )}

      {/* Link Popup Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={handleCloseLinkModal}>
          <div
            className="window"
            style={{ minWidth: '280px', maxWidth: '90vw', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <TitleBar title="something happened.." onClose={handleCloseLinkModal} />
            <div className="body p-4">
              {linkModalContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
