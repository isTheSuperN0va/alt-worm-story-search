import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { Database } from 'bun:sqlite'
import * as Logging from '../logger'

const ao3Url: string = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works";

type PageData = {
    stories: StoryData[]
}

type StoryData = {
    title: string,
    author: string,
    summary: string,
    chapters_released: number,
    updated: string,
    fandom: string | null,

    // url: string,
    // kudos: number,
    // wordcount: number
}

type SourceData = {
    url: string,
    rating: number,
    updated: string 
}

export class crawler {
    protected db: Database;
    public dataCurrent: string = "";

    constructor(db: Database) {
        this.db = db
    }

    // setupScheduledCrawl(delayMiliseconds: number): void { 
    //     setInterval(() => this.fetchSite(), delayMiliseconds) }

    async fetchSite(baseUrl: string): Promise<void> {
            const res = await fetch (`${baseUrl}`);
            
            this.dataCurrent = await res.text();
            Logging.info(Logging.LogSource.Http, "Fetched AO3 page")
    }

    cheerioElementData($: cheerio.CheerioAPI, selector: string, label: string) {
        let data: string[] = [];

        if ($(selector) === undefined) {
            Logging.error(Logging.LogSource.Crawler, `Failed to get page element ${label} with jQuery`);
            return;
        }

        data = $(selector).map((_, el) => $(el).text().trim()).get(); 
        
        if (selector === 'dd.chapters > a') for (const datai of data) Logging.info(Logging.LogSource.Crawler, datai);

        return data!;
    }

    createStoryData(title: string, author: string, summary: string, chapters_released: number, updated: string, fandom: string | null): StoryData {
        let storyData: StoryData = {
            title: title,
            author: author,
            summary: summary,
            chapters_released: chapters_released,
            updated: updated,
            fandom: fandom,
        }

        Logging.info(Logging.LogSource.Parser, `    Created StoryData for ${storyData.title}`);

        return storyData;
    }

    createSourceData(url: string, rating: number, updated: string) {
        let sourceData: SourceData = {
            url: url,
            rating: rating,
            updated: updated
        }

        Logging.info(Logging.LogSource.Parser, `    Created SourceData for ${sourceData.url}`);
        return sourceData;
    }

    insertStoryInDatabase(data: StoryData): number | bigint {
        const insert = this.db.query(`INSERT INTO stories 
        (title, author, summary, chapters_released, updated, fandom) 
        VALUES (?, ?, ?, ?, ?, ?)`);

        Logging.info(Logging.LogSource.Database, `
            Inserting story;
            title: ${data.title};
            author: ${data.author};
            chapters: ${data.chapters_released};
            updated: ${data.updated};
            fandom: ${data.fandom ?? "None"};`);

        const inserted = insert.run
        (
            data.title,
            data.author,
            data.summary,
            data.chapters_released,
            data.updated,
            data.fandom
        );

        Logging.info(Logging.LogSource.Database, "  Success");
        return inserted.lastInsertRowid;
    }

    insertSouceInDatabase(story_id: number | bigint, data: SourceData): number | bigint {
        const insert = this.db.query(`INSERT INTO sources 
        (story_id, url, rating, updated)
        VALUES (?, ?, ?, ?)`);

        Logging.info(Logging.LogSource.Database, `
            Inserting source;
            url: ${data.url};
            rating: ${data.rating};
            updated: ${data.updated};`)

        const inserted = insert.run(
            story_id,
            data.url,
            data.rating,
            data.updated
        );

        Logging.info(Logging.LogSource.Database ,'  Success');
        return inserted.lastInsertRowid;
    }

    doesStoryExist(title: string, author: string): boolean {
        const query = this.db.query(`
            SELECT * FROM stories
            WHERE title = ? AND author = ?`);

        const row = query.get(title, author);

        if (row) {
            Logging.info(Logging.LogSource.Database, '  Story already exists');
            return true;
        }
        else {
            Logging.info(Logging.LogSource.Database, '  New story found')
            return false;
        }
    }

    doesSourceExist(url: string): boolean {
        const query = this.db.query(`
            SELECT * FROM sources
            WHERE url = ?`);

        const row = query.get(url);

        if (row) {
            Logging.info(Logging.LogSource.Database, '  Source already exists');
            return false;
        }
        else {
            Logging.info(Logging.LogSource.Database, '  Source does not exists');
            return true;

        }
    }

    getStoryId(title: string, author: string): number | bigint | null {
        const query = this.db.query(`
            SELECT id FROM stories
            WHERE title = ? AND author = ?`);
        
        const row = query.get(title, author) as { id: number | bigint} | null;

        if (!row) {
            Logging.error(Logging.LogSource.Database, ' Failed to get story_id')
            return null;
        }

        return row.id;
    }

    
}

export class crawlerAo3 extends crawler {

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

public getStoryData($: cheerio.CheerioAPI, work: Element): StoryData {
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
    let data: StoryData = this.createStoryData(title, author, summaries, chapters_number, updated, fandom);
    return data;

}

public getSourceData($: cheerio.CheerioAPI, work: Element): SourceData {
    let url = $(work).find(crawlerAo3.SELECTOR_URL).attr('href')?.trim();
    let rating = $(work).find(crawlerAo3.SELECTOR_RATING).text().trim();
    let updated = $(work).find(crawlerAo3.SELECTOR_UPDATED).text().trim();

    if (Number.isNaN(rating)) {
        Logging.error(Logging.LogSource.Parser, '   Rating is NaN');
    }

    if (url === undefined) {
        Logging.error(Logging.LogSource.Parser, '   Url is undefined')
    }
    
    let data: SourceData = this.createSourceData(url!, Number(rating), updated) // for now i'll do this, but i should do more checking later
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