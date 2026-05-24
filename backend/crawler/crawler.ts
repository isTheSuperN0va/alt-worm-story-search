import * as fetcher from './fetcher';
import * as parser from './parserAo3';
import { Database } from "bun:sqlite";
import * as Logging from '../logger';


export function bootstrap(db: Database) {
    let ao3Fetcher = new fetcher.fetcher(fetcher.BaseURL.AO3);
    ao3Fetcher.fetchSite();
    let ao3Parser = new parser.ParserAo3(ao3Fetcher.baseUrl, db);
    let pageAmount: number = ao3Parser.getAmountOfPages();

    if (pageAmount === 0) return;

    Logging.info(Logging.Source.Crawler, 'Initializing bootstrapper')
    let percentageComplete: number = 0 / pageAmount;

    for (let i = 2; i <= pageAmount; i++) {
        ao3Parser = new parser.ParserAo3(ao3Fetcher.baseUrl + `?page=${i}`, db);
        ao3Parser.processPage()

        percentageComplete = i / pageAmount;
        Logging.info(Logging.Source.Crawler, `Completed page, status: ${Number(percentageComplete.toPrecision(2)) * 100}% (${i}/${pageAmount})`);
    }

}