import {Config} from '@remotion/cli/config';

// Optional: point Remotion at an existing Chrome/Chromium (e.g. in containers).
// Leave REMOTION_BROWSER unset on a normal computer; Remotion downloads its own.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
  Config.setChromiumOpenGlRenderer('swangle');
}
Config.setConcurrency(4);
