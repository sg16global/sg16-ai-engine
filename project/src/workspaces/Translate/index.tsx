import { useState } from 'react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

const LANGUAGES = [
  'Malay', 'English', 'Arabic', 'Chinese', 'Spanish', 'French',
  'Japanese', 'Korean', 'Hindi', 'German', 'Portuguese', 'Tamil',
];

export const TranslateWorkspace = () => {
  const [targetLanguage, setTargetLanguage] = useState('Malay');

  return (
    <WorkspaceShell
      title="Translate"
      subtitle="Real-time language translation with SG16 AI"
      badge="Multilingual"
      badgeClass="text-sky-400"
    >
      <ChatPanel
        workspaceId="translate"
        placeholder="Enter text to translate..."
        suggestions={[
          'Translate: Hello, how are you?',
          'Translate: Thank you for your help',
          'Explain the difference between formal and informal Arabic',
        ]}
        extraControls={
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-gray-400">Translate to:</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500/40"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        }
        getExtraPayload={() => ({ targetLanguage })}
      />
    </WorkspaceShell>
  );
};

export default TranslateWorkspace;
