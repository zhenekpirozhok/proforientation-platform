type TraitRow = { label: string; description?: string | null; value?: number | null };
type MatchRow = { title: string; description?: string | null; score01?: number | null };

export function renderResultsPdfDom(args: {
    title: string;
    typeTitle: string;
    traitsTitle: string;
    matchesTitle: string;
    matchesSubtitle?: string;
    matchLabel?: string;
    traitRows: TraitRow[];
    matchRows: MatchRow[];
}) {
    const root = document.createElement('div');
    root.setAttribute('data-pdf-root', '1');

    root.style.position = 'fixed';
    root.style.left = '0';
    root.style.top = '0';
    root.style.width = '794px';
    root.style.padding = '32px';
    root.style.background = '#fff';
    root.style.color = '#111';
    root.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    root.style.zIndex = '2147483647';

    const h1 = document.createElement('div');
    h1.textContent = args.title;
    h1.style.fontSize = '28px';
    h1.style.fontWeight = '700';
    h1.style.marginBottom = '10px';

    const type = document.createElement('div');
    type.textContent = args.typeTitle;
    type.style.fontSize = '16px';
    type.style.marginBottom = '22px';

    const sectionTitle = (text: string) => {
        const s = document.createElement('div');
        s.textContent = text;
        s.style.fontSize = '20px';
        s.style.fontWeight = '700';
        s.style.margin = '18px 0 10px';
        return s;
    };

    const card = () => {
        const c = document.createElement('div');
        c.style.border = '1px solid #e5e7eb';
        c.style.borderRadius = '14px';
        c.style.padding = '16px';
        c.style.marginBottom = '12px';
        c.style.breakInside = 'avoid';
        return c;
    };

    const traitCard = (r: TraitRow) => {
        const c = card();

        const top = document.createElement('div');
        top.style.display = 'flex';
        top.style.alignItems = 'center';
        top.style.justifyContent = 'space-between';
        top.style.gap = '12px';

        const left = document.createElement('div');

        const name = document.createElement('div');
        name.textContent = r.label;
        name.style.fontSize = '16px';
        name.style.fontWeight = '700';

        const desc = document.createElement('div');
        desc.textContent = (r.description ?? '').toString();
        desc.style.fontSize = '13px';
        desc.style.color = '#4b5563';
        desc.style.marginTop = '4px';

        left.appendChild(name);
        if (r.description) left.appendChild(desc);

        const pct = document.createElement('div');
        const v = typeof r.value === 'number' ? Math.round(r.value) : null;
        pct.textContent = v === null ? '' : `${v}%`;
        pct.style.fontSize = '16px';
        pct.style.fontWeight = '700';

        top.appendChild(left);
        top.appendChild(pct);

        const barWrap = document.createElement('div');
        barWrap.style.marginTop = '10px';
        barWrap.style.height = '8px';
        barWrap.style.borderRadius = '999px';
        barWrap.style.background = '#e5e7eb';
        barWrap.style.overflow = 'hidden';

        const bar = document.createElement('div');
        bar.style.height = '100%';
        bar.style.width = v === null ? '0%' : `${Math.max(0, Math.min(100, v))}%`;
        bar.style.background = '#06b6d4';

        barWrap.appendChild(bar);

        c.appendChild(top);
        c.appendChild(barWrap);

        return c;
    };

    const matchCard = (r: MatchRow) => {
        const c = card();

        const top = document.createElement('div');
        top.style.display = 'flex';
        top.style.alignItems = 'flex-start';
        top.style.justifyContent = 'space-between';
        top.style.gap = '12px';

        const left = document.createElement('div');

        const name = document.createElement('div');
        name.textContent = r.title;
        name.style.fontSize = '18px';
        name.style.fontWeight = '700';

        const desc = document.createElement('div');
        desc.textContent = (r.description ?? '').toString();
        desc.style.fontSize = '13px';
        desc.style.color = '#4b5563';
        desc.style.marginTop = '6px';
        desc.style.lineHeight = '1.4';

        left.appendChild(name);
        if (r.description) left.appendChild(desc);

        const right = document.createElement('div');
        right.style.textAlign = 'right';

        const pct = document.createElement('div');
        const v = typeof r.score01 === 'number' ? Math.round(r.score01 * 100) : null;
        pct.textContent = v === null ? '' : `${v}%`;
        pct.style.fontSize = '22px';
        pct.style.fontWeight = '800';
        pct.style.color = '#4f46e5';

        const label = document.createElement('div');
        label.textContent = args.matchLabel ?? 'Match';
        label.style.fontSize = '12px';
        label.style.color = '#6b7280';

        right.appendChild(pct);
        right.appendChild(label);

        top.appendChild(left);
        top.appendChild(right);

        c.appendChild(top);
        return c;
    };

    root.appendChild(h1);
    root.appendChild(type);

    root.appendChild(sectionTitle(args.traitsTitle));
    for (const r of args.traitRows) root.appendChild(traitCard(r));

    root.appendChild(sectionTitle(args.matchesTitle));
    if (args.matchesSubtitle) {
        const st = document.createElement('div');
        st.textContent = args.matchesSubtitle;
        st.style.fontSize = '13px';
        st.style.color = '#4b5563';
        st.style.margin = '-4px 0 10px';
        root.appendChild(st);
    }
    for (const r of args.matchRows) root.appendChild(matchCard(r));

    document.body.appendChild(root);

    return {
        node: root,
        cleanup: () => root.remove(),
    };
}
