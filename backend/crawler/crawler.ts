import * as fetcher from './fetcher';
import * as parser from './parserAo3';
import { Database } from "bun:sqlite";
import * as Logging from '../logger';
import { sleep } from 'bun';


export async function bootstrap(db: Database) {
    let ao3Fetcher = new fetcher.fetcher(fetcher.BaseURL.AO3);
    await ao3Fetcher.fetchSite("");
    let ao3Parser = new parser.ParserAo3(ao3Fetcher.dataCurrent, db, false);
    let pageAmount: number = ao3Parser.getAmountOfPages();

    if (pageAmount === 0) return;

    Logging.info(Logging.Source.Crawler, 'Initializing bootstrapper')
    let percentageComplete: number = 0 / pageAmount;

    for (let i = 2; i <= pageAmount; i++) {
        ao3Fetcher.fetchSite(`?page=${i}`);
        ao3Parser = new parser.ParserAo3(ao3Fetcher.dataCurrent, db, true);
        ao3Parser.processPage()

        percentageComplete = i / pageAmount;
        Logging.info(Logging.Source.Crawler, `Completed page, status: ${Number(percentageComplete.toPrecision(2)) * 100}% (${i}/${pageAmount})`);
        await sleep(1000 * 5)
    }

}

//TODO
// *Remover parenteses em autor, titulos ok
// *Remover '|' das fandoms (priorizar direita) ok
// *Remover 'Original Work' e outros de fandom ok
// *url em source deve ser unico
