/**
 * JournalInfo
 * 
 * autor: github.com/barabasz/
 * repo: https://github.com/barabasz/obsidian
 * wersja: 2027-07-05 rev. 1
 *
 * Klasa pomocnicza do renderowania informacji o wpisach dziennika w Obsidianie.
 * Wymaga pluginów: CustomJS, Dataview oraz DataviewJS.
 *
 * Użycie na górze notatki:
 *
 * ```dataviewjs
 * const {JournalInfo} = await cJS(); await JournalInfo.printInfo(dv);
 * ```
 *
 * Użycie na dole notatki:
 *
 * ```dataviewjs
 * const {JournalInfo} = await cJS(); await JournalInfo.printDataview(dv);
 * ```
 */
class JournalInfo {

    /**
     * Inicjalizuje kontekst Dataview dla aktualnej notatki.
     */
    init(dv) {
        this.root = 'Journal';
        this.locale = 'pl';
        this.dv = dv;
        this.current = dv.current();
        this.file = this.current.file;
        this.fm = this.file.frontmatter ?? {};
        this.title = this.file.name;
        this.kind = this.getKind();
        this.date = this.getDateForCurrentNote();

        this.defaults = {
            year: '2024',
            month: '01',
            day: '01',
            sort: 'asc',
        };

        this.symbols = {
            cal: '🗓',
            left: '← ',
            right: ' →',
            sep: ' • ',
        };

        moment.locale(this.locale);
    }

    /**
     * Renderuje górny blok informacyjny.
     */
    async printInfo(dv) {
        this.init(dv);

        const output = this.getInfoOutput();

        this.dv.el('div', output, { cls: 'file-journal-info' });
    }

    /**
     * Renderuje dolny blok z danymi powiązanymi.
     */
    async printDataview(dv) {
        this.init(dv);

        const output = this.getDataviewOutput();

        this.dv.el('div', output, { cls: 'file-journal-dataview' });
    }

    /**
     * Zwraca treść bloku informacyjnego zależnie od typu notatki.
     */
    getInfoOutput() {
        switch (this.kind) {
            case 'day':
                return this.dayInfo();
            case 'month':
                return this.monthInfo();
            case 'thisDay':
                return this.thisDayInfo();
            case 'thisMonth':
                return this.thisMonthInfo();
            case 'year':
                return this.yearInfo();
            case 'journal':
                return this.journalInfo();
            default:
                return this.unsupportedInfoMessage('printInfo');
        }
    }

    /**
     * Zwraca treść bloku Dataview zależnie od typu notatki.
     */
    getDataviewOutput() {
        switch (this.kind) {
            case 'day':
                return this.dayDataview();
            case 'month':
                return this.monthDataview();
            case 'thisDay':
                return this.thisDayDataview();
            case 'thisMonth':
                return this.thisMonthDataview();
            case 'year':
                return this.yearDataview();
            case 'journal':
                return this.journalDataview();
            default:
                return this.unsupportedInfoMessage('printDataview');
        }
    }

    /**
     * Rozpoznaje typ notatki po nazwie pliku.
     */
    getKind() {
        if (this.title === 'Journal') {
            return 'journal';
        }

        const kindsByTitleLength = {
            2: 'thisMonth',  // 01         - miesiąc dowolnego roku
            4: 'year',       // 2024       - konkretny rok
            5: 'thisDay',    // 01-01      - dzień miesiaca dowolnego roku
            7: 'month',      // 2024-01    - konkretny miesiąc danego roku
            10: 'day',       // 2024-01-01 - konkretny dzień danego roku
        };

        return kindsByTitleLength[this.title.length] ?? 'unknown';
    }

    /**
     * Ustala datę techniczną dla aktualnej notatki.
     */
    getDateForCurrentNote() {
        switch (this.kind) {
            case 'day':
                return moment(this.title);
            case 'month':
                return moment(`${this.title}-01`);
            case 'thisDay':
                return moment(`2024-${this.title}`);
            case 'thisMonth':
                return moment(`2024-${this.title}-01`);
            case 'year':
                return moment(`${this.title}-01-01`);
            case 'journal':
                return moment('2024-01-01');
            default:
                return moment.invalid();
        }
    }

    /**
     * Komunikat dla nierozpoznanego typu notatki.
     */
    unsupportedInfoMessage(source) {
        const message = `${source}: unsupported note title: ${this.title}`;
        console.log(message);
        return message;
    }

    /**
     * Zmienia pierwszą literę tekstu na wielką.
     */
    capitalizeFirst(text) {
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }

    /**
     * Tworzy nagłówek Markdown.
     */
    makeMdHeading(heading, level = 3) {
        return `${'#'.repeat(level)} ${heading}\n`;
    }

    /**
     * Renderuje sekcję listy Markdown.
     */
    renderSection(heading, items) {
        if (!items.length) {
            return '';
        }

        const list = items.map(item => `- ${item}`).join('\n');

        return `${this.makeMdHeading(heading)}${list}\n\n`;
    }

    /**
     * Tworzy link do pliku przez API Dataview.
     */
    fileLink(page, display = null) {
        return this.dv.fileLink(page.file.path, false, display ?? page.file.name);
    }

    /**
     * Tworzy link do istniejącej albo potencjalnej notatki.
     */
    wikiLink(path, display = null) {
        return `[[${path}|${display ?? path.split('/').pop()}]]`;
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
     * Sortuje strony po ścieżce pliku.
     */
    sortByPath(pages) {
        return pages.sort((a, b) => a.file.path.localeCompare(b.file.path));
    }

    /**
     * Sortuje strony po nazwie pliku.
     */
    sortByName(pages) {
        return pages.sort((a, b) => a.file.name.localeCompare(b.file.name));
    }

    /**
     * Odmienia słowo „wpis” dla podanej liczby.
     */
    sayWpisy(count) {
        const lastOne = count % 10;
        const lastTwo = count % 100;

        if (count === 1) {
            return 'wpis';
        }

        if (lastTwo >= 12 && lastTwo <= 14) {
            return 'wpisów';
        }

        if (lastOne >= 2 && lastOne <= 4) {
            return 'wpisy';
        }

        return 'wpisów';
    }

    /**
     * Zwraca wszystkie strony z Journalu.
     */
    journalPages() {
        return this.dv.pages(`"${this.root}"`).array();
    }

    /**
     * Zwraca wszystkie strony osób.
     */
    peoplePages() {
        return this.dv.pages('"People"').array();
    }

    /**
     * Zwraca strony danego rodzaju z Journalu.
     */
    journalPagesByKind(kind) {
        return this.journalPages().filter(page => page.kind === kind);
    }

    /**
     * Sprawdza, czy strona jest wpisem albo spisem Journalu.
     */
    isJournalPage(page) {
        return page.type === 'journal' || page.file.path.startsWith(`${this.root}/`);
    }

    /**
     * Sprawdza, czy strona linkuje do aktualnej notatki.
     */
    linksToCurrentFile(page) {
        return this.toArray(page.file?.outlinks)
            .some(link => link.path === this.file.path);
    }

    /**
     * Pobiera liczbę wpisów dziennych w danym roku.
     */
    countDayPagesInYear(year) {
        return this.dv
            .pages(`"${this.root}/${year}"`)
            .where(page => page.kind === 'day')
            .length;
    }

    /**
     * Pobiera liczbę wpisów dziennych w danym miesiącu roku.
     */
    countDayPagesInYearMonth(year, month) {
        const monthPadded = String(month).padStart(2, '0');
        const path = `${this.root}/${year}/${year}-${monthPadded}`;

        return this.dv
            .pages(`"${path}"`)
            .where(page => page.kind === 'day')
            .length;
    }

    /**
     * Pobiera liczbę wpisów dziennych dla stałego miesiąca, niezależnie od roku.
     */
    countDayPagesInMonth(month) {
        const monthInt = Number(month);

        return this.journalPages()
            .filter(page => page.kind === 'day')
            .filter(page => Number(page.month) === monthInt)
            .length;
    }

    /**
     * Pobiera liczbę wpisów dziennych dla stałej daty, niezależnie od roku.
     */
    countDayPagesOnMonthDay(month, day) {
        const monthInt = Number(month);
        const dayInt = Number(day);

        return this.journalPages()
            .filter(page => page.kind === 'day')
            .filter(page => Number(page.month) === monthInt)
            .filter(page => Number(page.day) === dayInt)
            .length;
    }

    /**
     * Sprawdza święta dla daty rocznej i stałej daty miesięcznej.
     */
    getHolidays(year, month, day) {
        const yearPadded = String(year);
        const monthPadded = String(month).padStart(2, '0');
        const dayPadded = String(day).padStart(2, '0');

        const fixedDayPath = `${this.root}/${monthPadded}/${monthPadded}-${dayPadded}`;
        const yearDayPath = `${this.root}/${yearPadded}/${yearPadded}-${monthPadded}/${yearPadded}-${monthPadded}-${dayPadded}`;

        const holidays = [];

        const fixedDay = this.dv.page(fixedDayPath);
        const yearDay = this.dv.page(yearDayPath);

        if (fixedDay?.holiday) {
            holidays.push(fixedDay.holiday);
        }

        if (yearDay?.holiday && !holidays.includes(yearDay.holiday)) {
            holidays.push(yearDay.holiday);
        }

        return holidays;
    }

    /**
     * Sprawdza, czy data jest świętem.
     */
    isHoliday(year, month, day) {
        return this.getHolidays(year, month, day).length > 0;
    }

    /**
     * Renderuje kalendarz miesiąca.
     */
    makeMonthCalendar() {
        const year = String(this.fm.year ?? this.date.format('YYYY'));
        const month = String(this.fm.month ?? this.date.format('MM')).padStart(2, '0');
        const daysInMonth = Number(this.fm.days ?? this.date.daysInMonth());

        const firstDay = moment(`${year}-${month}-01`);
        const firstDayDow = firstDay.isoWeekday();

        let calendar = '<table class="file-journal-month-calendar"><tr>';

        for (let i = 1; i <= 7; i++) {
            const dayName = this.capitalizeFirst(moment().locale(this.locale).isoWeekday(i).format('ddd'));
            calendar += `<th>${dayName}</th>`;
        }

        calendar += '</tr><tr>';

        for (let i = 1; i < firstDayDow; i++) {
            calendar += '<td></td>';
        }

        let dow = firstDayDow;

        for (let i = 1; i <= daysInMonth; i++) {
            const day = String(i).padStart(2, '0');
            const file = `${year}-${month}-${day}`;
            const path = `${this.root}/${year}/${year}-${month}/`;
            const link = this.dayCalendarLink(path, file, i);
            const isHoliday = this.isHoliday(year, month, day) || dow === 7;

            calendar += isHoliday
                ? `<td class="holiday">${link}</td>`
                : `<td>${link}</td>`;

            if (dow % 7 === 0) {
                calendar += '</tr><tr>';
                dow = 1;
            } else {
                dow++;
            }
        }

        for (let i = dow; i <= 7 && dow !== 1; i++) {
            calendar += '<td></td>';
        }

        calendar += '</tr></table>';

        return calendar;
    }

    /**
     * Tworzy link do dnia w kalendarzu miesięcznym.
     */
    dayCalendarLink(path, file, display) {
        if (this.dv.page(file)) {
            return `<span class="cm-strong"><a href="${file}.md" class="internal-link">${display}</a></span>`;
        }

        return `<a href="${path}${file}.md" class="internal-link is-unresolved">${display}</a>`;
    }

    /**
     * Renderuje informacje dla głównej strony Journal.
     */
    journalInfo() {
        const year = this.date.format('YYYY');
        const years = this.journalPagesByKind('year')
            .map(page => Number(page.file.name))
            .filter(Boolean)
            .sort((a, b) => a - b);

        const yearLinks = this.yearJournalLinks(years);
        const monthLinks = this.monthJournalLinks(year);

        return [
            `**Wpisy wg lat**: ${yearLinks}`,
            '',
            '',
            `**Wpisy wg miesięcy**: ${monthLinks}`,
        ].join('\n');
    }

    /**
     * Tworzy linki do rocznych spisów Journalu.
     */
    yearJournalLinks(years) {
        if (!years.length) {
            return '';
        }

        return years.map(year => {
            const count = this.countDayPagesInYear(year);
            const link = this.wikiLink(`${this.root}/${year}/${year}`, year);

            return count > 0 ? `${link} (${count})` : link;
        }).join(this.symbols.sep);
    }

    /**
     * Tworzy linki do stałych miesięcznych spisów Journalu.
     */
    monthJournalLinks(referenceYear) {
        const links = [];

        for (let i = 1; i <= 12; i++) {
            const month = String(i).padStart(2, '0');
            const date = moment(`${referenceYear}-${month}-01`);
            const count = this.countDayPagesInMonth(i);
            const link = this.wikiLink(`${this.root}/${month}/${month}`, date.format('MMMM'));

            links.push(count > 0 ? `${link} (${count})` : link);
        }

        return links.join(this.symbols.sep);
    }

    /**
     * Renderuje dane dla strony roku.
     */
    yearInfo() {
        const year = this.date.format('YYYY');
        const allPages = this.countDayPagesInYear(year);

        const monthLinks = [];

        for (let i = 1; i <= 12; i++) {
            const month = String(i).padStart(2, '0');
            const date = moment(`${year}-${month}-01`);
            const count = this.countDayPagesInYearMonth(year, month);
            const link = this.wikiLink(`${this.root}/${year}/${year}-${month}/${year}-${month}`, date.format('MMMM'));

            monthLinks.push(count > 0 ? `${link} (${count})` : link);
        }

        return `**${allPages} ${this.sayWpisy(allPages)}**: ${monthLinks.join(this.symbols.sep)}`;
    }

    /**
     * Renderuje dane dla strony miesiąca konkretnego roku.
     */
    monthInfo() {
        return this.makeMonthCalendar();
    }

    /**
     * Renderuje dane dla strony dnia.
     */
    dayInfo() {
        const year = this.date.format('YYYY');
        const month = this.date.format('MM');
        const day = this.date.format('DD');

        const parts = [
            this.weatherInfo(),
            this.sunInfo(),
            this.moonInfo(),
            this.holidayInfo(year, month, day),
            this.dayOfYearInfo(),
            this.lifeDayInfo(),
        ].filter(Boolean);

        return parts.join('');
    }

    /**
     * Renderuje informacje pogodowe.
     */
    weatherInfo() {
        let tempMinMax = '';

        if (this.fm.tempmin && this.fm.tempmax) {
            tempMinMax = `${this.fm.tempmin}-${this.fm.tempmax}°C`;
        } else if (this.fm.tempmin) {
            tempMinMax = `min ${this.fm.tempmin}°C`;
        } else if (this.fm.tempmax) {
            tempMinMax = `max ${this.fm.tempmax}°C`;
        }

        const parts = [];

        if (this.fm.temp) {
            parts.push(`🌡 ${this.fm.temp}°C${tempMinMax ? ` (${tempMinMax})` : ''}`);
        } else if (tempMinMax) {
            parts.push(`🌡 ${tempMinMax}`);
        }

        if (this.fm.wind) {
            parts.push(`༄ ${this.fm.wind} ㎞/h`);
        }

        return parts.length ? `${parts.join(' • ')}\n` : '';
    }

    /**
     * Renderuje dane słoneczne.
     */
    sunInfo() {
        if (!this.fm.sunrise && !this.fm.sunmax && !this.fm.sunset) {
            return '';
        }

        return `🌞︎︎ ↗ ${this.fm.sunrise ?? ''} ⋂ ${this.fm.sunmax ?? ''} ↘ ${this.fm.sunset ?? ''}\n`;
    }

    /**
     * Renderuje dane księżycowe.
     */
    moonInfo() {
        if (!this.fm.moonface && !this.fm.moonrise && !this.fm.moonmax && !this.fm.moonset) {
            return '';
        }

        const face = this.fm.moonface ? `${this.fm.moonface}%↑ ` : '';

        return `🌒︎ ${face}↗ ${this.fm.moonrise ?? ''} ⋂ ${this.fm.moonmax ?? ''} ↘ ${this.fm.moonset ?? ''}\n`;
    }

    /**
     * Renderuje święta dla danego dnia.
     */
    holidayInfo(year, month, day) {
        const holidays = this.getHolidays(year, month, day);

        if (!holidays.length) {
            return '';
        }

        const output = holidays
            .map(holiday => `<span class="holiday">${holiday}</span>`)
            .join(', ');

        return `${output}, `;
    }

    /**
     * Renderuje numer dnia i tygodnia roku.
     */
    dayOfYearInfo() {
        const doy = this.fm.doy ?? this.date.dayOfYear();
        const week = this.fm.week ?? this.date.isoWeek();

        return `${doy} dzień roku (${week} tydzień), `;
    }

    /**
     * Renderuje numer dnia życia, jeśli istnieje.
     */
    lifeDayInfo() {
        return this.fm.lifedays ? `${this.fm.lifedays}. dzień życia` : '';
    }

    /**
     * Renderuje dane dla stałej strony dnia, np. 01-01.
     */
    thisDayInfo() {
        return [
            `Rodzaj: ${this.kind}, data: ${this.date.format('YYYY-MM-DD')}`,
            `CSS: file-journal-info`,
            'Informacja o tym dniu (święta)',
        ].join('\n');
    }

    /**
     * Renderuje dane dla stałej strony miesiąca, np. 01.
     */
    thisMonthInfo() {
        const month = this.date.format('MM');
        const monthInt = Number(month);
        const monthPath = `${this.root}/${month}/${month}`;
        const daysInMonth = this.date.daysInMonth();

        const links = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const day = String(i).padStart(2, '0');
            const file = `${monthPath}-${day}`;
            const count = this.countDayPagesOnMonthDay(monthInt, i);
            const link = this.thisMonthDayLink(file, i);

            links.push(count > 0 ? `${link} (${count})` : link);
        }

        return links.join(this.symbols.sep);
    }

    /**
     * Tworzy link do stałego dnia miesiąca.
     */
    thisMonthDayLink(file, display) {
        if (this.dv.page(file)) {
            return `<span class="cm-strong"><a href="${file}.md" class="internal-link">${display}</a></span>`;
        }

        return `<a href="${file}.md" class="internal-link is-unresolved">${display}</a>`;
    }

    /**
     * Renderuje dolną sekcję dla głównej strony Journal.
     */
    journalDataview() {
        const items = this.journalPagesByKind('year')
            .sort((a, b) => a.file.name.localeCompare(b.file.name))
            .map(page => `${this.fileLink(page)}${page.summary ? `: ${page.summary}` : ''}`);

        return this.renderSection('Rok po roku', items) || 'brak danych do wyświetlenia';
    }

    /**
     * Renderuje dolną sekcję dla strony roku.
     */
    yearDataview() {
        const year = this.date.format('YYYY');

        const sections = [
            this.yearHolidaysSection(year),
            this.yearMonthsSection(year),
            this.yearBirthdaysSection(year),
            this.yearDeathdaysSection(year),
        ].filter(Boolean);

        return sections.join('') || 'brak danych do wyświetlenia';
    }

    /**
     * Renderuje sekcję świąt wolnych od pracy dla roku.
     */
    yearHolidaysSection(year) {
        const items = this.yearHolidayPages(year).map(page => {
            const month = String(page.month).padStart(2, '0');
            const day = String(page.day).padStart(2, '0');
            const display = `${month}-${day}`;

            return `${this.dv.fileLink(page.file.path, false, display)}: ${page.holiday}`;
        });

        return this.renderSection(`Święta wolne od pracy (${items.length})`, items);
    }

    /**
     * Zwraca strony świąt z danego roku.
     */
    yearHolidayPages(year) {
        return this.dv
            .pages(`"${this.root}/${year}"`)
            .where(page => page.holiday)
            .sort(page => page.file.name, this.defaults.sort)
            .array();
    }

    /**
     * Renderuje sekcję miesięcy z podsumowaniami dla roku.
     */
    yearMonthsSection(year) {
        const items = this.dv
            .pages(`"${this.root}/${year}"`)
            .where(page => page.kind === 'month')
            .where(page => page.summary)
            .sort(page => page.file.path, this.defaults.sort)
            .array()
            .map(page => {
                const monthName = page.monthname ?? moment(`${year}-${String(page.month).padStart(2, '0')}-01`).format('MMMM');

                return `${this.dv.fileLink(page.file.path, false, monthName)}: ${page.summary}`;
            });

        return this.renderSection('Miesiącami', items);
    }

    /**
     * Renderuje sekcję osób urodzonych w danym roku.
     */
    yearBirthdaysSection(year) {
        const items = this.peoplePages()
            .filter(page => page.birthdate && Number(page.birthdate.year) === Number(year))
            .sort((a, b) => this.compareDates(a.birthdate, b.birthdate))
            .map(page => this.formatYearPersonDate(page, 'birthdate'));

        return this.renderSection(`Urodzili się (${items.length})`, items);
    }

    /**
     * Renderuje sekcję osób zmarłych w danym roku.
     */
    yearDeathdaysSection(year) {
        const items = this.peoplePages()
            .filter(page => page.deathdate && Number(page.deathdate.year) === Number(year))
            .sort((a, b) => this.compareDates(a.deathdate, b.deathdate))
            .map(page => this.formatYearPersonDate(page, 'deathdate'));

        return this.renderSection(`Zmarli (${items.length})`, items);
    }

    /**
     * Formatuje osobę w sekcji rocznej daty urodzenia/śmierci.
     */
    formatYearPersonDate(page, field) {
        const date = page[field];
        const month = String(date.month).padStart(2, '0');
        const day = String(date.day).padStart(2, '0');
        const year = String(date.year);
        const dateName = `${year}-${month}-${day}`;
        const display = `${month}-${day}`;

        const maidenName = page.maidenname ? ` (${page.maidenname})` : '';

        return `${this.dv.fileLink(dateName, false, display)}: ${this.fileLink(page)}${maidenName}`;
    }

    /**
     * Renderuje dolną sekcję dla strony miesiąca konkretnego roku.
     */
    monthDataview() {
        const year = this.date.format('YYYY');
        const month = this.date.format('MM');
        const dir = `${this.root}/${year}/${year}-${month}`;
        const heading = `${this.capitalizeFirst(this.date.locale(this.locale).format('MMMM'))} dzień po dniu`;

        const items = this.dv
            .pages(`"${dir}"`)
            .where(page => page.kind === 'day')
            .where(page => page.summary)
            .sort(page => page.file.path, this.defaults.sort)
            .array()
            .map(page => {
                const day = page.day ?? page.file.frontmatter?.day ?? Number(page.file.name.slice(-2));
                const shortName = page.shortname ?? page.file.frontmatter?.shortname ?? '';

                const dayLink = this.dv.fileLink(page.file.path, false, String(day));
                const label = shortName
                    ? `**${dayLink}** (${shortName})`
                    : `**${dayLink}**`;

                return `${label}: ${page.summary}`;
            });

        return this.renderSection(heading, items) || 'brak danych do wyświetlenia';
    }

    /**
     * Renderuje dolną sekcję dla strony dnia.
     */
    dayDataview() {
        const items = this.dv
            .pages()
            .where(page => page.file.path !== this.file.path)
            .where(page => !this.isJournalPage(page))
            .where(page => this.linksToCurrentFile(page))
            .sort(page => page.file.name, this.defaults.sort)
            .array()
            .map(page => this.fileLink(page));

        return this.renderSection('Backlinks', items);
    }

    /**
     * Renderuje dolną sekcję dla stałej strony dnia, np. 01-01.
     */
    thisDayDataview() {
        const day = Number(this.date.format('D'));
        const month = Number(this.date.format('M'));

        const sections = [
            this.onThisDaySection(day, month),
            this.birthdaysOnDaySection(day, month),
            this.deathdaysOnDaySection(day, month),
        ].filter(Boolean);

        return sections.join('') || 'brak danych do wyświetlenia';
    }

    /**
     * Renderuje wpisy z Journalu z danego dnia i miesiąca, niezależnie od roku.
     */
    onThisDaySection(day, month) {
        const items = this.journalPagesByKind('day')
            .filter(page => Number(page.month) === Number(month))
            .filter(page => Number(page.day) === Number(day))
            .sort((a, b) => a.file.path.localeCompare(b.file.path))
            .map(page => {
                const year = page.year ?? page.file.name.slice(0, 4);

                return `${this.dv.fileLink(page.file.path, false, year)}${page.summary ? `: ${page.summary}` : ''}`;
            });

        return this.renderSection('Tego dnia', items);
    }

    /**
     * Renderuje osoby urodzone danego dnia i miesiąca.
     */
    birthdaysOnDaySection(day, month) {
        const items = this.peoplePages()
            .filter(page => page.birthdate)
            .filter(page => Number(page.birthdate.month) === Number(month))
            .filter(page => Number(page.birthdate.day) === Number(day))
            .sort((a, b) => this.compareDates(a.birthdate, b.birthdate))
            .map(page => {
                if (Number(page.birthdate.year) === 1900) {
                    return this.fileLink(page);
                }

                return `${this.dv.fileLink(String(page.birthdate.year), false, String(page.birthdate.year))}: ${this.fileLink(page)}`;
            });

        return this.renderSection('Urodzili się', items);
    }

    /**
     * Renderuje osoby zmarłe danego dnia i miesiąca.
     */
    deathdaysOnDaySection(day, month) {
        const items = this.peoplePages()
            .filter(page => page.deathdate)
            .filter(page => Number(page.deathdate.month) === Number(month))
            .filter(page => Number(page.deathdate.day) === Number(day))
            .sort((a, b) => this.compareDates(a.deathdate, b.deathdate))
            .map(page => `${this.dv.fileLink(String(page.deathdate.year), false, String(page.deathdate.year))}: ${this.fileLink(page)}`);

        return this.renderSection('Zmarli', items);
    }

    /**
     * Renderuje dolną sekcję dla stałej strony miesiąca, np. 01.
     */
    thisMonthDataview() {
        const month = this.date.format('MM');

        const sections = [
            this.fixedHolidaysSection(month),
            this.onThisMonthSection(month),
        ].filter(Boolean);

        return sections.join('') || 'brak danych do wyświetlenia';
    }

    /**
     * Renderuje stałe święta i obchody danego miesiąca.
     */
    fixedHolidaysSection(month) {
        const items = this.dv
            .pages(`"${this.root}/${month}"`)
            .where(page => page.holiday || page.celebration)
            .sort(page => page.file.path, this.defaults.sort)
            .array()
            .map(page => {
                const day = String(page.day ?? page.file.name.slice(-2));
                const parts = [
                    page.holiday ? `<span class='red cm-strong'>${page.holiday}</span>` : '',
                    page.celebration ?? '',
                ].filter(Boolean);

                return `${this.dv.fileLink(page.file.path, false, day)}: ${parts.join(', ')}`;
            });

        return this.renderSection('Stałe święta', items);
    }

    /**
     * Renderuje podsumowania tego miesiąca rok po roku.
     */
    onThisMonthSection(month) {
        const monthInt = Number(month);
        const heading = `${this.capitalizeFirst(this.date.locale(this.locale).format('MMMM'))} rok po roku`;

        const items = this.journalPagesByKind('month')
            .filter(page => Number(page.month) === monthInt)
            .sort((a, b) => a.file.path.localeCompare(b.file.path))
            .map(page => {
                const year = page.year ?? page.file.name.slice(0, 4);

                return `${this.dv.fileLink(page.file.path, false, year)}${page.summary ? `: ${page.summary}` : ''}`;
            });

        return this.renderSection(heading, items);
    }

    /**
     * Porównuje dwie daty Dataview.
     */
    compareDates(a, b) {
        const ay = Number(a.year ?? 0);
        const by = Number(b.year ?? 0);
        const am = Number(a.month ?? 0);
        const bm = Number(b.month ?? 0);
        const ad = Number(a.day ?? 0);
        const bd = Number(b.day ?? 0);

        if (ay !== by) return ay - by;
        if (am !== bm) return am - bm;

        return ad - bd;
    }

}
