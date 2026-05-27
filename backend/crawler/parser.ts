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

    // url: string,
    // kudos: number,
    // wordcount: number
}

export type SourceData = {
    url: string,
    rating: number,
    updated: string 
}

export class Parser {
    protected db: Database;
    protected $: cheerio.CheerioAPI;
    protected isVerbose: boolean = true;

    constructor(pageHtml: string, db: Database, isVerbose: boolean) {
        this.db = db
        this.$ = cheerio.load(pageHtml);
        this.isVerbose = isVerbose;
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

    createStoryData(title: string, author: string, summary: string, chapters_released: number, updated: string, fandom: string | null): StoryData {
        let storyData: StoryData = {
            title: title,
            author: author,
            summary: summary,
            chapters_released: chapters_released,
            updated: updated,
            fandom: fandom,
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
        (title, author, summary, chapters_released, updated, fandom) 
        VALUES (?, ?, ?, ?, ?, ?)`);

        if (this.isVerbose) Logging.info(Logging.Source.Database, `
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

    doesStoryExist(title: string, author: string): boolean {
        const query = this.db.query(`
            SELECT * FROM stories
            WHERE title = ? AND author = ?`);

        const row = query.get(title, author);

        if (row) {
            Logging.info(Logging.Source.Database, '  Story already exists');
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

    
}

