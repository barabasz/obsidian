/**
 * PersonInfo
 *
 * Klasa pomocnicza do renderowania informacji o osobie w Obsidianie.
 * Wymaga pluginów: CustomJS, Dataview oraz DataviewJS.
 *
 * Użycie w notatce osoby:
 *
 * ```dataviewjs
 * const {PersonInfo} = await cJS(); PersonInfo.printInfo(dv);
 * ```
 *
 * ```dataviewjs
 * const {PersonInfo} = await cJS(); PersonInfo.printDataview(dv);
 * ```
 */
class PersonInfo {

    /**
     * Inicjalizuje kontekst Dataview dla aktualnej notatki.
     */
    init(dv) {
        this.dv = dv;
        this.current = dv.current();
        this.file = this.current.file;
        this.fm = this.file.frontmatter ?? {};
        this.title = this.file.name;
    }

    /**
     * Renderuje podstawowe informacje o osobie.
     */
    printInfo(dv) {
        this.init(dv);

        const output = [
            `**${this.name()}**`,
            this.birth(),
            this.death(),
            this.nameday(),
            this.docs(),
            this.contact(),
            this.socials(),
        ].join('');

        this.dv.el('div', output, { cls: 'person-file-info' });
    }

    /**
     * Renderuje sekcje Journal oraz Backlinks.
     * Sekcje bez wyników nie są wyświetlane.
     */
    printDataview(dv) {
        this.init(dv);

        const journalPages = this.getJournalPages();
        const backlinkPages = this.getBacklinkPages();

        if (!journalPages.length && !backlinkPages.length) {
            this.dv.el(
                'div',
                'Brak wpisów w Journalu i powiązanych notatek.',
                { cls: 'person-file-dataview' }
            );
            return;
        }

        const output = [
            journalPages.length ? this.renderDataviewSection(
                'Journal',
                journalPages.map(page => this.formatJournalEntry(page))
            ) : '',
            backlinkPages.length ? this.renderDataviewSection(
                'Backlinks',
                backlinkPages.map(page => this.formatBacklinkEntry(page))
            ) : '',
        ].filter(Boolean).join('');

        this.dv.el('div', output, { cls: 'person-file-dataview' });
    }

    /**
     * Składa pełną nazwę osoby z danych front matter.
     */
    name() {
        const genders = {
            male: '♂',
            female: '♀',
        };

        const parts = [
            this.fm.name,
            this.fm.middlename,
            this.fm.nickname ? `“${this.fm.nickname}”` : '',
            this.fm.surname,
            this.shouldShowMaidenName() ? `(${this.fm.maidenname})` : '',
            this.fm.persontag ? `#${this.fm.persontag}` : '',
            this.fm.sex ? genders[this.fm.sex] : '',
        ].filter(Boolean);

        return parts.length ? parts.join(' ') : this.title;
    }

    /**
     * Sprawdza, czy nazwisko panieńskie powinno zostać wyświetlone.
     */
    shouldShowMaidenName() {
        return this.fm.maidenname && this.fm.maidenname !== this.fm.surname;
    }

    /**
     * Tworzy nagłówek Markdown.
     */
    makeMdHeading(heading, level = 3) {
        return `${'#'.repeat(level)} ${heading}\n`;
    }

    /**
     * Renderuje sekcję listy jako Markdown.
     */
    renderDataviewSection(heading, items) {
        const list = items
            .map(item => `- ${item}`)
            .join('\n');

        return `${this.makeMdHeading(heading)}${list}\n\n`;
    }

    /**
     * Zwraca strony Journalu powiązane z osobą.
     */
    getJournalPages() {
        return this.dv
            .pages('"Journal"')
            .where(page => this.isPersonRelatedPage(page))
            .sort(page => page.file.path, 'asc')
            .array();
    }

    /**
     * Zwraca powiązane notatki spoza Journalu.
     */
    getBacklinkPages() {
        return this.dv
            .pages()
            .where(page => this.isPersonRelatedPage(page))
            .where(page => !this.isJournalPage(page))
            .where(page => page.file.path !== this.file.path)
            .sort(page => page.file.name, 'asc')
            .array();
    }

    /**
     * Sprawdza, czy strona jest powiązana z aktualną osobą.
     * Uwzględnia tag osoby oraz linki prowadzące do aktualnej notatki.
     */
    isPersonRelatedPage(page) {
        return this.hasPersonTag(page) || this.linksToCurrentFile(page);
    }

    /**
     * Sprawdza, czy strona jest wpisem w Journalu.
     */
    isJournalPage(page) {
        return page.type === 'journal' || page.file.path.startsWith('Journal/');
    }

    /**
     * Sprawdza, czy strona ma tag osoby.
     */
    hasPersonTag(page) {
        if (!this.fm.persontag) {
            return false;
        }

        const personTag = this.normalizeTag(this.fm.persontag);
        const tags = [
            ...this.toArray(page.tags),
            ...this.toArray(page.file?.tags),
            ...this.toArray(page.file?.etags),
        ].map(tag => this.normalizeTag(tag));

        return tags.includes(personTag);
    }

    /**
     * Sprawdza, czy strona linkuje do aktualnej notatki osoby.
     */
    linksToCurrentFile(page) {
        return this.toArray(page.file?.outlinks)
            .some(link => link.path === this.file.path);
    }

    /**
     * Normalizuje tag do postaci bez znaku #.
     */
    normalizeTag(tag) {
        return String(tag).replace(/^#/, '');
    }

    /**
     * Zamienia wartość Dataview/DataArray/array/string na zwykłą tablicę.
     */
    toArray(value) {
        if (!value) {
            return [];
        }

        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value.array === 'function') {
            return value.array();
        }

        return [value];
    }

    /**
     * Formatuje wpis z Journalu.
     */
    formatJournalEntry(page) {
        const link = this.fileLink(page);

        return page.summary
            ? `${link}: ${page.summary}`
            : link;
    }

    /**
     * Formatuje wpis z backlinków.
     */
    formatBacklinkEntry(page) {
        return this.fileLink(page);
    }

    /**
     * Tworzy link do strony.
     */
    fileLink(page) {
        return this.dv.fileLink(page.file.path, false, page.file.name);
    }

    /**
     * Odmienia słowo „rok” dla podanej liczby lat.
     */
    sayLata(age) {
        const lastOne = age % 10;
        const lastTwo = age % 100;

        if (age === 1) {
            return 'rok';
        }

        if (lastTwo >= 12 && lastTwo <= 14) {
            return 'lat';
        }

        if (lastOne >= 2 && lastOne <= 4) {
            return 'lata';
        }

        return 'lat';
    }

    /**
     * Renderuje datę jako link do notatki dziennej i rocznej.
     */
    date(rawDate, time = null, type = null) {
        const date = moment(rawDate).locale('pl');

        if (!date.isValid()) {
            return '';
        }

        const year = date.format('YYYY');

        const output = [
            this.dayLink(date),
            year !== '1900' ? this.yearLink(date) : '',
            year !== '1900' && type === 'birthdate' ? this.zodiacLink() : '',
            year !== '1900' ? this.ageText(date) : '',
            time ? `o ${time}` : '',
        ].filter(Boolean);

        return output.join(' ');
    }

    /**
     * Tworzy link do notatki dziennej.
     */
    dayLink(date) {
        const dayName = date.format('LL').split(' ').slice(0, 2).join(' ');
        const dayNums = date.format('MM-DD');
        const month = date.format('MM');
        const dayFile = `Journal/${month}/${dayNums}`;

        return this.dv.page(dayNums)
            ? this.dv.fileLink(dayNums, false, dayName)
            : this.dv.fileLink(dayFile, false, dayName);
    }

    /**
     * Tworzy link do notatki rocznej.
     */
    yearLink(date) {
        const year = date.format('YYYY');
        const yearFile = `Journal/${year}/${year}`;

        return this.dv.page(year)
            ? this.dv.fileLink(year, false, year)
            : this.dv.fileLink(yearFile, false, year);
    }

    /**
     * Tworzy tekst wieku, np. „(42 lata)” albo „(42 lata temu)”.
     */
    ageText(date) {
        const age = moment().diff(date, 'years', false);
        const suffix = this.fm.deathdate ? ' temu' : '';

        return `(${age} ${this.sayLata(age)}${suffix})`;
    }

    /**
     * Tworzy link do znaku zodiaku dla daty urodzenia.
     */
    zodiacLink() {
        if (!this.fm.birthdate) {
            return '';
        }

        const zodiac = this.zodiac();

        return zodiac
            ? `[[${zodiac.polish}|${zodiac.icon}]]`
            : '';
    }

    /**
     * Renderuje miejsce jako link do notatki miejsca.
     */
    place(place) {
        if (!place) {
            return '';
        }

        const page = this.dv.page(place);

        if (page) {
            const locativus = page.file.frontmatter?.locativus || place;
            return ` w ${this.dv.fileLink(place, false, locativus)}`;
        }

        return ` w ${this.dv.fileLink(`Places/${place}`, false, place)}`;
    }

    /**
     * Renderuje dane kontaktowe: adres, telefon, e-mail.
     */
    contact() {
        const rows = [
            this.addressLink(),
            this.phoneLink(),
            this.emailLink(),
        ].filter(Boolean);

        return rows.length ? `\n${rows.join(' ')}` : '';
    }

    /**
     * Tworzy link do adresu w Google Maps.
     */
    addressLink() {
        if (!this.fm.address) {
            return '';
        }

        const mapsUrl = 'https://www.google.com/maps/place?q=';
        const encodedAddress = encodeURIComponent(this.fm.address);

        return `🏠 [${this.fm.address}](${mapsUrl}${encodedAddress})`;
    }

    /**
     * Tworzy link telefoniczny tel:.
     */
    phoneLink() {
        if (!this.fm.phone) {
            return '';
        }

        const cleanPhone = String(this.fm.phone).replace(/[^\d+]/g, '');

        return `☎️ <a href="tel:${cleanPhone}">${this.fm.phone}</a>`;
    }

    /**
     * Renderuje adres e-mail.
     */
    emailLink() {
        if (!this.fm.email) {
            return '';
        }

        return `📧 ${this.fm.email}`;
    }

    /**
     * Renderuje linki społecznościowe i stronę WWW.
     */
    socials() {
        const links = [
            {
                key: 'website',
                icon: ':luc_globe:',
                label: url => this.getWebsiteLabel(url),
            },
            {
                key: 'github',
                icon: ':luc_github:',
                label: url => this.getLastUrlSegment(url, 'github'),
            },
            {
                key: 'linkedin',
                icon: ':luc_linkedin:',
                label: url => this.getLastUrlSegment(url, 'linkedin'),
            },
            {
                key: 'twitter',
                icon: ':luc_twitter:',
                label: url => this.getLastUrlSegment(url, 'twitter'),
            },
            {
                key: 'facebook',
                icon: ':luc_facebook:',
                label: url => this.getLastUrlSegment(url, 'facebook'),
            },
            {
                key: 'instagram',
                icon: ':luc_instagram:',
                label: url => this.getLastUrlSegment(url, 'instagram'),
            },
        ];

        const output = links
            .map(({ key, icon, label }) => this.externalLink(icon, this.getSocialUrl(key), label))
            .filter(Boolean)
            .join(' ');

        return output ? `\n${output}` : '';
    }

    /**
     * Pobiera URL social media z front matter.
     */
    getSocialUrl(key) {
        return this.fm[key];
    }

    /**
     * Tworzy zewnętrzny link Markdown.
     */
    externalLink(icon, url, labelFn) {
        if (!url) {
            return '';
        }

        const label = labelFn(url);

        return `${icon} [${label}](${url})`;
    }

    /**
     * Zwraca ostatni człon ścieżki URL-a, np.
     * https://www.facebook.com/barabasz -> barabasz
     */
    getLastUrlSegment(rawUrl, fallback = 'link') {
        try {
            const url = new URL(rawUrl);
            const segments = url.pathname.split('/').filter(Boolean);
            const lastSegment = segments.pop();

            return lastSegment
                ? decodeURIComponent(lastSegment)
                : this.stripWww(url.hostname) || fallback;
        } catch {
            return fallback;
        }
    }

    /**
     * Zwraca krótką etykietę strony WWW, np.
     * https://www.adam.pl -> adam.pl
     */
    getWebsiteLabel(rawUrl) {
        try {
            const url = new URL(rawUrl);
            const hostname = this.stripWww(url.hostname);
            const pathname = url.pathname.replace(/\/$/, '');

            return pathname && pathname !== '/'
                ? `${hostname}${pathname}`
                : hostname;
        } catch {
            return String(rawUrl)
                .replace(/^https?:\/\//i, '')
                .replace(/^www\./i, '')
                .replace(/\/$/, '');
        }
    }

    /**
     * Usuwa prefix www. z hosta.
     */
    stripWww(hostname) {
        return String(hostname).replace(/^www\./i, '');
    }

    /**
     * Zwraca znak zodiaku na podstawie daty urodzenia.
     */
    zodiac() {
        const date = moment(this.fm.birthdate);

        if (!date.isValid()) {
            return null;
        }

        const day = Number(date.format('D'));
        const month = Number(date.format('M'));

        const signs = [
            { from: [1, 20], to: [2, 18], icon: '♒️', latin: 'Aquarius', english: 'Water-Bearer', polish: 'Wodnik' },
            { from: [2, 19], to: [3, 20], icon: '♓️', latin: 'Pisces', english: 'Fish', polish: 'Ryby' },
            { from: [3, 21], to: [4, 19], icon: '♈️', latin: 'Aries', english: 'Ram', polish: 'Baran' },
            { from: [4, 20], to: [5, 20], icon: '♉️', latin: 'Taurus', english: 'Bull', polish: 'Byk' },
            { from: [5, 21], to: [6, 20], icon: '♊️', latin: 'Gemini', english: 'Twins', polish: 'Bliźnięta' },
            { from: [6, 21], to: [7, 22], icon: '♋️', latin: 'Cancer', english: 'Crab', polish: 'Rak' },
            { from: [7, 23], to: [8, 22], icon: '♌️', latin: 'Leo', english: 'Lion', polish: 'Lew' },
            { from: [8, 23], to: [9, 22], icon: '♍️', latin: 'Virgo', english: 'Maiden', polish: 'Panna' },
            { from: [9, 23], to: [10, 22], icon: '♎️', latin: 'Libra', english: 'Scales', polish: 'Waga' },
            { from: [10, 23], to: [11, 21], icon: '♏️', latin: 'Scorpio', english: 'Scorpion', polish: 'Skorpion' },
            { from: [11, 22], to: [12, 21], icon: '♐️', latin: 'Sagittarius', english: 'Archer', polish: 'Strzelec' },
            { from: [12, 22], to: [1, 19], icon: '♑️', latin: 'Capricorn', english: 'Goat', polish: 'Koziorożec' },
        ];

        return signs.find(sign => this.isDateInZodiacRange(month, day, sign));
    }

    /**
     * Sprawdza, czy data mieści się w zakresie danego znaku zodiaku.
     */
    isDateInZodiacRange(month, day, sign) {
        const [fromMonth, fromDay] = sign.from;
        const [toMonth, toDay] = sign.to;

        if (fromMonth <= toMonth) {
            return (
                (month > fromMonth || (month === fromMonth && day >= fromDay)) &&
                (month < toMonth || (month === toMonth && day <= toDay))
            );
        }

        return (
            month > fromMonth ||
            month < toMonth ||
            (month === fromMonth && day >= fromDay) ||
            (month === toMonth && day <= toDay)
        );
    }

    /**
     * Renderuje dokumenty: PESEL, dowód osobisty, paszport.
     */
    docs() {
        const docs = [
            this.fm.pesel ? `PESEL: \`${this.fm.pesel}\`` : '',
            this.fm.idcard ? `nr dowodu: \`${this.fm.idcard}\`` : '',
            this.fm.passport ? `paszport: \`${this.fm.passport}\`` : '',
        ].filter(Boolean);

        if (!docs.length) {
            return '';
        }

        const output = docs.join(', ');

        return `${this.capitalizeFirst(output)}.`;
    }

    /**
     * Zmienia pierwszą literę tekstu na wielką.
     */
    capitalizeFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
     * Renderuje informacje o urodzeniu.
     */
    birth() {
        if (!this.fm.birthdate && !this.fm.birthyear && !this.fm.birthplace) {
            return '';
        }

        const output = [
            ', ur.',
            this.fm.birthdate ? this.date(this.fm.birthdate, this.fm.birthtime, 'birthdate') : '',
            !this.fm.birthdate && this.fm.birthyear ? this.yearOnlyLink(this.fm.birthyear) : '',
            this.fm.birthplace ? this.place(this.fm.birthplace) : '',
        ].filter(Boolean).join(' ');

        return this.shouldEndLifeSection()
            ? `${output}. `
            : output;
    }

    /**
     * Renderuje informacje o śmierci.
     */
    death() {
        if (!this.fm.deathdate && !this.fm.deathyear && !this.fm.deathplace) {
            return '';
        }

        const output = [
            ', zm.',
            this.fm.deathdate ? this.date(this.fm.deathdate, this.fm.deathtime) : '',
            !this.fm.deathdate && this.fm.deathyear ? this.yearOnlyLink(this.fm.deathyear) : '',
            this.fm.deathplace ? this.place(this.fm.deathplace) : '',
            this.fm.deathcause ? `(${this.fm.deathcause})` : '',
        ].filter(Boolean).join(' ');

        return this.fm.nameday ? output : `${output}. `;
    }

    /**
     * Sprawdza, czy sekcja urodzenia powinna zakończyć się kropką.
     */
    shouldEndLifeSection() {
        return !this.fm.deathdate &&
            !this.fm.deathyear &&
            !this.fm.deathplace &&
            !this.fm.nameday;
    }

    /**
     * Tworzy link do samego roku.
     */
    yearOnlyLink(year) {
        return `[[Journal/${year}/${year}|${year}]]`;
    }

    /**
     * Renderuje imieniny.
     */
    nameday() {
        if (!this.fm.nameday) {
            return '';
        }

        const pseudoDate = `2000-${this.fm.nameday}`;
        const date = moment(pseudoDate).locale('pl');

        if (!date.isValid()) {
            return '';
        }

        const dayName = date.format('LL').split(' ').slice(0, 2).join(' ');
        const dayNums = date.format('MM-DD');
        const month = date.format('MM');
        const dayFile = `Journal/${month}/${dayNums}`;

        const dayLink = this.dv.page(dayNums)
            ? this.dv.fileLink(dayNums, false, dayName)
            : this.dv.fileLink(dayFile, false, dayName);

        return `, im. ${dayLink}. `;
    }

}
