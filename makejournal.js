/**
 * makejournal.js
 *
 * autor: github.com/barabasz/
 * repo: https://github.com/barabasz/obsidian
 * wersja: 2026-07-06 rev. 2
 *
 * Generator metadanych i elementów szablonu dla notatek w gałęzi Journal.
 * Używany przez plugin Templater.
 *
 * Przykład użycia w szablonie:
 *
 * <%*
 * j = tp.user.makejournal(tp.file.title)
 * -%>
 *
 * type: journal
 * kind: <% j.kind %>
 * title: <% j.title %>
 * aliases: <% j.aliases %>
 * tags: <% j.tags %>
 * <% j.frontmatter %>
 * created: <% j.now %>
 * uuid: <% tp.user.uuid() %>
 * cssclasses: <% j.cssclasses %>
 *
 */

const momentLib = typeof moment !== 'undefined'
    ? moment
    : require(require('os').homedir() + '/Documents/Scripts/node_modules/moment');

/**
 * Zmienia pierwszą literę tekstu na wielką.
 */
function capitalizeFirst(text) {
    const value = String(text ?? '');
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Słownik etykiet używanych w Journalu.
 */
class JournalDictionary {

    constructor() {
        this.day = { pl: 'dzień', en: 'day' };
        this.byDays = { pl: 'dzień po dniu', en: 'by days' };
        this.month = { pl: 'miesiąc', en: 'month' };
        this.byMonth = { pl: 'miesiącami', en: 'by months' };
        this.year = { pl: 'rok', en: 'year' };
        this.onThisDay = { pl: 'Tego dnia…', en: 'On this day…' };
        this.thisMonth = { pl: 'Rok po roku…', en: 'Year by year…' };
    }

}

/**
 * Dane pomocnicze roku, np. 2026.
 */
class JournalYear {

    constructor(date) {
        const obj = momentLib(date);

        this.year = Number(obj.format('YYYY'));
        this.days = momentLib(`${this.year}-12-31`).dayOfYear();
        this.isLeap = obj.isLeapYear();

        this.dir = `${Journal.dir}/${this.year}`;
        this.path = `${this.dir}/${this.year}`;
        this.link = Journal.link(this.path, this.year);
    }

}

/**
 * Dane pomocnicze konkretnego miesiąca roku, np. 2026-07.
 */
class JournalMonth {

    constructor(date) {
        const obj = momentLib(date);

        this.year = Number(obj.format('YYYY'));
        this.month = obj.format('MM');
        this.monthInt = Number(obj.format('M'));

        this.name = obj.locale(Journal.locale).format('MMMM');
        this.nameEn = obj.locale('en').format('MMMM');
        this.nameCap = capitalizeFirst(this.name);
        this.nameGen = obj.locale(Journal.locale).format('LL').split(' ')[1];

        this.fullName = `${this.name} ${this.year}`;
        this.fullNameEn = `${this.nameEn} ${this.year}`;

        this.days = Number(obj.daysInMonth());
        this.firstDay = obj.clone().startOf('month').format(Journal.formatDay);
        this.firstDayDow = momentLib(this.firstDay).isoWeekday();
        this.lastDay = obj.clone().endOf('month').format(Journal.formatDay);
        this.lastDayNum = obj.clone().endOf('month').format('DD');
        this.lastDayDow = momentLib(this.lastDay).isoWeekday();

        this.dir = `${Journal.dir}/${this.year}/${this.year}-${this.month}`;
        this.path = `${this.dir}/${this.year}-${this.month}`;
        this.link = Journal.link(this.path, this.name);
        this.linkCap = Journal.link(this.path, this.nameCap);
        this.linkGen = Journal.link(this.path, this.nameGen);

        this.pathThisMonth = `${Journal.dir}/${this.month}/${this.month}`;
        this.linkThisMonth = Journal.link(this.pathThisMonth, this.nameCap);
    }

}

/**
 * Dane pomocnicze konkretnego dnia roku, np. 2026-07-06.
 */
class JournalDay {

    constructor(date) {
        const obj = momentLib(date);

        this.date = obj.format(Journal.formatDay);
        this.year = Number(obj.format('YYYY'));
        this.month = obj.format('MM');
        this.monthInt = Number(obj.format('M'));
        this.day = obj.format('DD');
        this.dayInt = Number(obj.format('D'));

        this.name = obj.locale(Journal.locale).format('dddd');
        this.nameCap = capitalizeFirst(this.name);
        this.nameEn = obj.locale('en').format('dddd');
        this.shortName = obj.locale(Journal.locale).format('dd').toLowerCase();

        this.fullName = obj.locale(Journal.locale).format('LL');
        this.fullNameEn = obj.locale('en').format('D MMMM YYYY');
        this.fullNameEnAlt = obj.locale('en').format('MMMM D, YYYY');

        this.dow = Number(obj.format('E'));
        this.doy = obj.dayOfYear();
        this.week = obj.isoWeek();
        this.lifedays = obj.diff(momentLib(Journal.birthday, Journal.formatDay), 'days') + 1;

        this.dir = `${Journal.dir}/${this.year}/${this.year}-${this.month}`;
        this.path = `${this.dir}/${this.date}`;

        this.link = Journal.link(this.path, this.date);
        this.linkName = Journal.link(this.path, this.name);

        this.pathThisDay = `${Journal.dir}/${this.month}/${this.month}-${this.day}`;
        this.linkThisDay = Journal.link(this.pathThisDay, this.dayInt);
    }

}

/**
 * Dane pomocnicze stałego dnia miesiąca, np. 07-06.
 */
class JournalThisDay {

    constructor(date) {
        const obj = momentLib(date);

        this.name = obj.locale(Journal.locale).format(Journal.formatThisDay);
        this.nameEn = obj.locale('en').format(Journal.formatThisDay);

        this.filename = obj.format('MM-DD');
        this.month = obj.format('MM');
        this.monthInt = Number(obj.format('M'));
        this.day = obj.format('DD');
        this.dayInt = Number(obj.format('D'));

        this.dir = `${Journal.dir}/${this.month}`;
        this.path = `${this.dir}/${this.filename}`;
        this.link = Journal.link(this.path, this.name);
        this.linkGen = Journal.link(this.path, this.name);
    }

}

/**
 * Dane pomocnicze stałego miesiąca, np. 07.
 */
class JournalThisMonth {

    constructor(date) {
        const obj = momentLib(date);

        this.month = obj.format('MM');
        this.monthInt = Number(obj.format('M'));

        this.name = obj.locale(Journal.locale).format('MMMM');
        this.nameEn = obj.locale('en').format('MMMM');
        this.nameCap = capitalizeFirst(this.name);
        this.nameGen = obj.locale(Journal.locale).format('LL').split(' ')[1];

        this.dir = `${Journal.dir}/${this.month}`;
        this.path = `${this.dir}/${this.month}`;

        this.link = Journal.link(this.path, this.name);
        this.linkCap = Journal.link(this.path, this.nameCap);
        this.linkGen = Journal.link(this.path, this.nameGen);
    }

}

/**
 * Główna klasa generująca metadane i elementy szablonu Journalu.
 */
class Journal {

    static birthday = '1979-06-14';
    static locale = 'pl';

    static name = 'Journal';
    static dir = 'Journal';

    static formatDateTime = 'YYYY-MM-DD HH:mm';
    static formatMonth = 'YYYY-MM';
    static formatDay = 'YYYY-MM-DD';
    static formatThisDay = 'D MMMM';

    /**
     * Tworzy link wiki.
     */
    static link(path, display = null) {
        return `[[${path}|${display ?? path.split('/').pop()}]]`;
    }

    /**
     * Tworzy generator dla pliku o podanej nazwie.
     */
    constructor(filename) {
        this.dict = new JournalDictionary();

        this.filename = filename;
        this.locale = Journal.locale;
        this.name = Journal.name;
        this.path = `${Journal.dir}/${Journal.name}`;
        this.link = Journal.link(this.path, this.name);

        this.defaults = {
            year: '2024',
            month: '01',
            day: '01',
        };

        this.symbols = {
            cal: '🗓',
            left: '← ',
            right: ' →',
            sep: ' • ',
        };

        this.kind = this.getKind(filename);
        this.tags = `journal/${this.kind}`;
        this.now = momentLib().local().format(Journal.formatDateTime);

        this.frontmatter = '';
        this.aliases = '[]';
        this.cssclasses = '[]';
        this.nav = '';
        this.title = filename;
        this.header = filename;

        this.date = this.getDateForCurrentNote();

        this.setCurrentNote();
    }

    /**
     * Rozpoznaje typ notatki po nazwie pliku.
     */
    getKind(filename) {
        if (filename === Journal.name) {
            return 'journal';
        }

        const kindsByTitleLength = {
            2: 'thisMonth', // 01
            4: 'year',      // 2026
            5: 'thisDay',   // 07-06
            7: 'month',     // 2026-07
            10: 'day',      // 2026-07-06
        };

        return kindsByTitleLength[filename.length] ?? 'unknown';
    }

    /**
     * Ustala datę techniczną dla aktualnej notatki.
     */
    getDateForCurrentNote() {
        switch (this.kind) {
            case 'day':
                return momentLib(this.filename, Journal.formatDay, true);
            case 'month':
                return momentLib(`${this.filename}-${this.defaults.day}`, Journal.formatDay, true);
            case 'year':
                return momentLib(`${this.filename}-${this.defaults.month}-${this.defaults.day}`, Journal.formatDay, true);
            case 'thisDay':
                return momentLib(`${this.defaults.year}-${this.filename}`, Journal.formatDay, true);
            case 'thisMonth':
                return momentLib(`${this.defaults.year}-${this.filename}-${this.defaults.day}`, Journal.formatDay, true);
            case 'journal':
                return momentLib(`${this.defaults.year}-${this.defaults.month}-${this.defaults.day}`, Journal.formatDay, true);
            default:
                return momentLib.invalid();
        }
    }

    /**
     * Uruchamia konfigurację odpowiednią dla rozpoznanego typu notatki.
     */
    setCurrentNote() {
        switch (this.kind) {
            case 'journal':
                this.setJournal();
                break;
            case 'year':
                this.setYear();
                break;
            case 'month':
                this.setMonth();
                break;
            case 'day':
                this.setDay();
                break;
            case 'thisMonth':
                this.setThisMonth();
                break;
            case 'thisDay':
                this.setThisDay();
                break;
            default:
                this.setUnknown();
        }
    }

    /**
     * Formatuje pojedynczą wartość YAML.
     */
    yamlValue(value) {
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        return String(value);
    }

    /**
     * Tworzy linie frontmatter z obiektu.
     */
    makeYamlItems(obj) {
        return Object.entries(obj)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => `${key}: ${this.yamlValue(value)}`)
            .join('\n');
    }

    /**
     * Tworzy listę YAML do wstawienia po kluczu, np. aliases albo cssclasses.
     */
    makeYamlList(items) {
        const values = items.filter(Boolean);

        if (!values.length) {
            return '[]';
        }

        return values.map(item => `\n  - ${item}`).join('');
    }

    /**
     * Konfiguruje główną notatkę Journal.
     */
    setJournal() {
        this.frontmatter = '';
        this.aliases = this.makeYamlList([Journal.name]);
        this.cssclasses = this.makeYamlList(['file-journal', 'file-journal-root']);

        this.nav = '';
        this.title = Journal.name;
        this.header = `${this.symbols.cal} ${Journal.name}`;
    }

    /**
     * Konfiguruje konkretną notatkę dzienną, np. 2026-07-06.
     */
    setDay() {
        this.thisDay = new JournalDay(this.date);
        this.prevDay = new JournalDay(momentLib(this.date).subtract(1, 'd'));
        this.nextDay = new JournalDay(momentLib(this.date).add(1, 'd'));
        this.thisMonth = new JournalMonth(this.date);
        this.thisYear = new JournalYear(this.date);

        this.frontmatter = this.makeYamlItems({
            year: this.thisYear.year,
            month: this.thisMonth.monthInt,
            name: this.thisDay.name,
            shortname: this.thisDay.shortName,
            day: this.thisDay.dayInt,
            dow: this.thisDay.dow,
            doy: this.thisDay.doy,
            week: this.thisDay.week,
            lifedays: this.thisDay.lifedays,
            prevday: this.prevDay.date,
            nextday: this.nextDay.date,
        });

        this.aliases = this.makeYamlList([
            this.thisDay.fullName,
            this.thisDay.fullNameEn,
            this.thisDay.fullNameEnAlt,
        ]);

        this.cssclasses = this.makeYamlList([
            'file-journal',
            'file-journal-day',
        ]);

        this.nav = [
            `${this.symbols.left}${this.prevDay.linkName}`,
            this.nextDay.linkName,
        ].join(this.symbols.sep) + this.symbols.right;

        this.title = `${this.thisDay.dayInt} ${this.thisMonth.nameGen} ${this.thisYear.year}`;

        this.header = [
            Journal.link(Journal.dir, this.symbols.cal),
            Journal.link(this.path, this.thisDay.nameCap),
            `${this.thisDay.linkThisDay} ${this.thisMonth.linkGen} ${this.thisYear.link}`,
        ].join(' ');
    }

    /**
     * Konfiguruje konkretną notatkę miesięczną, np. 2026-07.
     */
    setMonth() {
        this.thisMonth = new JournalMonth(this.date);
        this.prevMonth = new JournalMonth(momentLib(this.date).subtract(1, 'M'));
        this.nextMonth = new JournalMonth(momentLib(this.date).add(1, 'M'));
        this.thisYear = new JournalYear(this.date);

        this.frontmatter = this.makeYamlItems({
            year: this.thisYear.year,
            month: this.thisMonth.monthInt,
            monthname: this.thisMonth.name,
            firstdotw: this.thisMonth.firstDayDow,
            lastdotw: this.thisMonth.lastDayDow,
            days: this.thisMonth.lastDayNum,
        });

        this.aliases = this.makeYamlList([
            this.thisMonth.fullName,
            this.thisMonth.fullNameEn,
        ]);

        this.cssclasses = this.makeYamlList([
            'file-journal',
            'file-journal-month',
        ]);

        this.nav = [
            `${this.symbols.left}${this.prevMonth.link}`,
            this.nextMonth.link,
        ].join(this.symbols.sep) + this.symbols.right;

        this.title = `${this.thisMonth.nameCap} ${this.thisYear.year}`;

        this.header = [
            Journal.link(Journal.dir, this.symbols.cal),
            this.thisMonth.linkThisMonth,
            this.thisYear.link,
        ].join(' ');
    }

    /**
     * Konfiguruje konkretną notatkę roczną, np. 2026.
     */
    setYear() {
        this.thisYear = new JournalYear(this.date);
        this.prevYear = new JournalYear(momentLib(this.date).subtract(1, 'Y'));
        this.nextYear = new JournalYear(momentLib(this.date).add(1, 'Y'));

        this.frontmatter = this.makeYamlItems({
            year: this.thisYear.year,
            isleap: this.thisYear.isLeap,
        });

        this.aliases = this.makeYamlList([
            `${this.dict.year.pl} ${this.thisYear.year}`,
        ]);

        this.cssclasses = this.makeYamlList([
            'file-journal',
            'file-journal-year',
        ]);

        this.nav = [
            `${this.symbols.left}${this.prevYear.link}`,
            this.nextYear.link,
        ].join(this.symbols.sep) + this.symbols.right;

        this.title = `${capitalizeFirst(this.dict.year.pl)} ${this.thisYear.year}`;

        this.header = [
            Journal.link(Journal.dir, this.symbols.cal),
            Journal.link(Journal.dir, capitalizeFirst(this.dict.year.pl)),
            this.thisYear.year,
        ].join(' ');
    }

    /**
     * Konfiguruje stałą notatkę dnia, np. 07-06.
     */
    setThisDay() {
        this.thisDay = new JournalThisDay(this.date);
        this.thisMonth = new JournalThisMonth(this.date);
        this.prevDay = new JournalThisDay(momentLib(this.date).subtract(1, 'd'));
        this.nextDay = new JournalThisDay(momentLib(this.date).add(1, 'd'));

        this.frontmatter = this.makeYamlItems({
            month: this.thisDay.monthInt,
            day: this.thisDay.dayInt,
        });

        this.aliases = this.makeYamlList([
            `${this.thisDay.dayInt} ${this.thisMonth.nameGen}`,
            `${this.thisDay.dayInt} ${this.thisMonth.nameEn}`,
        ]);

        this.cssclasses = this.makeYamlList([
            'file-journal',
            'file-journal-thisday',
        ]);

        this.nav = [
            `${this.symbols.left}${this.prevDay.link}`,
            this.nextDay.link,
        ].join(this.symbols.sep) + this.symbols.right;

        this.title = `${this.thisDay.dayInt} ${this.thisMonth.nameGen}`;

        this.header = [
            Journal.link(Journal.dir, this.symbols.cal),
            Journal.link(this.path, this.thisDay.dayInt),
            this.thisMonth.linkGen,
        ].join(' ');
    }

    /**
     * Konfiguruje stałą notatkę miesiąca, np. 07.
     */
    setThisMonth() {
        this.thisMonth = new JournalThisMonth(this.date);
        this.prevMonth = new JournalThisMonth(momentLib(this.date).subtract(1, 'M'));
        this.nextMonth = new JournalThisMonth(momentLib(this.date).add(1, 'M'));

        this.frontmatter = this.makeYamlItems({
            month: this.thisMonth.monthInt,
            monthname: this.thisMonth.name,
            genetivus: this.thisMonth.nameGen,
        });

        this.aliases = this.makeYamlList([
            this.thisMonth.name,
            this.thisMonth.nameGen,
            this.thisMonth.nameEn,
        ]);

        this.cssclasses = this.makeYamlList([
            'file-journal',
            'file-journal-thismonth',
        ]);

        this.nav = [
            `${this.symbols.left}${this.prevMonth.link}`,
            this.nextMonth.link,
        ].join(this.symbols.sep) + this.symbols.right;

        this.title = this.thisMonth.nameCap;

        this.header = [
            Journal.link(Journal.dir, this.symbols.cal),
            Journal.link(this.path, this.thisMonth.nameCap),
            `(${this.thisMonth.nameEn})`,
        ].join(' ');
    }

    /**
     * Konfiguruje nieobsługiwany typ notatki.
     */
    setUnknown() {
        const message = `unsupported note title: ${this.filename}`;

        console.log(message);

        this.tags = 'journal/unknown';
        this.frontmatter = '';
        this.aliases = '[]';
        this.cssclasses = this.makeYamlList([
            'file-journal',
            'file-journal-unknown',
        ]);

        this.nav = '';
        this.title = this.filename;
        this.header = message;
    }

}

/**
 * Funkcja eksportowana dla Templatera.
 */
function makejournal(filename) {
    return new Journal(filename);
}

module.exports = makejournal;
