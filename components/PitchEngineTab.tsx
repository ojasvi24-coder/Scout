import { useState, useRef } from 'react';
import { Opportunity } from '@/lib/data';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, Presentation, Loader2 } from 'lucide-react';
import { cn } from '@/components/Sidebar';

const SLIDE_TEMPLATES = [
  { id: '1', title: 'The Problem', render: (o: Opportunity) => o.problem },
  { id: '2', title: 'Our Solution', render: (o: Opportunity) => o.suggestedStartup },
  { id: '3', title: 'The Market Size', render: (o: Opportunity) => `Total Potential: ${o.marketDetails.tam}\nTarget Goal: ${o.marketDetails.som}\n\n${o.marketDetails.description}` },
  { id: '4', title: 'Competition', render: (o: Opportunity) => o.competitors.length > 0 ? o.competitors.map(c => `• ${c.name}: ${c.description}`).join('\n\n') : 'There is currently no direct competition in this exact space.' },
  { id: '5', title: 'What We Are Building First', render: (o: Opportunity) => o.mvp.map(m => `• ${m}`).join('\n\n') },
  { id: '6', title: 'How We Make Money', render: () => 'Software as a Service (SaaS)\n\nSimple monthly subscription based on usage. Easy to start, scales as they grow.' },
  { id: '7', title: 'Who We Are Selling To', render: (o: Opportunity) => `Targeting:\n\n${o.potentialCustomers.map(p => `• ${p}`).join('\n')}\n\nWe will reach them through direct outreach and partnerships.` },
];

export function PitchEngineTab({ selectedOpportunity }: { selectedOpportunity: Opportunity | null }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const pdfContainerRef = useRef<HTMLDivElement>(null);

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

  const handleNext = () => setSlideIndex(v => Math.min(v + 1, SLIDE_TEMPLATES.length - 1));
  const handlePrev = () => setSlideIndex(v => Math.max(v - 1, 0));

  const handleSaveAsPDF = async () => {
    if (!pdfContainerRef.current) return;
    setIsGeneratingPDF(true);
    setPdfError('');
    
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF('landscape', 'pt', [1920, 1080]);
      const slides = pdfContainerRef.current.querySelectorAll('.pdf-slide-node');
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i] as HTMLElement;
        const canvas = await html2canvas(slide, { 
          scale: 1.5,
          useCORS: true,
          logging: false 
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
      }
      
      pdf.save(`${opt.title.replace(/\s+/g, '_')}_PitchDeck.pdf`);
    } catch (error: any) {
      console.error('Failed to generate PDF', error);
      setPdfError(error.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 h-full flex flex-col">
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-800 mb-2">Your presentation is ready!</h2>
          <p className="text-lg text-slate-500">Read through the slides below. You can present this directly to your team or investors.</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button 
            onClick={handleSaveAsPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-3 rounded-full transition-all shadow-sm disabled:opacity-50"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGeneratingPDF ? 'Generating...' : 'Save as PDF'}
          </button>
          {pdfError && <div className="text-red-500 text-sm font-medium">{pdfError}</div>}
        </div>
      </header>

      {/* Slide Navigation Dots */}
      <div className="flex gap-2 mb-6 items-center flex-wrap justify-center">
        {SLIDE_TEMPLATES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSlideIndex(i)}
            className={cn(
              "px-4 py-2 font-bold rounded-full transition-all text-sm shadow-sm",
              slideIndex === i ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white scale-105" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
            )}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      {/* Slide Canvas */}
      <div className="relative flex-1 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl shadow-2xl aspect-[16/9] overflow-hidden flex flex-col min-h-[500px]">
        {/* Simple Slide Frame Header */}
        <div className="absolute top-8 left-10 opacity-60 flex items-center gap-2">
           <span className="w-3 h-3 rounded-full bg-pink-500"></span>
           <span className="text-white font-bold text-lg tracking-wide">{opt.title}</span>
        </div>
        <div className="absolute top-8 right-10 opacity-50">
           <span className="text-white font-medium text-sm border border-white/20 rounded-full px-4 py-1.5">{currentSlideInfo.title}</span>
        </div>

        <div className="p-10 md:p-16 flex-1 flex flex-col justify-center relative min-h-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="max-w-4xl h-full flex flex-col justify-center overflow-y-auto pr-4 custom-scrollbar"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-md shrink-0">
                {currentSlideInfo.title}
              </h1>
              <div className="text-xl md:text-2xl leading-relaxed text-indigo-100 whitespace-pre-wrap font-medium pb-12">
                {currentSlideInfo.render(opt)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Presentation Controls overlay */}
        <div className="absolute bottom-8 right-10 flex gap-4">
          <button onClick={handlePrev} disabled={slideIndex === 0} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white transition-all disabled:opacity-30 disabled:pointer-events-none">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button onClick={handleNext} disabled={slideIndex === SLIDE_TEMPLATES.length - 1} className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-indigo-900 hover:bg-indigo-50 shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none">
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Hidden slides for PDF generation */}
      <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none z-[-1]" aria-hidden="true" ref={pdfContainerRef}>
        <div className="flex flex-col">
          {SLIDE_TEMPLATES.map((s) => (
            <div key={s.id} className="pdf-slide-node relative bg-gradient-to-br from-indigo-900 to-purple-900 w-[1920px] h-[1080px] overflow-hidden flex flex-col p-24 shrink-0">
              <div className="absolute top-16 left-24 opacity-60 flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-pink-500"></span>
                <span className="text-white font-bold text-3xl tracking-wide">{opt.title}</span>
              </div>
              <div className="absolute top-16 right-24 opacity-50">
                <span className="text-white font-medium text-2xl border-4 border-white/20 rounded-full px-8 py-3">{s.title}</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mt-24">
                <h1 className="text-8xl font-extrabold text-white mb-16 leading-tight drop-shadow-md">
                  {s.title}
                </h1>
                <div className="text-5xl leading-relaxed text-indigo-100 whitespace-pre-wrap font-medium">
                  {s.render(opt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
