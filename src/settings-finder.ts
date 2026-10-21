type Labels = { title: string; hint: string; clear: string; empty: string; results: string };
const english: Labels = {
  title: 'Find a setting', hint: 'Search settings or choose a section', clear: 'Clear search',
  empty: 'No matching sections. Try another word.', results: 'Matching sections',
};
const korean: Labels = {
  title: '설정 찾기', hint: '설정을 검색하거나 바로 이동하세요', clear: '검색 지우기',
  empty: '일치하는 항목이 없습니다. 다른 검색어를 입력하세요.', results: '검색된 설정 영역',
};

/** An additive navigator: never hides or changes the upstream settings. */
class SettingsFinder extends HTMLElement {
  #root = this.attachShadow({ mode: 'open' });
  #input = document.createElement('input');
  #results = document.createElement('div');
  #status = document.createElement('p');
  #frame = 0;
  #labels = english;
  #keys = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.#input.focus();
      this.#input.select();
    }
  };

  connectedCallback(): void {
    this.#labels = document.documentElement.lang.startsWith('ko') ? korean : english;
    const style = document.createElement('style');
    style.textContent = `
      :host { display:block; margin:0 0 24px; font:inherit; color:var(--text-primary); }
      section { padding:20px; border:1px solid var(--border-color); border-radius:16px;
        background:var(--bg-secondary); }
      label { display:block; font-size:16px; font-weight:650; margin-bottom:8px; }
      .search { display:flex; gap:8px; align-items:center; }
      input { flex:1; min-width:0; padding:12px; font:inherit; color:inherit;
        border:1px solid var(--border-color-solid); border-radius:9px; background:var(--input-bg); }
      button { font:inherit; color:inherit; border:1px solid var(--border-color-solid);
        border-radius:8px; cursor:pointer; background:var(--input-bg); padding:8px 12px; min-height:36px; }
      button:hover { border-color:var(--accent-color); color:var(--accent-color); }
      :is(button,input):focus-visible { outline:2px solid var(--accent-color); outline-offset:3px; }
      .results { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
      p { color:var(--text-secondary); margin:10px 0 0; font-size:12px; line-height:1.5; }
      @media(max-width:480px) { section { padding:14px; } .search { flex-wrap:wrap; } }
    `;
    const section = document.createElement('section');
    const label = document.createElement('label');
    label.htmlFor = 'settings-search';
    label.textContent = this.#labels.title;
    const search = document.createElement('div');
    search.className = 'search';
    this.#input.id = 'settings-search';
    this.#input.type = 'search';
    this.#input.placeholder = this.#labels.hint;
    this.#input.setAttribute('aria-controls', 'search-results');
    this.#input.addEventListener('input', () => this.#renderResults());
    this.#input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { this.#input.value = ''; this.#renderResults(); }
      if (event.key === 'Enter') this.#results.querySelector('button')?.click();
    });
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = this.#labels.clear;
    clear.addEventListener('click', () => { this.#input.value = ''; this.#renderResults(); this.#input.focus(); });
    this.#results.id = 'search-results';
    this.#results.className = 'results';
    this.#results.setAttribute('role', 'navigation');
    this.#results.setAttribute('aria-label', this.#labels.results);
    this.#status.setAttribute('role', 'status');
    this.#status.setAttribute('aria-live', 'polite');
    search.append(this.#input, clear);
    section.append(label, search, this.#results, this.#status);
    this.#root.replaceChildren(style, section);
    window.addEventListener('keydown', this.#keys);
    this.#frame = requestAnimationFrame(() => this.#renderResults());
  }

  disconnectedCallback(): void {
    window.removeEventListener('keydown', this.#keys);
    cancelAnimationFrame(this.#frame);
  }

  #renderResults(): void {
    const root = this.getRootNode();
    if (!(root instanceof ShadowRoot)) return;
    const query = this.#input.value.trim().toLocaleLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const sections = [...root.querySelectorAll<HTMLElement>('.section[data-nav]')];
    this.#results.replaceChildren();
    for (const section of sections) {
      const text = section.textContent?.toLocaleLowerCase() || '';
      if (!tokens.every(token => text.includes(token))) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = section.querySelector('h2 > span:nth-child(2)')?.textContent?.trim() || section.dataset.nav!;
      button.addEventListener('click', () => {
        // Reuse upstream navigation, with focus transfer for keyboard users.
        this.dispatchEvent(new CustomEvent('navigate-section', {
          bubbles: true, composed: true, detail: { section: section.dataset.nav },
        }));
        section.tabIndex = -1;
        section.focus({ preventScroll: true });
      });
      this.#results.append(button);
    }
    const count = this.#results.childElementCount;
    this.#status.textContent = count ? `${this.#labels.results}: ${count} · Ctrl / ⌘ K` : this.#labels.empty;
  }
}
customElements.define('settings-finder', SettingsFinder);
