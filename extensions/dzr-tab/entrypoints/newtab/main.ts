import './style.css';
import logo from './deezer.svg?raw';
import { loadTracks, random, deezerLink, removeLegacyData } from '@/utils/deezer';
import { showTrack } from './tab';

// The page has no text of its own: use the browser language
document.documentElement.lang = browser.i18n.getUILanguage();

const logoLink = document.querySelector<HTMLAnchorElement>('#logo a')!;
logoLink.href = deezerLink(logoLink.href);
// Parse the SVG rather than assigning innerHTML, which addons.mozilla.org's linter flags
const svg = new DOMParser().parseFromString(logo, 'image/svg+xml').documentElement;
logoLink.append(document.importNode(svg, true));

const track = random(await loadTracks());
if (track) showTrack(track);
removeLegacyData().catch(() => {});
