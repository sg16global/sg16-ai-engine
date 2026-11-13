/**
 * What the SG16 robot says on the public homepage, built from the page's own data
 * (flags, pioneers, World's AI, shields) so the narration always matches what is on screen.
 *
 * Recorded voice: one MP3 per segment, named after its id, in public/landing/robot/voice/
 * (hello.mp3, flags.mp3, …). If the page data changes, the matching recording must be redone.
 */

export type RobotSegmentId = 'hello' | 'flags' | 'pioneers' | 'world-ai' | 'shields' | 'functions' | 'goodbye';

export interface RobotSegment {
  id: RobotSegmentId;
  text: string;
}

export interface RobotScriptInput {
  flags: { name: string }[];
  pioneers: { name: string }[];
  worldAi: [string, string][];
  shields: { title: string; desc: string }[];
}

/** "A, B and C" */
function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function buildRobotScript({ flags, pioneers, worldAi, shields }: RobotScriptInput): RobotSegment[] {
  return [
    {
      id: 'hello',
      text: "Hi, welcome to SG16 AI Engine! I'm the SG16 AI Engine Robo, your guide. Let me show you around.",
    },
    {
      id: 'flags',
      text: `These ${flags.length} flags stand for the nations we honour and serve: ${list(flags.map((f) => f.name))}.`,
    },
    {
      id: 'pioneers',
      text: `Next, meet ${pioneers.length} AI pioneers, the minds whose ideas made today's AI possible: ${list(pioneers.map((p) => p.name))}.`,
    },
    {
      id: 'world-ai',
      text: `At the bottom of the page you'll find the world's leading AI: ${list(worldAi.map(([name]) => name))}. We show them out of respect. SG16 is independent and not affiliated with these companies.`,
    },
    {
      id: 'shields',
      text: `SG16 gives you ${shields.length} shields. ${shields.map((s) => `${s.title}. ${s.desc}`).join(' ')}`,
    },
    {
      id: 'functions',
      text: 'Inside, Pilot helps you find the right shield, your chats stay private on your own device, and the Staging Lab is open around the clock with 24/7 AI support.',
    },
    {
      id: 'goodbye',
      text: 'Tap Start Tour to step inside and try it yourself. Enjoy SG16!',
    },
  ];
}
