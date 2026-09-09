'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Opportunity } from '@/lib/data';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, Presentation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLIDE_TEMPLATES = [
  { id: '1', title: 'The Problem', render: (o: Opportunity) => o.problem },
  { id: '2', title: 'Our Solution', render: (o: Opportunity) => o.suggestedStartup },
  { id: '3', title: 'The Market Size', render: (o: Opportunity) => `Total Addressable Market: ${o.marketDetails.tam}\nServiceable Market: ${o.marketDetails.sam}\nTarget Goal: ${o.marketDetails.som}\n\n${o.marketDetails.description}` },
  { id: '4', title: 'Competition', render: (o: Opportunity) => o.competitors.length > 0 ? o.competitors.map(c => `• ${c.name}: ${c.description}\n  Weaknesses: ${c.weaknesses.join(', ')}`).join('\n\n') : 'There is currently no direct competition in this exact space.' },
  { id: '5', title: 'What We Are Building First', render: (o: Opportunity) => o.mvp.map(m => `• ${m}`).join('\n\n') },
  { id: '6', title: 'How We Make Money', render: () => 'Software as a Service (SaaS)\n\nSimple monthly subscription based on usage. Easy to start, scales as they grow.' },
  { id: '7', title: 'Who We Are Selling To', render: (o: Opportunity) => `Targeting:\n\n${o.potentialCustomers.map(p => `• ${p}`).join('\n')}\n\nWe will reach them through direct outreach and partnerships.` },
];

// Renders "• " prefixed lines as a real bullet list instead of raw pre-wrapped
// text, so multi-item slides (competitors, MVP, customers) read like flashcards.
// A bullet's own sub-lines (e.g. the "Weaknesses:" line under a competitor) are
// indented under it rather than breaking bullet detection for the whole block.
function SlideBody({ text }: { text: string }) {
  const blocks = text.split('\n\n');
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean);
        const isBulletBlock = lines.length > 0 && lines[0].trimStart().startsWith('•');
        if (isBulletBlock) {
          const items: { main: string; sub: string[] }[] = [];
          for (const line of lines) {
            if (line.trimStart().startsWith('•')) {
              items.push({ main: line.replace(/^\s*•\s*/, ''), sub: [] });
            } else if (items.length > 0) {
              items[items.length - 1].sub.push(line.trim());
            }
          }
          return (
            <ul key={i} className="space-y-3 mb-4 last:mb-0">
              {items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[0.6em] w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                  <span>
                    {item.main}
                    {item.sub.length > 0 && (
                      <span className="block text-[0.8em] opacity-70 mt-1 leading-snug">
                        {item.sub.join(' ')}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap mb-4 last:mb-0">
            {block}
          </p>
        );
      })}
    </>
  );
}

// Font-size tiers for slide title + body, largest first. FitSlide measures the
// real rendered height and steps down through these until the content actually
// fits the card — a fixed char-count guess can't account for how differently
// bullet lists, wrapped sentences, and long competitor blocks lay out.
const TITLE_BASE = 'font-extrabold text-white leading-tight drop-shadow-md shrink-0';
const BODY_BASE = 'text-indigo-100 font-medium';
const FIT_TIERS: { title: string; body: string }[] = [
  { title: 'text-4xl md:text-5xl lg:text-6xl mb-6', body: 'text-2xl md:text-3xl lg:text-4xl leading-relaxed' },
  { title: 'text-3xl md:text-4xl lg:text-5xl mb-5', body: 'text-xl md:text-2xl lg:text-3xl leading-relaxed' },
  { title: 'text-2xl md:text-3xl lg:text-4xl mb-4', body: 'text-lg md:text-xl lg:text-2xl leading-snug' },
  { title: 'text-xl md:text-2xl lg:text-3xl mb-3', body: 'text-base md:text-lg lg:text-xl leading-snug' },
  { title: 'text-lg md:text-xl mb-3', body: 'text-sm md:text-base leading-snug' },
  { title: 'text-base md:text-lg mb-2', body: 'text-xs md:text-sm leading-snug' },
];

// Renders a slide's title + body, shrinking through FIT_TIERS until the
// content's real measured height fits the available card height. Falls back
// to the smallest tier (with scroll as a last resort) if nothing fits.
function FitSlide({ title, content }: { title: string; content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState(0);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    const titleEl = titleRef.current;
    const bodyEl = bodyRef.current;
    if (!container || !wrapper || !titleEl || !bodyEl) return;

    let chosen = FIT_TIERS.length - 1;
    for (let i = 0; i < FIT_TIERS.length; i++) {
      titleEl.className = cn(TITLE_BASE, FIT_TIERS[i].title);
      bodyEl.className = cn(BODY_BASE, FIT_TIERS[i].body);
      if (wrapper.scrollHeight <= container.clientHeight) {
        chosen = i;
        break;
      }
    }
    setTier(chosen);
  }, []);

  // Re-measure whenever the slide's own content changes...
  useLayoutEffect(() => {
    fit();
  }, [fit, title, content]);

  // ...and whenever the card itself resizes (window resize, sidebar toggle).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);
    return () => observer.disconnect();
  }, [fit]);

  const t = FIT_TIERS[tier];

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col justify-center overflow-y-auto pr-1">
      <div ref={wrapperRef}>
        <h1 ref={titleRef} className={cn(TITLE_BASE, t.title)}>{title}</h1>
        <div ref={bodyRef} className={cn(BODY_BASE, t.body)}>
          <SlideBody text={content} />
        </div>
      </div>
    </div>
  );
}

async function generatePDF(opt: Opportunity) {
  // Dynamically import jsPDF to keep bundle lean
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const W = 297; // A4 landscape width mm
  const H = 210; // A4 landscape height mm
  const margin = 20;
  const contentW = W - margin * 2;

  const slides = [
    { title: 'The Problem', content: opt.problem },
    { title: 'Our Solution', content: opt.suggestedStartup },
    { title: 'The Market Size', content: `TAM: ${opt.marketDetails.tam}  |  SAM: ${opt.marketDetails.sam}  |  Target: ${opt.marketDetails.som}\n\n${opt.marketDetails.description}` },
    { title: 'Evidence & Signals', content: opt.evidence.map(e => `• ${e}`).join('\n') },
    { title: 'Competition', content: opt.competitors.length > 0 ? opt.competitors.map(c => `• ${c.name}: ${c.description}\n  Weaknesses: ${c.weaknesses.join(', ')}`).join('\n\n') : 'No direct competition exists in this exact space — first-mover advantage.' },
    { title: 'MVP — What to Build First', content: opt.mvp.map((m, i) => `${i + 1}. ${m}`).join('\n') },
    { title: 'Revenue Model', content: 'Software as a Service (SaaS)\n\nMonthly subscription based on usage.\nStarts low to acquire customers, scales as they grow.' },
    { title: 'Who We Are Selling To', content: opt.potentialCustomers.map(p => `• ${p}`).join('\n') },
  ];

  slides.forEach((slide, idx) => {
    if (idx > 0) doc.addPage();

    // Dark gradient background (solid approximation)
    doc.setFillColor(30, 27, 75); // indigo-900
    doc.rect(0, 0, W, H, 'F');

    // Accent bar top
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, W, 2, 'F');

    // Slide number chip
    doc.setFillColor(255, 255, 255, 0.1);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.roundedRect(W - margin - 20, 10, 20, 8, 2, 2, 'S');
    doc.setTextColor(200, 200, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${idx + 1} / ${slides.length}`, W - margin - 10, 15.5, { align: 'center' });

    // Company name top-left
    doc.setTextColor(160, 160, 210);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(opt.title.toUpperCase(), margin, 16);

    // Slide title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(slide.title, contentW);
    doc.text(titleLines, margin, 55);

    // Divider line
    const titleHeight = titleLines.length * 12;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.8);
    doc.line(margin, 58 + titleHeight - 12, margin + 40, 58 + titleHeight - 12);

    // Slide content — pick a font size that keeps the text within the
    // available vertical space instead of running off the bottom of the page.
    const contentTop = 68 + titleHeight - 12;
    const availableHeight = (H - 12) - contentTop - 8; // stop above the footer
    const lineHeightRatio = 1.5;
    let fontSize = 13;
    let contentLines: string[] = [];
    for (const size of [13, 11.5, 10, 8.5, 7]) {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(slide.content, contentW);
      const neededHeight = lines.length * size * 0.3528 * lineHeightRatio; // pt -> mm
      fontSize = size;
      contentLines = lines;
      if (neededHeight <= availableHeight) break;
    }

    doc.setTextColor(180, 180, 230);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(contentLines, margin, contentTop, { lineHeightFactor: lineHeightRatio });

    // Footer
    doc.setFillColor(20, 18, 60);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setTextColor(100, 100, 160);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Confidential — Generated by Scout', margin, H - 4);
    doc.text(new Date().toLocaleDateString(), W - margin, H - 4, { align: 'right' });
  });

  doc.save(`${opt.title.replace(/\s+/g, '_')}_pitch_deck.pdf`);
}

export function PitchEngineTab({ selectedOpportunity }: { selectedOpportunity: Opportunity | null }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!selectedOpportunity) return;
    setIsExporting(true);
    try {
      await generatePDF(selectedOpportunity);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedOpportunity) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6 shadow-inner py-6">
          <Presentation className="w-12 h-12 text-pink-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-3xl font-extrabold text-slate-800 mb-4">Pitch Deck Generator</h3>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Need to present your idea? Select an idea from the feed to instantly generate a beautiful slide deck.
        </p>
      </div>
    );
  }

  const opt = selectedOpportunity;
  const currentSlideInfo = SLIDE_TEMPLATES[slideIndex];

  const handleNext = () => setSlideIndex((v: number) => Math.min(v + 1, SLIDE_TEMPLATES.length - 1));
  const handlePrev = () => setSlideIndex((v: number) => Math.max(v - 1, 0));

  return (
    <div className="max-w-5xl mx-auto pb-24 h-full flex flex-col">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Your presentation is ready!</h2>
          <p className="text-lg text-slate-500">Read through the slides below, then export to PDF.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-3 rounded-full transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isExporting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
            : <><Download className="w-4 h-4" /> Save as PDF</>
          }
        </button>
      </header>

      {/* Slide Navigation */}
      <div className="flex gap-2 mb-6 items-center flex-wrap justify-center">
        {SLIDE_TEMPLATES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSlideIndex(i)}
            className={cn(
              "px-4 py-2 font-bold rounded-full transition-all text-sm shadow-sm",
              slideIndex === i
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white scale-105"
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
            )}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      {/* Slide Canvas */}
      <div className="relative flex-1 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl shadow-2xl aspect-[16/9] overflow-hidden flex flex-col min-h-[500px]">
        <div className="absolute top-8 left-10 opacity-60 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-pink-500"></span>
          <span className="text-white font-bold text-lg tracking-wide">{opt.title}</span>
        </div>
        <div className="absolute top-8 right-10 opacity-50">
          <span className="text-white font-medium text-sm border border-white/20 rounded-full px-4 py-1.5">{currentSlideInfo.title}</span>
        </div>

        <div className="p-10 md:p-16 flex-1 flex flex-col justify-center relative min-h-0">
          <AnimatePresence mode="popLayout">
            {(() => {
              const content = currentSlideInfo.render(opt);
              return (
                <motion.div
                  key={slideIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="max-w-4xl h-full w-full"
                >
                  <FitSlide title={currentSlideInfo.title} content={content} />
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 right-10 flex gap-4">
          <button onClick={handlePrev} disabled={slideIndex === 0} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white transition-all disabled:opacity-30 disabled:pointer-events-none">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button onClick={handleNext} disabled={slideIndex === SLIDE_TEMPLATES.length - 1} className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-indigo-900 hover:bg-indigo-50 shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
