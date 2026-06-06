import * as crawl from './parser.ts'
import * as Logging from '../logger.ts'
import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { sleep } from 'bun';
import * as fetcher from './fetcher.ts'
import { Database } from 'bun:sqlite'
import { wormficDb } from '../database/wormficdb.ts';


export class ParserAo3 extends crawl.Parser {

public delayMiliseconds: number = 1000 * 10;

protected readonly SELECTOR_WORKS: string;
protected readonly SELECTOR_TITLE: string;
protected readonly SELECTOR_AUTHOR: string;
protected readonly SELECTOR_SUMMARY: string;
protected readonly SELECTOR_CHAPTERS: string;
protected readonly SELECTOR_FANDOM: string;
protected readonly SELECTOR_UPDATED: string;
protected readonly SELECTOR_WORDS: string;

protected readonly SELECTOR_URL: string;
protected readonly SELECTOR_RATING: string;

public static BASE_URL = 'https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works';

private static FANDOM_BLACKLIST = [
    "Parahumans Series - Wildbow",
    "Worm",
    "Original Work"
]

constructor(pageHtml: string, db: wormficDb, isVerbose: boolean) {
    super(pageHtml, db, isVerbose);

    this.SELECTOR_WORKS = 'li.work';
    this.SELECTOR_TITLE = 'h4.heading > a:first-child';
    this.SELECTOR_AUTHOR = 'h4.heading > a[rel="author"]';
    this.SELECTOR_SUMMARY = 'blockquote.summary';
    this.SELECTOR_CHAPTERS = 'dd.chapters > a';
    this.SELECTOR_FANDOM = 'h5.fandoms > a';
    this.SELECTOR_UPDATED = '.datetime';
    this.SELECTOR_WORDS = 'dd.words';

    this.SELECTOR_URL = 'h4.heading > a:first-child';
    this.SELECTOR_RATING = 'dd.kudos > a';
}


getAltChaptersReleased(chapters: string): number {
    Logging.info(Logging.Source.Parser, `Trying with ${chapters} `);
    let chapterInfo = chapters.split("/");
    Logging.info(Logging.Source.Parser, `Got ${chapterInfo[0]} and ${chapterInfo[1]} `)

    if (!chapterInfo) {
        Logging.error(Logging.Source.Parser, '   Chapter number returned as null');
        return 0;
    }
    if (Number.isNaN(chapterInfo[0])) {
        Logging.error(Logging.Source.Parser, '   Chapter number is NaN');
        return 0;
    }
    if (chapterInfo === undefined) {
        Logging.error(Logging.Source.Parser, '   Chapter number is undefined');
        return 0;
    }
    
    return Number(chapterInfo[0])!;
}

public checkPage(): boolean {
    Logging.info(Logging.Source.Parser, "Started checking page");
    let works: cheerio.Cheerio<Element> = this.$('li.work');

    for (const work of works.toArray()) {
        this.checkPossibleNewWork(work, true);
        
        let $work = this.$(work);

        let title = this.textBySelector($work, this.SELECTOR_TITLE);
        let author = this.textBySelector($work, this.SELECTOR_AUTHOR);
    
        Logging.info(Logging.Source.Parser, `Trying to get story info of ${title}`)
        let databaseWork = this.db.getStory(title, author);

        if (!databaseWork) {
            Logging.error(Logging.Source.Parser, "Failed to get database info on story")
            return true;
        }

        let chapters = Number(this.textBySelector($work, this.SELECTOR_CHAPTERS));
        let wordcount = Number(this.textBySelector($work, this.SELECTOR_WORDS).replaceAll(",", ""));

        if (databaseWork.chapters != chapters && databaseWork.wordcount != wordcount) {
            Logging.info(Logging.Source.Parser, "Updated story found");
            this.db.modifyStory(title, author, chapters, wordcount);

            return false;
        } 
    }

    return true;

}

public bootstrapPage(): void {
    Logging.info(Logging.Source.Crawler, 'Started processing page');
    let works: cheerio.Cheerio<Element> = this.$('li.work'); // ?, when i put a property here it spits out a type error, may be something to do with mutability

    if (!works)
        Logging.warn(Logging.Source.Crawler, 'Did not get any story in the page');

    for (const work of works.toArray()) {
       this.checkPossibleNewWork(work, false);
       
       
    
    }
    

}

handleFandom(elements: cheerio.Cheerio<Element>): string | null {
    let filteredFandoms = elements.toArray().filter((el) => !ParserAo3.FANDOM_BLACKLIST.includes(this.$(el).text()));

    if (filteredFandoms[0] === undefined) {
        Logging.info(Logging.Source.Crawler, "Processed non-crossover story.");
        return null;
    }

    return this.formatAo3Fandom(this.$(filteredFandoms[0]).text().trim());
}

formatAo3Fandom(fandom: string) {
    let formattedFandom = fandom.split('|')

    if (formattedFandom == null) {
        Logging.error(Logging.Source.Parser, "Formatting fandom name failed: returned null");
        return "ERROR";
    }

    if (formattedFandom == undefined) {
        Logging.error(Logging.Source.Parser, "Formatting fandom name failed: returned undefined");
        return "ERROR";

    }

    if (formattedFandom.length == 2)
        return formattedFandom[1]!.trim();

    return formattedFandom[0]!;
}

static async getAmountOfPages(): Promise<number> {
    let fetcherAo3 = new fetcher.fetcher(fetcher.BaseURL.AO3);
    await fetcherAo3.fetchSite();
    let $ = cheerio.load(fetcherAo3.dataCurrent);

    let pageAmountString = $('ol.pagination > li:nth-last-child(2)').first().text();
    console.log($('ol.pagination > li:nth-last-child(2) > a:first-child').text());

    if (Number.isNaN(pageAmountString)) {
        Logging.error(Logging.Source.Parser, 'Failed to get a coherent page amount for bootstraping');
        return 0;
    }

    let pageAmount = Number(pageAmountString);
    Logging.success(Logging.Source.Parser, `Acquired page amount, string: ${pageAmountString}, number: ${pageAmount}`);
    return pageAmount;
}

}

debugger;