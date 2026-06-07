import * as cheerio from 'cheerio'
import { Element } from "domhandler";
import { Database } from 'bun:sqlite'
import * as Logging from '../logger'
import { BaseURL } from './fetcher';
import { canHaveModifiers } from 'typescript';
import { wormficDb } from '../database/wormficdb';
import * as fetcher from './fetcher'

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



export abstract class Parser {
    protected db: wormficDb;
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
    protected static SELECTOR_PAGES: string;

    constructor(pageHtml: string, db: wormficDb, isVerbose: boolean) {
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
            Logging.error(Logging.Source.Parser, 'Rating is NaN');
        }
    
        if (url === undefined) {
            Logging.error(Logging.Source.Parser, 'Url is undefined')
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

        Logging.success(Logging.Source.Parser, `Created StoryData for ${storyData.title}`);

        return storyData;
    }

    createSourceData(url: string, rating: number, updated: string) {
        let fullUrl = 'https://archiveofourown.org' + url + '/navigate'
        
        let sourceData: SourceData = {
            url: fullUrl,
            rating: rating,
            updated: updated
        }

        Logging.success(Logging.Source.Parser, `Created SourceData for ${sourceData.url}`);
        return sourceData;
    }

    checkPossibleNewWork(work: Element, atCreated: boolean) {
        Logging.info(Logging.Source.Parser, 'Started parsing story...')
            
        let storyData = this.getStoryData(work);
        let story_id: number | bigint | null = 0;
    
        if (atCreated) storyData.updated = new Date().toDateString();
    
        if (!(this.db.doesStoryExist(storyData.title, storyData.author))) {
            Logging.info(Logging.Source.Database, `Story ${storyData.title} does not exist`);
            story_id = this.db.insertStoryInDatabase(storyData);
        }
        else {
            Logging.info(Logging.Source.Parser, `Story ${storyData.title} already exists`);
            story_id = this.db.getStoryId(storyData.title, storyData.author);
        }
        
        let sourceData = this.getSourceData(this.$, work);
    
        if (!(this.db.doesSourceExist(sourceData.url)))
            this.db.insertSouceInDatabase(story_id!, sourceData);
    }


    static async getAmountOfPages(url: BaseURL): Promise<number> {
        let fetcherAo3 = new fetcher.fetcher(url);
        await fetcherAo3.fetchSite();
        let $ = cheerio.load(fetcherAo3.dataCurrent);

        let pageAmountString = $(Parser.SELECTOR_PAGES).first().text();

        if (Number.isNaN(pageAmountString)) {
            Logging.error(Logging.Source.Parser, 'Failed to get a coherent page amount for bootstraping');
            return 0;
        }

        let pageAmount = Number(pageAmountString);
        Logging.success(Logging.Source.Parser, `Acquired page amount, string: ${pageAmountString}, number: ${pageAmount}`);
        return pageAmount;
    }
    
}

