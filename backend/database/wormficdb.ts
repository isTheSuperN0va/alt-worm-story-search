import { Database } from "bun:sqlite";
import * as Logging from "../logger";
import type { StoryData } from "../crawler/parser";
import type { SourceData } from "../crawler/parser";

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

export class wormficDb {
    connection: Database;

    constructor() {
        this.connection = new Database("./wormindex.db");
    }

    insertStoryInDatabase(data: StoryData): number | bigint {
        const insert = this.connection.query(`INSERT INTO stories 
        (title, author, summary, chapters, wordcount, updated, fandom) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`);

        Logging.info(Logging.Source.Database, `
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

        Logging.success(Logging.Source.Database, "Inserted story");
        return inserted.lastInsertRowid;
    }

    insertSouceInDatabase(story_id: number | bigint, data: SourceData): number | bigint {
        const insert = this.connection.query(`INSERT INTO sources 
        (story_id, url, rating, updated)
        VALUES (?, ?, ?, ?)`);

        Logging.info(Logging.Source.Database, `
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

        Logging.success(Logging.Source.Database ,'Inserted source');
        return inserted.lastInsertRowid;
    }

    getStory(title: string, author: string) {
        const query = this.connection.query(`
            SELECT * FROM stories
            WHERE title = ? AND author = ?`);

        const row = query.get(title, author);
        return row as DatabaseStoryRow;
    }

    doesStoryExist(title: string, author: string): boolean {
        let row = this.getStory(title, author);

        if (row)
            return true;
        else 
            return false;
    }

    doesSourceExist(url: string): boolean {
        const query = this.connection.query(`
            SELECT * FROM sources
            WHERE url = ?`);

        const row = query.get(url);

        if (row) {
            Logging.info(Logging.Source.Database, 'Source already exists');
            return true;
        }
        else {
            Logging.info(Logging.Source.Database, 'Source does not exists');
            return false;

        }
    }

    getStoryId(title: string, author: string): number | bigint | null {
        const query = this.connection.query(`
            SELECT id FROM stories
            WHERE title = ? AND author = ?`);
        
        const row = query.get(title, author) as { id: number | bigint} | null;

        if (!row) {
            Logging.error(Logging.Source.Database, 'Failed to get story_id')
            return null;
        }

        return row.id;
    }

    public modifyStory(title: string, author: string, chapters: number, wordcount: number) {        
        let modify = this.connection.prepare(`UPDATE stories
            SET chapters = ?, wordcount = ?
            WHERE title = ? AND author = ?`);

        let modified = modify.run(chapters, wordcount, title, author);
        if (modified.changes == 0)
            Logging.error(Logging.Source.Database, "Failed to modify database")
        else 
            Logging.success(Logging.Source.Database, `Modified story ${title}`)
    }

}