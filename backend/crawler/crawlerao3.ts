import * as crawl from './crawler.ts'
import * as Logging from '../logger.ts'
import * as cheerio from 'cheerio'
import { Element } from "domhandler";

export class crawlerAo3 extends crawl.crawler {

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

public getStoryData($: cheerio.CheerioAPI, work: Element): crawl.StoryData {
    let title = $(work).find(crawlerAo3.SELECTOR_TITLE).text().trim();
    let author = $(work).find(crawlerAo3.SELECTOR_AUTHOR).text().trim();
    let summaries = $(work).find(crawlerAo3.SELECTOR_SUMMARY).text().trim();
    let chapters_released = $(work).find(crawlerAo3.SELECTOR_CHAPTERS).text().trim();
    let fandom = this.handleAo3Fandom($, $(work).find(crawlerAo3.SELECTOR_FANDOM));
    let updated = $(work).find(crawlerAo3.SELECTOR_UPDATED).text().trim();

    let chapters_number: number = 0;

    if (Number.isNaN(chapters_released)) {
        Logging.warn(Logging.LogSource.Crawler, `   Failed to get number of chapters in story ${title}, trying alternative...` )
        chapters_number = this.getAltChaptersReleased($(work).find('dd.chapters').text());
        if (!chapters_number)
            Logging.error(Logging.LogSource.Crawler, "  Failure to get number of chapters");
    }
    let data: crawl.StoryData = this.createStoryData(title, author, summaries, chapters_number, updated, fandom);
    return data;

}

public getSourceData($: cheerio.CheerioAPI, work: Element): crawl.SourceData {
    let url = $(work).find(crawlerAo3.SELECTOR_URL).attr('href')?.trim();
    let rating = $(work).find(crawlerAo3.SELECTOR_RATING).text().trim().replace(",", "");
    let updated = $(work).find(crawlerAo3.SELECTOR_UPDATED).text().trim();

    if (Number.isNaN(rating)) {
        Logging.error(Logging.LogSource.Parser, '   Rating is NaN');
    }

    if (url === undefined) {
        Logging.error(Logging.LogSource.Parser, '   Url is undefined')
    }
    
    let data: crawl.SourceData = this.createSourceData(url!, Number(rating), updated) // for now i'll do this, but i should do more checking later
    return data;
}

getAltChaptersReleased(chapters: string): number {
    Logging.info(Logging.LogSource.Parser, `Trying with ${chapters} `);
    let chapterInfo = chapters.split("/");
    Logging.info(Logging.LogSource.Parser, `Got ${chapterInfo[0]} and ${chapterInfo[1]} `)

    if (!chapterInfo) {
        Logging.error(Logging.LogSource.Parser, '   Chapter number returned as null');
        return 0;
    }
    if (Number.isNaN(chapterInfo[0])) {
        Logging.error(Logging.LogSource.Parser, '   Chapter number is NaN');
        return 0;
    }
    if (chapterInfo === undefined) {
        Logging.error(Logging.LogSource.Parser, '   Chapter number is undefined');
        return 0;
    }
    
    return Number(chapterInfo[0])!;
}

public processPage(): void {
    Logging.info(Logging.LogSource.Crawler, 'Started processing page');

    const $ = cheerio.load(this.dataCurrent);
    let works: cheerio.Cheerio<Element> = $('li.work'); // ?, when i put a property here it spits out a type error, may be something to do with mutability

    if (!works)
        Logging.info(Logging.LogSource.Crawler, 'Did not get any story in the page');

    for (const work of works.toArray()) {
        Logging.info(Logging.LogSource.Parser, 'Started parsing story...')
        
        let storyData = this.getStoryData($, work);
        let story_id: number | bigint | null = 0;

        if (!(this.doesStoryExist(storyData.title, storyData.author)))
            story_id = this.insertStoryInDatabase(storyData);
        else
            story_id = this.getStoryId(storyData.title, storyData.author);
        
        let sourceData = this.getSourceData($, work);
        if (!(this.doesSourceExist(sourceData.url)))
            this.insertSouceInDatabase(story_id!, sourceData);
    }
    

}

handleAo3Fandom($: cheerio.CheerioAPI, elements: cheerio.Cheerio<Element>): string | null {
    let filteredFandoms = elements.toArray().filter((el) => $(el).text() !== "Parahumans Series - Wildbow");

    if (filteredFandoms[0] === undefined) {
        Logging.error(Logging.LogSource.Crawler, "Processed non-crossover story.");
        return null;
    }

    return $(filteredFandoms[0]).text().trim();
}


bootstrap() {

}

parsePage() {

}

}