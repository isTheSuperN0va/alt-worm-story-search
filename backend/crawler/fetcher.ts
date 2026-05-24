import * as Logging from '../logger';

enum BaseURL {
    AO3 = "https://archiveofourown.org/tags/Parahumans%20Series%20-%20Wildbow/works",
}

class fetcher {
    baseUrl: string = "";
    dataCurrent: string = "";

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setupScheduledCrawl(delayMiliseconds: number): void { 
            setInterval(() => this.fetchSite(this.baseUrl), delayMiliseconds) }
    
    async fetchSite(baseUrl: string): Promise<void> {
            const res = await fetch (`${baseUrl}`);
            
            this.dataCurrent = await res.text();
            Logging.info(Logging.Source.Http, "Fetched AO3 page")
    }
}