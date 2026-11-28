import {Config} from '@remotion/cli/config';
// In a container without a GPU set REMOTION_BROWSER to a Chromium path (software GL is used, slow).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
  Config.setChromiumOpenGlRenderer('swangle');
}
Config.setConcurrency(4);
