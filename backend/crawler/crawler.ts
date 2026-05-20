import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { Database } from 'bun:sqlite'

const ao3Url: string = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works";

type PageData = {
    stories: StoryData[]
}

type StoryData = {
    author: string,
    summary: string,
    chapters_released: number,
    updated: string,
    fandom: string,

    url: string,
    kudos: number,
    wordcount: number
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
        console.log("Fetched ao3 data")
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

    const $titles = this.cheerioElementData($, 'h4.heading:nth-child(1)');
    const $authors = this.cheerioElementData($, 'h4.heading:nth-child(2)');
    const $summaries = this.cheerioElementData($, '.blockquote:nth-child(1)');
    const $chapters_released = this.cheerioElementData($, '.stats:nth-child(6):nth-child(1)');
    const $fandoms = this.handleAo3Fandoms($, '.fandoms.heading'); // <- funky shit here
    const $updated = this.cheerioElementData($, '.datetime'); // note to self: ao3 doesn't put published date on the page, wowie, i loooove ao3's ux design >:(


    // for now i'll do this, the above should only go if the check for 'does this story exist yet on the database?' fails
    this.db.query(`INSERT INTO stories (title, author, summary, chapters_released, updated, fandom) VALUES (${$titles[0]}, ${$authors[0]}, ${$summaries[0]}, ${$chapters_released[0]}, ${$updated[0]}, ${$fandoms![0]})`)

}

handleAo3Fandoms($: cheerio.CheerioAPI, selector: string) {
    let elements = $(selector);


    let fandoms: (string | null)[] = [];
    
    if (elements === undefined) {
        console.log("Something went wrong when parsing Ao3 fandoms")
        return null;
    }

    

    for (let fandomBox of elements.toArray()) {
        $(fandomBox).children().first().remove();
        const filtered = $(fandomBox).children().filter((_, el) => $(el).text() !== "Parahumans Series - Wildbow").toArray();

        if ($(filtered).toArray().length === 0)
            fandoms.push(null);
        else
            if ($(filtered).toArray()[0] !== undefined)
                fandoms.push($($(filtered).toArray()[0]).text());


    }

    console.log(fandoms.length)
    




    

    return fandoms!;
}


bootstrap() {

}

parsePage() {

}

cheerioElementData($: cheerio.CheerioAPI, selector: string) {
    return $(selector).map((_, el) => $(el).text()).get();
}

}