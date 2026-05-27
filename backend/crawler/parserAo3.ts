import * as crawl from './parser.ts'
import * as Logging from '../logger.ts'
import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { sleep } from 'bun';
import * as fetcher from './fetcher.ts'


export class ParserAo3 extends crawl.Parser {

public delayMiliseconds: number = 1000 * 10;


private static SELECTOR_WORKS = 'li.work';
private static SELECTOR_TITLE = 'h4.heading > a:first-child';
private static SELECTOR_AUTHOR = 'h4.heading > a[rel="author"]';
private static SELECTOR_SUMMARY = 'blockquote.summary';
private static SELECTOR_CHAPTERS = 'dd.chapters > a';
private static SELECTOR_FANDOM = 'h5.fandoms > a';
private static SELECTOR_UPDATED = '.datetime';

private static SELECTOR_URL = 'h4.heading > a:first-child';
private static SELECTOR_RATING = 'dd.kudos > a';

public static BASE_URL = 'https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works';

private static FANDOM_BLACKLIST = [
    "Parahumans Series - Wildbow",
    "Worm",
    "Original Work"
]

// setupCrawling() {
//     let response: JSON;
//     this.setupScheduledCrawl(this.delayMiliseconds)
// }

public textBySelector(element: cheerio.Cheerio<Element>, selector: string) {
    return element.find(selector).text().trim()
}

public getStoryData(work: Element): crawl.StoryData {
    let wElement = this.$(work); 

    let title = this.formatTitle(this.textBySelector(wElement, ParserAo3.SELECTOR_TITLE));
    let author = this.textBySelector(wElement, ParserAo3.SELECTOR_AUTHOR);
    let summaries = this.textBySelector(wElement, ParserAo3.SELECTOR_SUMMARY);
    let chapters_released = this.textBySelector(wElement, 'dd.chapters > a');
    let fandom = this.handleAo3Fandom(wElement.find(ParserAo3.SELECTOR_FANDOM));
    let updated = this.textBySelector(wElement, ParserAo3.SELECTOR_UPDATED);

    let chapters_number: number = 0;

    if (Number.isNaN(Number(chapters_released))) {
        Logging.warn(Logging.Source.Crawler, `   Failed to get number of chapters in story ${title}, trying alternative...` )
        chapters_number = this.getAltChaptersReleased(this.$(work).find('dd.chapters').first().text());
        if (!chapters_number)
            Logging.error(Logging.Source.Crawler, "  Failure to get number of chapters");
    }

    chapters_number = Number(chapters_released)

    let data: crawl.StoryData = this.createStoryData(title!, author, summaries, chapters_number, updated, fandom);
    return data;

}

public getSourceData($: cheerio.CheerioAPI, work: Element): crawl.SourceData {
    let url = this.$(work).find(ParserAo3.SELECTOR_URL).attr('href')?.trim();
    let rating = this.$(work).find(ParserAo3.SELECTOR_RATING).text().trim().replace(",", "");
    let updated = this.$(work).find(ParserAo3.SELECTOR_UPDATED).text().trim();

    if (Number.isNaN(Number(rating))) {
        Logging.error(Logging.Source.Parser, '   Rating is NaN');
    }

    if (url === undefined) {
        Logging.error(Logging.Source.Parser, '   Url is undefined')
    }
    
    let data: crawl.SourceData = this.createSourceData(url!, Number(rating), updated) // for now i'll do this, but i should do more checking later
    return data;
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

public processPage(): void {
    Logging.info(Logging.Source.Crawler, 'Started processing page');
    let works: cheerio.Cheerio<Element> = this.$('li.work'); // ?, when i put a property here it spits out a type error, may be something to do with mutability

    if (!works)
        Logging.info(Logging.Source.Crawler, 'Did not get any story in the page');

    for (const work of works.toArray()) {
        Logging.info(Logging.Source.Parser, 'Started parsing story...')
        
        let storyData = this.getStoryData(work);
        let story_id: number | bigint | null = 0;

        if (!(this.doesStoryExist(storyData.title, storyData.author)))
            story_id = this.insertStoryInDatabase(storyData);
        else
            story_id = this.getStoryId(storyData.title, storyData.author);
        
        let sourceData = this.getSourceData(this.$, work);

        if (!(this.doesSourceExist(sourceData.url)))
            this.insertSouceInDatabase(story_id!, sourceData);
    }
    

}

handleAo3Fandom(elements: cheerio.Cheerio<Element>): string | null {
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

getAmountOfPages(): number {
    let pageAmountString = this.$('ol.pagination > li:nth-last-child(2)').first().text();
    console.log(this.$('ol.pagination > li:nth-last-child(2) > a:first-child').text());

    if (Number.isNaN(pageAmountString)) {
        Logging.error(Logging.Source.Parser, 'Failed to get a coherent page amount for bootstraping');
        return 0;
    }

    let pageAmount = Number(pageAmountString);
    Logging.info(Logging.Source.Parser, `Successfuly acquired page amount, string: ${pageAmountString}, number: ${pageAmount}`);
    return pageAmount;
}

formatTitle(title: string) {
    let formattedTitle = title.replace(/(\()((\w+\\\w+)|\w+|\w+\\)(\))/, "").trim();

    return formattedTitle;
}

}

debugger;