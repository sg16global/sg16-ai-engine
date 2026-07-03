import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const ImageWorkspace = () => (
  <WorkspaceShell
    title="Image Studio"
    subtitle="Create images from prompts, or upload a photo to analyze or edit — say 'remove X' to edit, or ask 'what is this?' to analyze"
    badge="Create & Analyze"
    badgeClass="text-emerald-400"
  >
    <ChatPanel
      workspaceId="image"
      allowImage
      loadingLabel="SG16 AI is working on your image..."
      placeholder="Create: describe an image. Edit: upload photo + say what to remove or change..."
      suggestions={[
        'Create a futuristic city at sunset with neon lights',
        'Remove the object from this picture, keep the face exactly the same',
        'Remove the watermark, keep everything else identical',
        'Describe what you see in this image',
      ]}
    />
  </WorkspaceShell>
);

export default ImageWorkspace;
