import * as Logging from '../logger';

export enum BaseURL {
    AO3 = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works",
}

export class fetcher {
    baseUrl: string = "";
    dataCurrent: string = "";

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setupScheduledCrawl(delayMiliseconds: number): void { 
            setInterval(() => this.fetchSite(), delayMiliseconds) }
    
    async fetchSite(): Promise<void> {
            const res = await fetch (`${this.baseUrl}`);
            
            this.dataCurrent = await res.text();
            Logging.info(Logging.Source.Http, "Fetched AO3 page")
    }
}