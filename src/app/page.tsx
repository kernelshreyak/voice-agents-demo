'use client';

import React from 'react';
import VoiceAgentDemo from '../components/VoiceAgentDemo';
import VoiceAgentChainedDemo from '../components/VoiceAgentChainedDemo';

export default function Home() {
  const [selectedDemo, setSelectedDemo] = React.useState<'demo' | 'chained'>('chained');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="mb-8 flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="demo"
            value="demo"
            checked={selectedDemo === 'demo'}
            onChange={() => setSelectedDemo('demo')}
          />
          Voice Agent Demo
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="demo"
            value="chained"
            checked={selectedDemo === 'chained'}
            onChange={() => setSelectedDemo('chained')}
          />
          Voice Agent Chained Demo
        </label>
      </div>
      {selectedDemo === 'demo' ? (
        <VoiceAgentDemo />
      ) : (
        <VoiceAgentChainedDemo />
      )}
    </div>
  );
}
