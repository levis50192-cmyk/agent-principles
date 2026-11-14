import React from 'react';
import {Composition} from 'remotion';
import {LifeWeeks, FPS, DURATION} from './LifeWeeks';
import {PhoneLife, DURATION as D2} from './PhoneLife';
import {Spring80, DURATION as D3} from './Spring80';
import {Domino, DURATION as D4} from './Domino';

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
  <Composition id="Spring80" component={Spring80} durationInFrames={D3} fps={FPS} width={1080} height={1920} />
  <Composition id="Domino" component={Domino} durationInFrames={D4} fps={FPS} width={1080} height={1920} />
  </>
);
