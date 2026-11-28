import React from 'react';
import {Composition} from 'remotion';
import {LifeWeeks, FPS, DURATION} from './LifeWeeks';
import {PhoneLife, DURATION as D2} from './PhoneLife';

export const Root: React.FC = () => (
  <>
  <Composition
    id="LifeWeeks"
    component={LifeWeeks}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
  <Composition id="PhoneLife" component={PhoneLife} durationInFrames={D2} fps={FPS} width={1080} height={1920} />
  </>
);
