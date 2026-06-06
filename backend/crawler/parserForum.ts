import * as parser from './parser.ts';
import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { Database } from 'bun:sqlite';

const SELECTOR_WORK = '.structItem--story';

class ParserForum extends parser.Parser {
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

    constructor(pageHtml: string, db: Database, isVerbose: boolean) {
        super(pageHtml, db, isVerbose);
    
        this.SELECTOR_WORKS = 'div.structItem--story';
        this.SELECTOR_TITLE = 'div.structItem--title > a';
        this.SELECTOR_AUTHOR = 'li > a.username';
        this.SELECTOR_SUMMARY = 'span.snippet-story-content';
        this.SELECTOR_CHAPTERS = 'dl.pairs--rows:nth-child(3) > dd';
        this.SELECTOR_FANDOM = 'structItem-tagBlock';
        this.SELECTOR_UPDATED = 'story-ui--new-threadmarks > time';
        this.SELECTOR_WORDS = 'dl.pairs--rows:nth-child(1) > dd';
    
        this.SELECTOR_URL = 'div.structItem--title > a';
        this.SELECTOR_RATING = 'dl.pairs--rows:nth-child(3) > dd';
    }

    processPage() {
        let works = this.$(SELECTOR_WORK)

        for (const work of works.toArray()) {

        }
    }

    handleFandom(elements: cheerio.Cheerio<Element>): string | null {
        return "placeholder";
    }

    getAltChaptersReleased(text: string): number {
        return 0;
    }


}