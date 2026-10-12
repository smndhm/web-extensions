import './style.css';
import logo from './deezer.svg?raw';
import { Tab } from './tab';

// The page has no text of its own: use the browser language
document.documentElement.lang = browser.i18n.getUILanguage();

// Parse the SVG rather than assigning innerHTML, which addons.mozilla.org's linter flags
const svg = new DOMParser().parseFromString(logo, 'image/svg+xml').documentElement;
document.querySelector('#logo a')!.append(document.importNode(svg, true));

Tab.init();
