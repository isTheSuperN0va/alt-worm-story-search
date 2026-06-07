import * as parser from './parser.ts';
import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { Database } from 'bun:sqlite';
import * as Logging from "../logger.ts";
import { wormficDb } from '../database/wormficdb.ts';

export class ParserForum extends parser.Parser {
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

    constructor(pageHtml: string, db: wormficDb, isVerbose: boolean) {
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
        ParserForum.SELECTOR_PAGES = 'ul.pageNav-main > li:nth-lastchild(1)';
    }

    bootstrapPage() {
        let works: cheerio.Cheerio<Element> = this.$('div.structItem--story');
        console.log(works.toArray());

        for (const work of works.toArray()) {
            this.checkPossibleNewWork(work, false);
        }
    }

    handleFandom(elements: cheerio.Cheerio<Element>): string | null {
        let titleText = this.$(elements).text();

        let index = titleText.search(/\((\w+|)\)/g);
        let fandomSlice = titleText.slice(index);

        fandomSlice.replace("(", "");
        fandomSlice.replace(")", "");
        fandomSlice.replace("x", "");
        fandomSlice.replace("X", "");

        let possibleFandoms: string[] = [""];
        
        possibleFandoms = fandomSlice.split("\\");

        if (!possibleFandoms || possibleFandoms[0] == undefined) {
            Logging.error(Logging.Source.Parser, "Something went wrong on parsing forum fandom")
            return null;
        }

        if (possibleFandoms[0].length === 0)
            possibleFandoms = fandomSlice.split(" ");

        if (!possibleFandoms || possibleFandoms[0] == undefined) {
            Logging.error(Logging.Source.Parser, "Something went wrong on parsing forum fandom")
            return null;
        }

        if (possibleFandoms[0].length === 0)
            return null;
        
        possibleFandoms.filter(el => el !== "worm");
        return possibleFandoms[0];

    }

    getAltChaptersReleased(text: string): number {
        return Number(text);
    }

}