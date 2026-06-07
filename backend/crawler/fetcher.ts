import * as Logging from '../logger';
import { chromium } from 'playwright';

export enum BaseURL {
    AO3 = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works",
    SB = "https://forums.spacebattles.com/forums/worm.115/"
}

async function fetchWithPlaywright(url: string): Promise<string> {
    let headlessBrowser = await chromium.launch();
    let page = await headlessBrowser.newPage();

    page.goto(url, { waitUntil: 'networkidle'});

    await page.close();
    await headlessBrowser.close();

    return page.content();
}

export class fetcher {
    public baseUrl: string = "";
    public dataCurrent: string = "";

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }
    
    async fetchSite(headless: boolean, suffix?: string): Promise<void> {
            let fullUrl: string = this.baseUrl + (suffix ?? "");

            if (!headless) {
                const res = await fetch (fullUrl); 
                this.dataCurrent = await res.text();
            }
            else {
                this.dataCurrent = await fetchWithPlaywright(fullUrl)
            }
            
            Logging.info(Logging.Source.Http, "Fetched AO3 page")
    }
}