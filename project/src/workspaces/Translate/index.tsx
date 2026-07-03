import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { filterLanguages, getTranslateLanguageOptions, POPULAR_LANGUAGES } from '../../config/languages';

export const TranslateWorkspace = () => {
  const [targetLanguage, setTargetLanguage] = useState('Malay');
  const [languageSearch, setLanguageSearch] = useState('');

  const allLanguages = useMemo(() => getTranslateLanguageOptions(), []);
  const filteredLanguages = useMemo(
    () => filterLanguages(languageSearch, allLanguages),
    [languageSearch, allLanguages],
  );
  const visibleLanguages = useMemo(() => {
    if (!languageSearch.trim()) {
      return {
        popular: [...POPULAR_LANGUAGES],
        rest: allLanguages.filter(
          (l) => !POPULAR_LANGUAGES.includes(l as (typeof POPULAR_LANGUAGES)[number]),
        ),
      };
    }
    const matches = filteredLanguages;
    return { popular: [], rest: matches };
  }, [languageSearch, allLanguages, filteredLanguages]);

  const selectLanguages = useMemo(() => {
    const list = [...visibleLanguages.popular, ...visibleLanguages.rest];
    if (list.includes(targetLanguage)) return list;
    return [targetLanguage, ...list];
  }, [visibleLanguages, targetLanguage]);

  return (
    <WorkspaceShell
      title="Translate"
      subtitle={`${allLanguages.length}+ languages — search or pick a target language, then enter text to translate`}
      badge="Multilingual"
      badgeClass="text-sky-400"
    >
      <ChatPanel
        workspaceId="translate"
        placeholder="Enter text to translate..."
        suggestions={[
          'Translate: Hello, how are you?',
          'Translate: Thank you for your help',
          'Explain the difference between formal and informal Malay',
        ]}
        extraControls={
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <label htmlFor="translate-target-lang" className="text-xs text-gray-400 shrink-0">
                Translate to:
              </label>
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  type="search"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder="Search languages…"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-emerald-500/40"
                  aria-label="Search languages"
                />
              </div>
              <select
                id="translate-target-lang"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500/40 min-w-[160px] max-w-full"
              >
                {!languageSearch && visibleLanguages.popular.length > 0 && (
                  <optgroup label="Popular">
                    {visibleLanguages.popular.map((lang) => (
                      <option key={`pop-${lang}`} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={languageSearch ? 'Results' : 'All languages'}>
                  {(languageSearch ? selectLanguages : visibleLanguages.rest).map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <p className="text-[10px] text-gray-500">
              {allLanguages.length} languages available
              {languageSearch ? ` matching "${languageSearch}"` : ''}
              · Default: Malay
            </p>
          </div>
        }
        getExtraPayload={() => ({ targetLanguage })}
      />
    </WorkspaceShell>
  );
};

export default TranslateWorkspace;
