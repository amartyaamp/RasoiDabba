import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Radio,
  Cpu,
  Server,
  Smartphone,
  Copy,
  Check,
  Code2,
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';
import { RoadmapPhase } from '../types';

export const RoadmapView: React.FC = () => {
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('phase_1');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/roadmap')
      .then((res) => res.json())
      .then((data) => {
        setPhases(data.phases || []);
        if (data.phases?.length) {
          setSelectedPhaseId(data.phases[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const activePhase = phases.find((p) => p.id === selectedPhaseId) || phases[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getPhaseStatusBadge = (status: RoadmapPhase['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active / Live
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            In Specification
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Roadmapped
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Roadmap Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-amber-600 tracking-wider uppercase">
              End-to-End System Blueprint
            </span>
            <h2 className="text-lg font-bold text-stone-900">
              Hardware & Endpoint Integration Roadmap
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Production blueprint detailing every tier from the physical HX711 load cell sensor to the
              BLE GATT server, Raspberry Pi hub adapter, and phone notification pipeline.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100">
            <span>Progress:</span>
            <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-2/5" />
            </div>
            <span className="font-bold text-stone-900">Phase 1 of 4</span>
          </div>
        </div>
      </div>

      {/* Interactive Phase Selector Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase) => {
          const isSelected = selectedPhaseId === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => setSelectedPhaseId(phase.id)}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-1 ring-stone-900'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-stone-800 text-amber-400' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    PHASE 0{phase.phase}
                  </span>
                  {getPhaseStatusBadge(phase.status)}
                </div>
                <h3 className="font-bold text-sm leading-snug mb-1">{phase.title}</h3>
                <p
                  className={`text-xs line-clamp-2 ${
                    isSelected ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {phase.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Detail & Code Snippet */}
      {activePhase && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono text-stone-500 mb-1">
                <span>Phase {activePhase.phase} Documentation</span>
                <span>&bull;</span>
                <span className="font-semibold text-stone-800">{activePhase.subtitle}</span>
              </div>
              <h3 className="text-xl font-bold text-stone-900">{activePhase.title}</h3>
            </div>
            {getPhaseStatusBadge(activePhase.status)}
          </div>

          <p className="text-sm text-stone-600 leading-relaxed">{activePhase.description}</p>

          {/* Key Deliverables Checklist */}
          <div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
              Key Technical Deliverables & Specifications:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activePhase.deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specs Bento */}
          {activePhase.specs && (
            <div className="p-4 rounded-xl bg-stone-100/70 border border-stone-200/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activePhase.specs.protocol && (
                <div>
                  <span className="text-stone-500 block text-[11px] font-medium">Protocol / Layer</span>
                  <span className="font-mono font-bold text-stone-900">{activePhase.specs.protocol}</span>
                </div>
              )}
              {activePhase.specs.endpoint && (
                <div>
                  <span className="text-stone-500 block text-[11px] font-medium">Target Ingress / Service</span>
                  <span className="font-mono font-bold text-stone-900">{activePhase.specs.endpoint}</span>
                </div>
              )}
              {activePhase.specs.payloadFormat && (
                <div className="sm:col-span-3">
                  <span className="text-stone-500 block text-[11px] font-medium">Payload Data Structure</span>
                  <span className="font-mono text-stone-800 text-[11px] block bg-white p-2 rounded-lg border border-stone-200 mt-1">
                    {activePhase.specs.payloadFormat}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ready-to-use Code Implementation */}
          {activePhase.codeSnippet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 font-mono">
                  <Code2 className="w-4 h-4 text-stone-500" />
                  <span className="font-bold text-stone-800">{activePhase.codeSnippet.title}</span>
                  <span className="text-stone-400">({activePhase.codeSnippet.filename})</span>
                </div>
                <button
                  onClick={() => handleCopy(activePhase.codeSnippet.code)}
                  className="flex items-center space-x-1 text-xs text-stone-700 hover:text-stone-950 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950">
                <pre className="p-4 font-mono text-xs text-stone-200 overflow-x-auto leading-relaxed">
                  {activePhase.codeSnippet.code}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
