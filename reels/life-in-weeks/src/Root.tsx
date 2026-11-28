import React from 'react';
import {Composition} from 'remotion';
import {LifeWeeks, FPS, DURATION} from './LifeWeeks';

export const Root: React.FC = () => (
  <Composition
    id="LifeWeeks"
    component={LifeWeeks}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
