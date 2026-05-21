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
    fandom: string,

    // url: string,
    // kudos: number,
    // wordcount: number
}

export class crawler {
    protected db: Database;
    public dataCurrent: string = "";

    constructor(db: Database) {
        this.db = db
    }

    setupScheduledCrawl(delayMiliseconds: number): void { 
        setInterval(() => this.fetchSite(), delayMiliseconds) }

        async fetchSite(): Promise<void> {
            const res = await fetch ("https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works");
            
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
        
        return data!;
    }

    createStoryData(title: string, author: string, summary: string, chapters_released: string, updated: string, fandom: string): StoryData {
        let storyData: StoryData = {
            title: title,
            author: author,
            summary: summary,
            chapters_released: Number(chapters_released),
            updated: updated,
            fandom: fandom,
        }

        Logging.info(Logging.LogSource.Parser, `
            Compiled story
            title: ${storyData.title};
            author: ${storyData.author};
            chapters: ${storyData.chapters_released};
            updated: ${storyData.updated};
            fandom: ${storyData.fandom ?? "None"};`);

        return storyData;
    }

    insertStoryInDatabase(data: StoryData) {
        const insert = this.db.query(`INSERT INTO stories 
        (title, author, summary, chapters_released, updated, fandom) 
        VALUES (?, ?, ?, ?, ?, ?)`);

        insert.run
        (
            data.title,
            data.author,
            data.summary,
            data.chapters_released,
            data.updated,
            data.fandom
        );

        Logging.info(Logging.LogSource.Database, "Inserted 20 stories of page 0");

    }

}

export class crawlerAo3 extends crawler {

public delayMiliseconds: number = 1000 * 10;

setupCrawling() {
    let response: JSON;
    this.setupScheduledCrawl(this.delayMiliseconds)
}

public formatPage(): void {
    const $ = cheerio.load(this.dataCurrent);

    const $titles = this.cheerioElementData($, 'h4.heading > a:first-child', 'title');
    const $authors = this.cheerioElementData($, 'h4.heading > a[rel="author"]', 'author');
    const $summaries = this.cheerioElementData($, 'blockquote.summary', 'summary');
    const $chapters_released = this.cheerioElementData($, 'dd.chapters > a', 'chapters_released');
    const $fandoms = this.handleAo3Fandoms($, '.fandoms.heading'); // <- funky shit here
    const $updated = this.cheerioElementData($, '.datetime', 'updated date'); // note to self: ao3 doesn't put published date on the page, wowie, i loooove ao3's ux design >:(


    // for now i'll do this, the above should only go if the check for 'does this story exist yet on the database?' fails
    
    
    let storiesData: StoryData[] = [];
    for (let i = 0; i < 20; i++) // change 20 to some variable that's calculated as the amount of stories per page.
        storiesData[i] = this.createStoryData($titles![i]!, $authors![i]!, $summaries![i]!, $chapters_released![i]!, $updated![i]!, $fandoms[i]!);


}

handleAo3Fandoms($: cheerio.CheerioAPI, selector: string): (string | undefined)[] {
    let elements = $(selector);


    let fandoms: (string | undefined)[] = [];
    

    for (let fandomBox of elements.toArray()) {
        $(fandomBox).children().first().remove();
        const filtered = $(fandomBox).children().filter((_, el) => $(el).text() !== "Parahumans Series - Wildbow").toArray();

        if ($(filtered).toArray().length === 0)
            fandoms.push(undefined);
        else
            if ($(filtered).toArray()[0] !== undefined)
                fandoms.push($($(filtered).toArray()[0]).text());


    }

    return fandoms!;
}


bootstrap() {

}

parsePage() {

}

}