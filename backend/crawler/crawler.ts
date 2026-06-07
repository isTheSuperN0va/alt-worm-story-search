import * as fetcher from './fetcher';
import * as parserAo3 from './parserAo3';
import { Database } from "bun:sqlite";
import * as Logging from '../logger';
import { sleep } from 'bun';
import type { wormficDb } from '../database/wormficdb';
import * as parser from './parser.ts'
import * as parserForum from './parserForum.ts';

export enum Bootstrap {
    AO3,
    SB,
}

export async function bootstrap(db: wormficDb) {
    let ao3Fetcher = new fetcher.fetcher(fetcher.BaseURL.AO3);
    let SBFetcher = new fetcher.fetcher(fetcher.BaseURL.SB);

    await ao3Fetcher.fetchSite(false);
    let pageAmountAo3: number = await parserAo3.ParserAo3.getAmountOfPages(Bootstrap.AO3, fetcher.BaseURL.AO3);
    let pageAmountSB: number = await parserForum.ParserForum.getAmountOfPages(Bootstrap.SB, fetcher.BaseURL.SB);

    Logging.info(Logging.Source.Crawler, 'Initializing bootstrapper')

    bootstrapSite(Bootstrap.AO3, ao3Fetcher, pageAmountAo3, db);
    bootstrapSite(Bootstrap.SB, SBFetcher, pageAmountSB, db);


    Logging.success(Logging.Source.Crawler, "Finished bootstrapping")
}

async function bootstrapSite(boot: Bootstrap, fetcher: fetcher.fetcher, pageAmount: number, db: wormficDb) {
    let percentageComplete: number = 0 / pageAmount;

    for (let i = 2; i <= pageAmount; i++) {
        switch (boot) {
            case Bootstrap.AO3:
                return
                // await fetcher.fetchSite(`?page=${i}`);
                // let ao3Parser = new parserAo3.ParserAo3(fetcher.dataCurrent, db, true);
                // ao3Parser.bootstrapPage()
            break;
            case Bootstrap.SB:
                await fetcher.fetchSite(true, `page-${2}`);
                let SBParser = new parserForum.ParserForum(fetcher.dataCurrent, db, true);
                SBParser.bootstrapPage()
            break;

        }

        percentageComplete = i / pageAmount;
        Logging.info(Logging.Source.Crawler, `Completed page, status: ${Number(percentageComplete.toPrecision(2)) * 100}% (${i}/${pageAmount})`);
        await sleep(1000 * 5)
    }

}

async function checkPages(db: wormficDb) {
    let notReachedEnd: boolean = true;

    let ao3Fetcher = new fetcher.fetcher(fetcher.BaseURL.AO3);

    let pagination: number = 1;
    while (notReachedEnd) {
        ao3Fetcher.fetchSite(false, `?page=${pagination}`)
        let IparserAo3 = new parserAo3.ParserAo3(ao3Fetcher.dataCurrent, db, false);
        notReachedEnd = IparserAo3.checkPage();
        pagination++;
        await sleep(5000);
    }

    Logging.success(Logging.Source.Crawler, "Reached end of updated stories for this round")
}

export function setupScheduledCrawler(db: wormficDb, interval: number) {
    setInterval(() => checkPages(db), interval);
}

//TODO
// *Remover parenteses em autor, titulos ok
// *Remover '|' das fandoms (priorizar direita) ok
// *Remover 'Original Work' e outros de fandom ok
// *url em source deve ser unico
