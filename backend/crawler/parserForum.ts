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
    
        this.SELECTOR_WORKS = 'li.work';
        this.SELECTOR_TITLE = 'h4.heading > a:first-child';
        this.SELECTOR_AUTHOR = 'h4.heading > a[rel="author"]';
        this.SELECTOR_SUMMARY = 'blockquote.summary';
        this.SELECTOR_CHAPTERS = 'dd.chapters > a';
        this.SELECTOR_FANDOM = 'structItem-tagBlock';
        this.SELECTOR_UPDATED = '.datetime';
        this.SELECTOR_WORDS = 'dd.words';
    
        this.SELECTOR_URL = 'h4.heading > a:first-child';
        this.SELECTOR_RATING = 'dd.kudos > a';
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