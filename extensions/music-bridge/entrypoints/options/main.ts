import '@dume/ds/tokens.css';
import '@dume/ds/base.css';
import '@dume/ds/utilities.css';
import '@dume/ds/extension-page.css';
import '@dume/ds/layout/page.css';
import '@dume/ds/layout/stack.css';
import '@dume/ds/components/card.css';
import '@dume/ds/components/checkbox.css';
import '@dume/ds/components/field.css';
import '@dume/ds/components/footer.css';
import './style.css';
import { initOptionsPage } from '@/utils/options-page';

// Firefox shows the options on its add-on card (style.css)
if (import.meta.env.FIREFOX) document.documentElement.dataset.browser = 'firefox';

void initOptionsPage(document, navigator.userAgent);
