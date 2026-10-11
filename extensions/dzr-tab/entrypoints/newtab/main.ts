import './style.css';
import logo from './deezer.svg?raw';
import { Tab } from './tab';

document.querySelector('#logo a')!.innerHTML = logo;

Tab.init();
