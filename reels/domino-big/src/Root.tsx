import React from 'react';
import {Composition} from 'remotion';
import {Big, DURATION, FPS} from './Big';
export const Root: React.FC = () => <Composition id="Big" component={Big} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />;
