import * as Logging from '../logger';

export enum BaseURL {
    AO3 = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works",
}

export class fetcher {
    public baseUrl: string = "";
    public dataCurrent: string = "";

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private setupScheduledCrawl(delayMiliseconds: number): void { 
            setInterval(() => this.fetchSite(), delayMiliseconds) }
    
    async fetchSite(suffix?: string): Promise<void> {
            const res = await fetch (this.baseUrl + suffix);
            
            this.dataCurrent = await res.text();
            Logging.info(Logging.Source.Http, "Fetched AO3 page")
    }
}