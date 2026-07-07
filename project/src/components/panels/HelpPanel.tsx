import { useAppStore } from '../../core/appState';
import { LegalDocumentView } from '../legal/LegalDocumentView';
import type { HelpSection } from '../../core/types';

export function HelpPanel() {
  const helpSection = useAppStore((s) => s.helpSection);
  const openHelp = useAppStore((s) => s.openHelp);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Help Center</h1>
      <p className="text-sm text-gray-500 mb-6">Guides and policies for SG16 AI Engine.</p>
      <LegalDocumentView
        section={helpSection}
        onSelectSection={(section) => openHelp(section as HelpSection)}
      />
    </div>
  );
}
