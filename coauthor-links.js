(() => {
    const selector = '.coauthors, .paper-authors, .material-authors, .research-featured-meta, .research-sidebar-authors, .related-study-authors, .result-meta';

    function wrapName(element, start, end, link) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let offset = 0;
        let started = false;
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const next = offset + node.length;
            if (!started && start < next) {
                range.setStart(node, start - offset);
                started = true;
            }
            if (started && end <= next) {
                range.setEnd(node, end - offset);
                break;
            }
            offset = next;
        }
        link.append(range.extractContents());
        range.insertNode(link);
    }

    function separateCardLink(element) {
        const original = element.closest('a');
        if (!original) return;
        const card = document.createElement('div');
        for (const attribute of original.attributes) {
            if (!['href', 'target', 'rel'].includes(attribute.name)) {
                card.setAttribute(attribute.name, attribute.value);
            }
        }
        card.classList.add('coauthor-card');
        const destination = document.createElement('a');
        destination.className = 'coauthor-card-destination';
        for (const name of ['href', 'target', 'rel']) {
            if (original.hasAttribute(name)) destination.setAttribute(name, original.getAttribute(name));
        }
        const title = original.querySelector('h2, h3, .related-study-title');
        destination.setAttribute('aria-label', (title || original).textContent.trim());
        card.append(...original.childNodes, destination);
        original.replaceWith(card);
    }

    function initialize() {
        const style = document.createElement('style');
        style.textContent = `
            .coauthor-card { position: relative; }
            .coauthor-card-destination { position: absolute; inset: 0; z-index: 1; }
            a.coauthor-search-link { color: inherit; font: inherit; text-decoration: none; }
            .coauthor-search-link, .coauthor-card [onclick] { position: relative; z-index: 2; }
            a.coauthor-search-link:hover, a.coauthor-search-link:focus-visible { text-decoration: underline; }
        `;
        document.head.append(style);
        document.querySelectorAll(selector).forEach(element => {
            const text = element.textContent;
            const prefix = text.match(/^(?:with|con)\s+/);
            if (!prefix || element.querySelector('a')) return;
            separateCardLink(element);
            const names = [];
            const body = text.slice(prefix[0].length);
            let offset = 0;
            for (const part of body.split(/(,\s*|\s+(?:&|y)\s+)/)) {
                const name = part.trim();
                const start = prefix[0].length + offset + part.indexOf(name);
                offset += part.length;
                if (!name || /^[,&y]$/.test(name)) continue;
                names.push({ name, start, end: start + name.length });
            }
            // Work backwards so text offsets remain stable, including highlighted search results.
            names.reverse().forEach(({ name, start, end }) => {
                const link = document.createElement('a');
                link.className = 'coauthor-search-link';
                link.href = 'search.html?q=' + encodeURIComponent(name);
                wrapName(element, start, end, link);
            });
        });
    }

    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
