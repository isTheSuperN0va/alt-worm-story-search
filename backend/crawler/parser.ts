import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { Database } from 'bun:sqlite'
import * as Logging from '../logger'
import { BaseURL } from './fetcher';

const ao3Url: string = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works";

export type StoryData = {
    title: string,
    author: string,
    summary: string,
    chapters_released: number,
    updated: string,
    fandom: string | null,
    wordcount: number
    // url: string,
    // kudos: number,
    // wordcount: number
}

export type SourceData = {
    url: string,
    rating: number,
    updated: string 
}

type DatabaseStoryRow = {
    id: number,
    title: string,
    author: string,
    summary: string,
    chapters: number,
    wordcount: number,
    updated: string,
    fandom: string
}

export abstract class Parser {
    protected db: Database;
    protected $: cheerio.CheerioAPI;
    protected isVerbose: boolean = true;

    protected abstract readonly SELECTOR_WORKS: string;
    protected abstract readonly SELECTOR_TITLE: string;
    protected abstract readonly SELECTOR_AUTHOR: string;
    protected abstract readonly SELECTOR_SUMMARY: string;
    protected abstract readonly SELECTOR_CHAPTERS: string;
    protected abstract readonly SELECTOR_FANDOM: string;
    protected abstract readonly SELECTOR_UPDATED: string;
    protected abstract readonly SELECTOR_WORDS: string;

    protected abstract readonly SELECTOR_URL: string;
    protected abstract readonly SELECTOR_RATING: string;

    constructor(pageHtml: string, db: Database, isVerbose: boolean) {
        this.db = db
        this.$ = cheerio.load(pageHtml);
        this.isVerbose = isVerbose;
    }

    abstract handleFandom(elements: cheerio.Cheerio<Element>): string | null;
    abstract getAltChaptersReleased(text: string): number

    public getStoryData(work: Element): StoryData {
        let wElement = this.$(work); 
    
        let title = this.formatTitle(this.textBySelector(wElement, this.SELECTOR_TITLE));
        let author = this.textBySelector(wElement, this.SELECTOR_AUTHOR);
        let summaries = this.textBySelector(wElement, this.SELECTOR_SUMMARY);
        let chapters_released = this.textBySelector(wElement, this.SELECTOR_CHAPTERS);
        let fandom = this.handleFandom(wElement.find(this.SELECTOR_FANDOM));
        let updated = this.textBySelector(wElement, this.SELECTOR_UPDATED);
        let wordcount = Number(this.textBySelector(wElement, this.SELECTOR_WORDS).replaceAll(",", ""));
    
        let chapters_number: number = 0;
    
        if (Number.isNaN(Number(chapters_released)) || chapters_released.length === 0) {


            Logging.warn(Logging.Source.Crawler, `   Failed to get number of chapters in story ${title}, trying alternative...` )
            chapters_number = this.getAltChaptersReleased(this.$(work).find('dd.chapters').text());
            if (!chapters_number || chapters_number == 0)
                Logging.error(Logging.Source.Crawler, "  Failure to get number of chapters");
        }
        else {
            chapters_number = Number(chapters_released)
        }
    
    
        let data: StoryData = this.createStoryData(title!, author, summaries, chapters_number, updated, fandom, wordcount);
        return data;
    
    }
    
    public getSourceData($: cheerio.CheerioAPI, work: Element): SourceData {
        let url = this.$(work).find(this.SELECTOR_URL).attr('href')?.trim();
        let rating = this.$(work).find(this.SELECTOR_RATING).text().trim().replace(",", "");
        let updated = this.$(work).find(this.SELECTOR_UPDATED).text().trim();
    
        if (Number.isNaN(Number(rating))) {
            Logging.error(Logging.Source.Parser, '   Rating is NaN');
        }
    
        if (url === undefined) {
            Logging.error(Logging.Source.Parser, '   Url is undefined')
        }
        
        let data: SourceData = this.createSourceData(url!, Number(rating), updated) // for now i'll do this, but i should do more checking later
        return data;
    }

    protected textBySelector(element: cheerio.Cheerio<Element>, selector: string) {
        return element.find(selector).text().trim()
    }

    protected formatTitle(title: string) {
        let formattedTitle = title.replace(/(\()((\w+\\\w+)|\w+|\w+\\)(\))/, "").trim();

        return formattedTitle;
    }
    
    

    cheerioElementData($: cheerio.CheerioAPI, selector: string, label: string) {
        let data: string[] = [];

        if (this.$(selector) === undefined) {
            Logging.error(Logging.Source.Parser, `Failed to get page element ${label} with jQuery`);
            return;
        }

        data = this.$(selector).map((_, el) => this.$(el).text().trim()).get(); 
        
        if (selector === 'dd.chapters > a') for (const datai of data) Logging.info(Logging.Source.Parser, datai);

        return data!;
    }

    createStoryData(title: string, author: string, summary: string, chapters_released: number, updated: string, fandom: string | null, wordcount: number): StoryData {
        let storyData: StoryData = {
            title: title,
            author: author,
            summary: summary,
            chapters_released: chapters_released,
            updated: updated,
            fandom: fandom,
            wordcount: wordcount
        }

        Logging.info(Logging.Source.Parser, `    Created StoryData for ${storyData.title}`);

        return storyData;
    }

    createSourceData(url: string, rating: number, updated: string) {
        let fullUrl = 'https://archiveofourown.org' + url + '/navigate'
        
        let sourceData: SourceData = {
            url: fullUrl,
            rating: rating,
            updated: updated
        }

        Logging.info(Logging.Source.Parser, `    Created SourceData for ${sourceData.url}`);
        return sourceData;
    }

    insertStoryInDatabase(data: StoryData): number | bigint {
        const insert = this.db.query(`INSERT INTO stories 
        (title, author, summary, chapters, wordcount, updated, fandom) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`);

        if (this.isVerbose) Logging.info(Logging.Source.Database, `
            Inserting story;
            title: ${data.title};
            author: ${data.author ?? "Anonymous"};
            chapters: ${data.chapters_released};
            wordcount: ${data.wordcount};
            updated: ${data.updated};
            fandom: ${data.fandom ?? "None"};
            `);

        const inserted = insert.run
        (
            data.title,
            data.author,
            data.summary,
            data.chapters_released,
            data.wordcount,
            data.updated,
            data.fandom,
        );

        Logging.info(Logging.Source.Database, "  Success");
        return inserted.lastInsertRowid;
    }

    insertSouceInDatabase(story_id: number | bigint, data: SourceData): number | bigint {
        const insert = this.db.query(`INSERT INTO sources 
        (story_id, url, rating, updated)
        VALUES (?, ?, ?, ?)`);

        if (this.isVerbose) Logging.info(Logging.Source.Database, `
            Inserting source;
            url: ${data.url};
            rating: ${data.rating};
            updated: ${data.updated};`)

        const inserted = insert.run(
            story_id,
            data.url,
            data.rating + 1,
            data.updated
        );

        Logging.info(Logging.Source.Database ,'  Success');
        return inserted.lastInsertRowid;
    }

    getStory(title: string, author: string) {
        const query = this.db.query(`
            SELECT * FROM stories
            WHERE title = ? AND author = ?`);

        const row = query.get(title, author);
        return row as DatabaseStoryRow;
    }

    doesStoryExist(title: string, author: string): boolean {
        let row = this.getStory(title, author);

        if (row)
            return true;
        }
        else {
            Logging.info(Logging.Source.Database, '  New story found')
            return false;
        }
    }

    doesSourceExist(url: string): boolean {
        const query = this.db.query(`
            SELECT * FROM sources
            WHERE url = ?`);

        const row = query.get(url);

        if (row) {
            Logging.info(Logging.Source.Database, '  Source already exists');
            return true;
        }
        else {
            Logging.info(Logging.Source.Database, '  Source does not exists');
            return false;

        }
    }

    getStoryId(title: string, author: string): number | bigint | null {
        const query = this.db.query(`
            SELECT id FROM stories
            WHERE title = ? AND author = ?`);
        
        const row = query.get(title, author) as { id: number | bigint} | null;

        if (!row) {
            Logging.error(Logging.Source.Database, ' Failed to get story_id')
            return null;
        }

        return row.id;
    }

    public modifyStory(title: string, author: string, chapters: number, wordcount: number) {        
        let modify = this.db.prepare(`UPDATE stories
            SET chapters = ?, wordcount = ?
            WHERE title = ? AND author = ?`);

        let modified = modify.run(chapters, wordcount, title, author);
        if (modified.changes == 0)
            Logging.error(Logging.Source.Database, "Failed to modify database")
        else 
            Logging.error(Logging.Source.Database, `Modified story ${title}`)
    }

    
}

