import * as crawl from './parser.ts'
import * as Logging from '../logger.ts'
import * as cheerio from 'cheerio'
import { Element } from "domhandler";

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

// setupCrawling() {
//     let response: JSON;
//     this.setupScheduledCrawl(this.delayMiliseconds)
// }

public getStoryData(work: Element): crawl.StoryData {
    let title = this.$(work).find(ParserAo3.SELECTOR_TITLE).text().trim();
    let author = this.$(work).find(ParserAo3.SELECTOR_AUTHOR).text().trim();
    let summaries = this.$(work).find(ParserAo3.SELECTOR_SUMMARY).text().trim();
    let chapters_released = this.$(work).find(ParserAo3.SELECTOR_CHAPTERS).text().trim();
    let fandom = this.handleAo3Fandom(this.$(work).find(ParserAo3.SELECTOR_FANDOM));
    let updated = this.$(work).find(ParserAo3.SELECTOR_UPDATED).text().trim();

    let chapters_number: number = 0;

    if (Number.isNaN(chapters_released)) {
        Logging.warn(Logging.Source.Crawler, `   Failed to get number of chapters in story ${title}, trying alternative...` )
        chapters_number = this.getAltChaptersReleased(this.$(work).find('dd.chapters').text());
        if (!chapters_number)
            Logging.error(Logging.Source.Crawler, "  Failure to get number of chapters");
    }
    let data: crawl.StoryData = this.createStoryData(title, author, summaries, chapters_number, updated, fandom);
    return data;

}

public getSourceData($: cheerio.CheerioAPI, work: Element): crawl.SourceData {
    let url = this.$(work).find(ParserAo3.SELECTOR_URL).attr('href')?.trim();
    let rating = this.$(work).find(ParserAo3.SELECTOR_RATING).text().trim().replace(",", "");
    let updated = this.$(work).find(ParserAo3.SELECTOR_UPDATED).text().trim();

    if (Number.isNaN(rating)) {
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
    let filteredFandoms = elements.toArray().filter((el) => this.$(el).text() !== "Parahumans Series - Wildbow");

    if (filteredFandoms[0] === undefined) {
        Logging.error(Logging.Source.Crawler, "Processed non-crossover story.");
        return null;
    }

    return this.$(filteredFandoms[0]).text().trim();
}

getAmountOfPages(): number {
    let pageAmountString = this.$('ol.pagination > li:nth-last-child(2) > a').text().trim();

    if (Number.isNaN(pageAmountString)) {
        Logging.error(Logging.Source.Crawler, 'Failed to get a coherent page amount for bootstraping');
        return 0;
    }

    let pageAmount = Number(pageAmountString);
    return pageAmount;
}

}